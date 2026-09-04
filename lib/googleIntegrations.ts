import { browser } from "wxt/browser";
import { supabase } from "@/lib/supabase";

export const GOOGLE_CALENDAR_SCOPE = "https://www.googleapis.com/auth/calendar";
export const GOOGLE_TASKS_SCOPE = "https://www.googleapis.com/auth/tasks";

const tokenKey = (userId: string) => `halberd.google.tokens.${userId}`;
const providerTokenKey = (userId: string) => `halberd.google.provider-token.${userId}`;

export interface GoogleTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
}

export interface GoogleEvent {
  id: string;
  htmlLink?: string;
  summary?: string;
  description?: string;
  location?: string;
  colorId?: string;
  status?: string;
  start: { dateTime?: string; date?: string; timeZone?: string };
  end: { dateTime?: string; date?: string; timeZone?: string };
}

export interface GoogleTask {
  id: string;
  listId?: string;
  title: string;
  notes?: string;
  status: "needsAction" | "completed";
  due?: string;
  updated?: string;
}

export interface GoogleTaskList {
  id: string;
  title: string;
  updated?: string;
}

export interface GoogleConnectionState {
  calendar: boolean;
  tasks: boolean;
}

function getStoredTokens(userId: string): GoogleTokens | null {
  try {
    const raw = localStorage.getItem(tokenKey(userId));
    return raw ? JSON.parse(raw) as GoogleTokens : null;
  } catch {
    return null;
  }
}

function saveTokens(userId: string, accessToken: string, refreshToken?: string): void {
  localStorage.setItem(tokenKey(userId), JSON.stringify({
    accessToken,
    refreshToken,
    expiresAt: Date.now() + 55 * 60 * 1000,
  } satisfies GoogleTokens));
}

export function getGoogleConnection(userId?: string): GoogleConnectionState {
  if (!userId) return { calendar: false, tasks: false };
  const stored = localStorage.getItem(`halberd.google.connections.${userId}`);
  try {
    return stored ? JSON.parse(stored) as GoogleConnectionState : { calendar: false, tasks: false };
  } catch {
    return { calendar: false, tasks: false };
  }
}

function setConnection(userId: string, service: keyof GoogleConnectionState): void {
  localStorage.setItem(`halberd.google.connections.${userId}`, JSON.stringify({
    ...getGoogleConnection(userId),
    [service]: true,
  }));
}

async function getExtensionGoogleToken(): Promise<string | null> {
  const identity = browser.identity as typeof browser.identity & {
    getAuthToken?: (details: { interactive: boolean }) => Promise<string | { token: string }>;
  };
  if (!identity.getAuthToken) return null;
  const result = await identity.getAuthToken({ interactive: true });
  return typeof result === "string" ? result : result.token || null;
}

