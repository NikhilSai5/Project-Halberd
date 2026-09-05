import { browser } from "wxt/browser";
import { listGoogleEventsWithToken, readSharedGoogleSession } from "@/lib/googleIntegrations";

export interface CalendarNotificationSettings {
  enabled: boolean;
  minutesBefore: number;
}

export interface CalendarNotification {
  eventId: string;
  summary: string;
  startTime: number;
  minutesUntilStart: number;
  location?: string;
}

const SETTINGS_KEY = "halberd.calendarNotif.settings";
const NOTIFIED_KEY = "halberd.calendarNotif.notified";
const PENDING_KEY = "halberd.calendarNotif.pending";
const LAST_POLL_KEY = "halberd.calendarNotif.lastPoll";

export const DEFAULT_NOTIFICATION_SETTINGS: CalendarNotificationSettings = {
  enabled: false,
  minutesBefore: 10,
};

/** How far ahead to fetch events while searching for an alert. */
const LOOKAHEAD_MS = 6 * 60 * 60 * 1000;

/** Minimum gap between shared polls so open tabs do not all hit the API. */
const MIN_POLL_INTERVAL_MS = 25 * 1000;

function normalizeSettings(raw: unknown): CalendarNotificationSettings {
  const obj = (raw ?? {}) as Partial<CalendarNotificationSettings>;
  const minutes =
    typeof obj.minutesBefore === "number"
      ? Math.round(obj.minutesBefore)
      : DEFAULT_NOTIFICATION_SETTINGS.minutesBefore;
  return {
    enabled: Boolean(obj.enabled),
    minutesBefore:
      Number.isFinite(minutes) && minutes >= 1
        ? minutes
        : DEFAULT_NOTIFICATION_SETTINGS.minutesBefore,
  };
}

export async function loadNotificationSettings(): Promise<CalendarNotificationSettings> {
  try {
    const result = await browser.storage.local.get(SETTINGS_KEY);
    return normalizeSettings(result?.[SETTINGS_KEY]);
  } catch {
    return { ...DEFAULT_NOTIFICATION_SETTINGS };
  }
}

export async function saveNotificationSettings(
  settings: CalendarNotificationSettings,
): Promise<void> {
  await browser.storage.local.set({ [SETTINGS_KEY]: normalizeSettings(settings) });
  // Turning notifications off hides any currently displayed alert immediately.
  await clearPendingNotification();
}

export function onNotificationSettingsChange(
  cb: (settings: CalendarNotificationSettings) => void,
): () => void {
  const handler = (
    changes: Record<string, { newValue?: unknown }>,
    areaName?: string,
  ) => {
    if ((!areaName || areaName === "local") && SETTINGS_KEY in changes) {
      cb(normalizeSettings(changes[SETTINGS_KEY].newValue));
    }
  };
  try {
    browser.storage.onChanged.addListener(handler);
  } catch {
    // Ignored.
  }
  return () => {
    try {
      browser.storage.onChanged.removeListener(handler);
    } catch {
      // Ignored.
    }
  };
}

interface PendingRecord {
  notification: CalendarNotification;
  expiresAt: number;
}

export async function broadcastPendingNotification(
  notification: CalendarNotification,
  displayMs: number,
): Promise<void> {
  const record: PendingRecord = {
    notification,
    expiresAt: Date.now() + displayMs,
  };
  await browser.storage.local.set({ [PENDING_KEY]: record });
}

export async function clearPendingNotification(): Promise<void> {
  try {
    await browser.storage.local.remove(PENDING_KEY);
  } catch {
    // Ignored.
  }
}

export async function readPendingNotification(): Promise<CalendarNotification | null> {
  try {
    const result = await browser.storage.local.get(PENDING_KEY);
    const pending = result?.[PENDING_KEY] as PendingRecord | undefined;
    if (pending?.notification && pending.expiresAt > Date.now()) {
      return pending.notification;
    }
  } catch {
    // Ignored.
  }
  return null;
}

