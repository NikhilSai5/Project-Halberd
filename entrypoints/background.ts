import { defineBackground } from 'wxt/utils/define-background';
import {
  addProductiveSessionToDB,
  getWeeklyGoals,
  updateProductiveSessionInDB,
} from '@/lib/db';
import { DEFAULT_AUTO_TRACKING_CONFIG, type AutoTrackingConfig } from '@/lib/weeklyGoalTypes';

const TRACKING_ALARM = 'halberd-tracking-tick';
const TRACKING_STATE_KEY = 'halberd.trackingState';
const DEFAULT_THRESHOLD_MS = 5 * 60 * 1000;
const DEFAULT_GRACE_PERIOD_MS = 30 * 1000;
const TESTING_MODE = true;

interface ActiveTabSession {
  tabId: number;
  windowId: number;
  domain: string;
  url: string;
  title: string;
  continuousStartTime: number;
  inactiveSince: number | null;
  hasRequestedContent: boolean;
  productiveSessionId?: string;
}

interface TrackingState {
  activeTabId: number | null;
  focusedWindowId: number | null;
  userIdle: boolean;
  sessions: ActiveTabSession[];
}

const emptyState = (): TrackingState => ({
  activeTabId: null,
  focusedWindowId: null,
  userIdle: false,
  sessions: [],
});

function getDomain(url?: string): string | null {
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    return parsed.hostname.toLowerCase().replace(/^www\./, '');
  } catch {
    return null;
  }
}

async function loadState(): Promise<TrackingState> {
  const stored = await browser.storage.local.get(TRACKING_STATE_KEY);
  const state = stored[TRACKING_STATE_KEY] as Partial<TrackingState> | undefined;
  return {
    ...emptyState(),
    ...state,
    sessions: Array.isArray(state?.sessions) ? state.sessions : [],
  };
}

async function saveState(state: TrackingState): Promise<void> {
  await browser.storage.local.set({ [TRACKING_STATE_KEY]: state });
}

async function getAutoTrackingConfig(): Promise<AutoTrackingConfig> {
  const goals = await browser.storage.local.get('weeklyGoals');
  const storedGoals = goals.weeklyGoals;

  if (Array.isArray(storedGoals)) {
    const activeGoal = storedGoals.find((goal) => !goal.completed);
    if (activeGoal?.autoTracking) return activeGoal.autoTracking;
  }

  try {
    const indexedGoals = await import('@/lib/db').then(({ getWeeklyGoals }) => getWeeklyGoals());
    const activeGoal = indexedGoals.find((goal) => !goal.completed);
    if (activeGoal?.autoTracking) return activeGoal.autoTracking;
  } catch {
    // The tracker remains disabled until a goal/config is available.
  }

  return { ...DEFAULT_AUTO_TRACKING_CONFIG };
}

async function resetSession(session: ActiveTabSession, state: TrackingState, now: number): Promise<void> {
  if (session.productiveSessionId) {
    const endTime = session.inactiveSince ?? now;
    await updateProductiveSessionInDB(session.productiveSessionId, {
      endTime,
      durationMs: Math.max(0, endTime - session.continuousStartTime),
    });
    session.productiveSessionId = undefined;
  }
  session.continuousStartTime = now;
  session.inactiveSince = null;
  session.hasRequestedContent = false;
  await saveState(state);
}

async function startOrResumeTab(tabId: number, state: TrackingState): Promise<void> {
  const tab = await browser.tabs.get(tabId).catch(() => null);
  if (!tab) return;

  const domain = getDomain(tab.url);
  if (!domain || tab.windowId !== state.focusedWindowId || state.userIdle) {
    state.activeTabId = tabId;
    await saveState(state);
    return;
  }

  const now = Date.now();
  const existing = state.sessions.find((session) => session.tabId === tabId);
  if (existing) {
    const gracePeriod = (await getAutoTrackingConfig()).gracePeriodMs || DEFAULT_GRACE_PERIOD_MS;
    if (existing.inactiveSince !== null && now - existing.inactiveSince > gracePeriod) {
      await resetSession(existing, state, now);
    } else {
      existing.inactiveSince = null;
      existing.url = tab.url ?? existing.url;
      existing.title = tab.title ?? existing.title;
    }
  } else {
    state.sessions.push({
      tabId,
      windowId: tab.windowId,
      domain,
      url: tab.url ?? '',
      title: tab.title ?? '',
      continuousStartTime: now,
      inactiveSince: null,
      hasRequestedContent: false,
    });
  }

  state.activeTabId = tabId;
  await saveState(state);
}

async function markInactive(state: TrackingState, tabId: number | null): Promise<void> {
  if (tabId === null) return;
  const session = state.sessions.find((item) => item.tabId === tabId);
  if (session && session.inactiveSince === null) session.inactiveSince = Date.now();
}