export async function removeGoogleConnection(userId: string, service: keyof GoogleConnectionState): Promise<void> {
  const next = { ...getGoogleConnection(userId), [service]: false };
  localStorage.setItem(`halberd.google.connections.${userId}`, JSON.stringify(next));
  if (next.calendar || next.tasks) return;

  const tokens = getStoredTokens(userId);
  localStorage.removeItem(tokenKey(userId));
  localStorage.removeItem(providerTokenKey(userId));
  if (tokens?.accessToken) {
    await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(tokens.accessToken)}`, { method: "POST" }).catch(() => {});
  }
}

export async function connectGoogle(userId: string, service: keyof GoogleConnectionState): Promise<void> {
  try {
    const extensionToken = await getExtensionGoogleToken();
    if (extensionToken) {
      saveTokens(userId, extensionToken);
      setConnection(userId, service);
      return;
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.toLowerCase().includes("oauth") || message.toLowerCase().includes("client")) {
      throw new Error("Configure VITE_GOOGLE_EXTENSION_CLIENT_ID with a Chrome Extension OAuth client ID, then rebuild the extension.");
    }
  }
  if (!supabase) throw new Error("Supabase is not configured.");
  const existing = getGoogleConnection(userId);
  const requestedScopes = new Set<string>([service === "calendar" ? GOOGLE_CALENDAR_SCOPE : GOOGLE_TASKS_SCOPE]);
  if (existing.calendar || service === "calendar") requestedScopes.add(GOOGLE_CALENDAR_SCOPE);
  if (existing.tasks || service === "tasks") requestedScopes.add(GOOGLE_TASKS_SCOPE);
  const scope = [...requestedScopes].join(" ");
  const redirectTo = browser.identity.getRedirectURL("oauth2");
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: scope,
      queryParams: { access_type: "offline", prompt: "consent", scope },
    },
  });
  if (error || !data.url) throw new Error(error?.message || "Unable to start Google authorization.");
  const callbackUrl = await browser.runtime.sendMessage({ type: "halberd-google-auth", authUrl: data.url }) as string;
  const parsed = new URL(callbackUrl);
  const hash = new URLSearchParams(parsed.hash.replace(/^#/, ""));
  const query = parsed.searchParams;
  const code = query.get("code") || hash.get("code");
  const accessToken = hash.get("access_token") || query.get("access_token");
  const refreshToken = hash.get("refresh_token") || query.get("refresh_token");
  const providerToken = hash.get("provider_token") || query.get("provider_token");
  const providerRefreshToken = hash.get("provider_refresh_token") || query.get("provider_refresh_token");
  let sessionData: Awaited<ReturnType<typeof supabase.auth.getSession>>["data"];
  let sessionError: Awaited<ReturnType<typeof supabase.auth.getSession>>["error"];
  if (code) {
    const exchanged = await supabase.auth.exchangeCodeForSession(code);
    sessionData = exchanged.data;
    sessionError = exchanged.error;
  } else {
    if (accessToken && refreshToken) {
      const restored = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      sessionData = restored.data;
      sessionError = restored.error;
    } else {
      const current = await supabase.auth.getSession();
      sessionData = current.data;
      sessionError = current.error;
      if (!sessionData.session) throw new Error("Google authorization did not return a valid session. Please try reconnecting again.");
    }
  }
  if (sessionError || !sessionData.session) throw new Error(sessionError?.message || "Unable to establish the Google session.");
  // Supabase can publish provider_token through onAuthStateChange immediately
  // after the exchange resolves, so allow that notification to finish first.
  await new Promise((resolve) => window.setTimeout(resolve, 0));
  const googleAccessToken = providerToken || sessionData.session.provider_token || localStorage.getItem(providerTokenKey(userId));
  if (!googleAccessToken) throw new Error("Google did not grant API access. Please approve the requested permission and try again.");
  saveTokens(userId, googleAccessToken, providerRefreshToken || sessionData.session.provider_refresh_token || undefined);
  setConnection(userId, service);
}

async function googleFetch<T>(userId: string, path: string, init?: RequestInit): Promise<T> {
  const tokens = getStoredTokens(userId);
  if (!tokens) throw new Error("Connect Google in Settings before using this integration.");
  const response = await fetch(`https://www.googleapis.com${path}`, {
    ...init,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${tokens.accessToken}`, ...init?.headers },
  });
  if (!response.ok) {
    if (response.status === 401) throw new Error("Google authorization expired. Reconnect this integration in Settings.");
    let detail = "";
    try {
      const body = await response.json() as { error?: { message?: string; errors?: { reason?: string }[] } };
      detail = body.error?.message || body.error?.errors?.[0]?.reason || "";
    } catch {
      // Keep the status-only message when Google returns a non-JSON response.
    }
    throw new Error(`Google API error (${response.status})${detail ? `: ${detail}` : "."}`);
  }
  return response.status === 204 ? undefined as T : await response.json() as T;
}

async function listAll<T>(userId: string, path: string, maxResults = 2500): Promise<T[]> {
  const values: T[] = [];
  let pageToken = "";
  do {
    const separator = path.includes("?") ? "&" : "?";
    const result = await googleFetch<{ items?: T[]; nextPageToken?: string }>(userId, `${path}${separator}maxResults=${maxResults}${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`);
    values.push(...(result.items || []));
    pageToken = result.nextPageToken || "";
  } while (pageToken);
  return values;
}

export const listGoogleEvents = (
  userId: string,
  range?: { timeMin: string; timeMax: string },
) => {
  const params = new URLSearchParams({
    singleEvents: "true",
    orderBy: "startTime",
    showDeleted: "false",
  });
  if (range) {
    params.set("timeMin", range.timeMin);
    params.set("timeMax", range.timeMax);
  }
  return listAll<GoogleEvent>(userId, `/calendar/v3/calendars/primary/events?${params.toString()}`);
};
export const createGoogleEvent = (userId: string, event: Omit<GoogleEvent, "id">) => googleFetch<GoogleEvent>(userId, "/calendar/v3/calendars/primary/events", { method: "POST", body: JSON.stringify(event) });
export const updateGoogleEvent = (userId: string, id: string, event: Partial<GoogleEvent>) => googleFetch<GoogleEvent>(userId, `/calendar/v3/calendars/primary/events/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(event) });
export const deleteGoogleEvent = (userId: string, id: string) => googleFetch<void>(userId, `/calendar/v3/calendars/primary/events/${encodeURIComponent(id)}`, { method: "DELETE" });

export async function listGoogleTasks(userId: string): Promise<GoogleTask[]> {
  const lists = await listGoogleTaskLists(userId);
  const tasks = await Promise.all(lists.map(async (list) => (await listAll<GoogleTask>(userId, `/tasks/v1/lists/${encodeURIComponent(list.id)}/tasks?showCompleted=true&showHidden=true`, 100)).map((task) => ({ ...task, listId: list.id }))));
  return tasks.flat();
}

export const updateGoogleTask = (userId: string, task: GoogleTask) => googleFetch<GoogleTask>(userId, `/tasks/v1/lists/${encodeURIComponent(task.listId || "@default")}/tasks/${encodeURIComponent(task.id)}`, { method: "PATCH", body: JSON.stringify({ title: task.title, notes: task.notes, status: task.status }) });
export const listGoogleTaskLists = (userId: string) => listAll<GoogleTaskList>(userId, "/tasks/v1/users/@me/lists", 100);
export const createGoogleTaskList = (userId: string, title: string) => googleFetch<GoogleTaskList>(userId, "/tasks/v1/users/@me/lists", { method: "POST", body: JSON.stringify({ title }) });
export const updateGoogleTaskList = (userId: string, list: GoogleTaskList) => googleFetch<GoogleTaskList>(userId, `/tasks/v1/users/@me/lists/${encodeURIComponent(list.id)}`, { method: "PUT", body: JSON.stringify({ title: list.title }) });
export const deleteGoogleTaskList = (userId: string, listId: string) => googleFetch<void>(userId, `/tasks/v1/users/@me/lists/${encodeURIComponent(listId)}`, { method: "DELETE" });
export const createGoogleTask = (userId: string, listId: string, task: Pick<GoogleTask, "title" | "notes" | "status">) => googleFetch<GoogleTask>(userId, `/tasks/v1/lists/${encodeURIComponent(listId)}/tasks`, { method: "POST", body: JSON.stringify(task) });
export const deleteGoogleTask = (userId: string, task: GoogleTask) => googleFetch<void>(userId, `/tasks/v1/lists/${encodeURIComponent(task.listId || "@default")}/tasks/${encodeURIComponent(task.id)}`, { method: "DELETE" });