export function onPendingNotificationChange(
  cb: (notification: CalendarNotification | null) => void,
): () => void {
  const handler = (
    changes: Record<string, { oldValue?: unknown; newValue?: unknown }>,
    areaName?: string,
  ) => {
    if ((!areaName || areaName === "local") && !(PENDING_KEY in changes)) return;
    const next = changes[PENDING_KEY]?.newValue as PendingRecord | undefined;
    if (next?.notification && next.expiresAt > Date.now()) {
      cb(next.notification);
    } else {
      cb(null);
    }
  };
  try {
    browser.storage.onChanged.addListener(handler);
  } catch {
    // Ignored.
  }
  return () => {
    try {
      browser.storage.onChanged.removeListener(handler);
    } catch {
      // Ignored.
    }
  };
}

async function readNotified(): Promise<Record<string, number>> {
  try {
    const result = await browser.storage.local.get(NOTIFIED_KEY);
    const map = result?.[NOTIFIED_KEY] as Record<string, number> | undefined;
    return map && typeof map === "object" ? map : {};
  } catch {
    return {};
  }
}

async function writeNotified(map: Record<string, number>): Promise<void> {
  try {
    await browser.storage.local.set({ [NOTIFIED_KEY]: map });
  } catch {
    // Ignored.
  }
}

async function readLastPoll(): Promise<number | null> {
  try {
    const result = await browser.storage.local.get(LAST_POLL_KEY);
    const value = result?.[LAST_POLL_KEY];
    return typeof value === "number" ? value : null;
  } catch {
    return null;
  }
}

async function writeLastPoll(now: number): Promise<void> {
  try {
    await browser.storage.local.set({ [LAST_POLL_KEY]: now });
  } catch {
    // Ignored.
  }
}

/**
 * Fetches upcoming events and returns the soonest event whose alert window
 * (`start - minutesBefore`) has opened and that has not been alerted yet.
 * Marks returned events as notified so they are not re-broadcast by other tabs.
 * Self-throttles across tabs via a shared last-poll timestamp in storage.
 */
export async function findNextAlertableEvent(): Promise<CalendarNotification | null> {
  const settings = await loadNotificationSettings();
  if (!settings.enabled) return null;

  const session = await readSharedGoogleSession();
  if (!session || !session.accessToken || !session.connections.calendar) return null;

  const now = Date.now();
  const lastPoll = await readLastPoll();
  if (lastPoll !== null && now - lastPoll < MIN_POLL_INTERVAL_MS) return null;
  await writeLastPoll(now);

  const alertWindowMs = settings.minutesBefore * 60 * 1000;
  const range = {
    timeMin: new Date(now - 10 * 60 * 1000).toISOString(),
    timeMax: new Date(now + LOOKAHEAD_MS).toISOString(),
  };

  let events;
  try {
    events = await listGoogleEventsWithToken(session.accessToken, range);
  } catch {
    // A failed fetch must not crash the floating circle.
    return null;
  }

  const notified = await readNotified();
  let next: CalendarNotification | null = null;

  for (const event of events) {
    if (event.status === "cancelled" || !event.start?.dateTime) continue;

    const startTime = Date.parse(event.start.dateTime);
    if (Number.isNaN(startTime)) continue;
    const endValue = event.end?.dateTime;
    const endTime = endValue ? Date.parse(endValue) : startTime + 30 * 60 * 1000;
    if (Number.isNaN(endTime)) continue;

    const instanceId = `${event.id}__${startTime}`;
    if (notified[instanceId]) continue;

    const alertAt = startTime - alertWindowMs;
    if (now < alertAt) continue;
    if (now > startTime + 60 * 1000) continue;

    const candidate: CalendarNotification = {
      eventId: instanceId,
      summary: event.summary || "Untitled event",
      startTime,
      minutesUntilStart: Math.max(0, Math.round((startTime - now) / 60000)),
      location: event.location || undefined,
    };
    if (!next || candidate.startTime < next.startTime) {
      next = candidate;
    }
  }

  if (next) {
    notified[next.eventId] = next.startTime;
    const cutoff = now - 24 * 60 * 60 * 1000;
    for (const id of Object.keys(notified)) {
      if ((notified[id] ?? 0) < cutoff) delete notified[id];
    }
    await writeNotified(notified);
  }

  return next;
}