async function handleTick(): Promise<void> {
  const state = await loadState();
  const now = Date.now();
  const gracePeriod = (await getAutoTrackingConfig()).gracePeriodMs || DEFAULT_GRACE_PERIOD_MS;
  let stateChanged = false;

  for (const session of state.sessions) {
    if (session.inactiveSince !== null && now - session.inactiveSince > gracePeriod && session.productiveSessionId) {
      await updateProductiveSessionInDB(session.productiveSessionId, {
        endTime: session.inactiveSince,
        durationMs: Math.max(0, session.inactiveSince - session.continuousStartTime),
      });
      session.productiveSessionId = undefined;
      stateChanged = true;
    }
  }
  if (stateChanged) await saveState(state);

  if (state.activeTabId === null || state.focusedWindowId === null || state.userIdle) return;

  const session = state.sessions.find((item) => item.tabId === state.activeTabId);
  if (!session || session.inactiveSince !== null) return;

  const config = await getAutoTrackingConfig();
  if (!config.enabled) return;
}

async function handleTabActivated(tabId: number): Promise<void> {
  const state = await loadState();
  await markInactive(state, state.activeTabId);
  await startOrResumeTab(tabId, state);
  if (TESTING_MODE) void handleTick();
}

async function initializeActiveTab(): Promise<void> {
  const state = await loadState();
  const focusedWindow = await browser.windows.getLastFocused().catch(() => null);
  if (!focusedWindow?.id) return;

  state.focusedWindowId = focusedWindow.id;
  const tabs = await browser.tabs.query({ active: true, windowId: focusedWindow.id });
  const activeTab = tabs[0];
  if (activeTab?.id !== undefined) {
    await startOrResumeTab(activeTab.id, state);
  } else {
    await saveState(state);
  }
}

async function handleTabUpdated(tabId: number, changeInfo: { url?: string; title?: string }, tab: Browser.tabs.Tab): Promise<void> {
  const state = await loadState();
  const session = state.sessions.find((item) => item.tabId === tabId);
  if (!session) {
    if (tab.active) await startOrResumeTab(tabId, state);
    return;
  }

  if (changeInfo.url) {
    const domain = getDomain(changeInfo.url);
    if (!domain || domain !== session.domain) {
      if (session.productiveSessionId) {
        const endTime = session.inactiveSince ?? Date.now();
        await updateProductiveSessionInDB(session.productiveSessionId, {
          endTime,
          durationMs: Math.max(0, endTime - session.continuousStartTime),
        });
      }
      state.sessions = state.sessions.filter((item) => item.tabId !== tabId);
      await saveState(state);
      if (tab.active) await startOrResumeTab(tabId, state);
      return;
    }
    session.url = changeInfo.url;
    session.title = tab.title ?? session.title;
    if (tab.active && TESTING_MODE) void handleTick();
  } else if (changeInfo.title) {
    session.title = changeInfo.title;
  }
  await saveState(state);
}

export default defineBackground(() => {
  browser.runtime.onMessage.addListener((message: { type?: string; authUrl?: string }) => {
    if (message.type !== 'halberd-google-auth' || !message.authUrl) return undefined;
    return browser.identity.launchWebAuthFlow({
      interactive: true,
      url: message.authUrl,
    });
  });

  void initializeActiveTab();
  browser.alarms.create(TRACKING_ALARM, { periodInMinutes: 0.5 });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === TRACKING_ALARM) void handleTick();
  });

  browser.tabs.onActivated.addListener(({ tabId }) => void handleTabActivated(tabId));
  browser.tabs.onUpdated.addListener((tabId, changeInfo, tab) => void handleTabUpdated(tabId, changeInfo, tab));
  browser.tabs.onRemoved.addListener((tabId) => {
    void loadState().then(async (state) => {
      const session = state.sessions.find((item) => item.tabId === tabId);
      if (session?.productiveSessionId) {
        const endTime = session.inactiveSince ?? Date.now();
        await updateProductiveSessionInDB(session.productiveSessionId, {
          endTime,
          durationMs: Math.max(0, endTime - session.continuousStartTime),
        });
      }
      state.sessions = state.sessions.filter((session) => session.tabId !== tabId);
      if (state.activeTabId === tabId) state.activeTabId = null;
      await saveState(state);
    });
  });

  browser.windows.onFocusChanged.addListener((windowId) => {
    void loadState().then(async (state) => {
      if (windowId === browser.windows.WINDOW_ID_NONE) {
        await markInactive(state, state.activeTabId);
        state.focusedWindowId = null;
        await saveState(state);
        return;
      }

      state.focusedWindowId = windowId;
      const tabs = await browser.tabs.query({ active: true, windowId });
      const activeTab = tabs[0];
      if (activeTab?.id !== undefined) await startOrResumeTab(activeTab.id, state);
    });
  });

  browser.idle.onStateChanged.addListener((newState) => {
    void loadState().then(async (state) => {
      state.userIdle = newState !== 'active';
      if (state.userIdle) await markInactive(state, state.activeTabId);
      await saveState(state);
    });
  });
});
