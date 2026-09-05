import { browser } from "wxt/browser";

export const FOCUS_MODE_STORAGE_KEY = "halberd_focus_mode";

export const DEFAULT_FOCUS_TIME = 25 * 60;

export interface FocusModeState {
  // started and not stopped/reset/completed
  active: boolean;
  // currently counting down
  running: boolean;
  // total session length in seconds
  duration: number;
  // epoch ms when the current session ends (0 when not running)
  sessionEndsAt: number;
  // seconds remaining when paused (0 when not paused / running)
  pausedTimeLeft: number;
}

export const INACTIVE_FOCUS_MODE: FocusModeState = {
  active: false,
  running: false,
  duration: DEFAULT_FOCUS_TIME,
  sessionEndsAt: 0,
  pausedTimeLeft: DEFAULT_FOCUS_TIME,
};

export function cloneState(state: FocusModeState): FocusModeState {
  return { ...state };
}

// Seconds remaining in the current session at the given time.
export function getTimeLeft(state: FocusModeState, now = Date.now()): number {
  if (state.running && state.sessionEndsAt > 0) {
    return Math.max(0, Math.ceil((state.sessionEndsAt - now) / 1000));
  }
  return state.pausedTimeLeft;
}

// 0..1 progress through the current session.
export function getProgress(state: FocusModeState, now = Date.now()): number {
  if (state.duration <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - getTimeLeft(state, now) / state.duration));
}

// True once the current session has reached zero.
export function isSessionComplete(state: FocusModeState, now = Date.now()): boolean {
  return state.running && state.sessionEndsAt > 0 && state.sessionEndsAt <= now;
}

// Start (or resume) the current session.
export function startSession(state: FocusModeState): FocusModeState {
  if (state.running) return state;
  if (state.pausedTimeLeft > 0) {
    return {
      ...cloneState(state),
      active: true,
      running: true,
      sessionEndsAt: Date.now() + state.pausedTimeLeft * 1000,
      pausedTimeLeft: 0,
    };
  }
  return {
    ...cloneState(state),
    active: true,
    running: true,
    sessionEndsAt: Date.now() + state.duration * 1000,
    pausedTimeLeft: 0,
  };
}

// Pause the running session.
export function pauseSession(state: FocusModeState, now = Date.now()): FocusModeState {
  if (!state.running) return state;
  return {
    ...cloneState(state),
    running: false,
    pausedTimeLeft: getTimeLeft(state, now),
    sessionEndsAt: 0,
  };
}

// Stop: inactive, back to full duration.
export function stopSession(state: FocusModeState): FocusModeState {
  return {
    ...cloneState(state),
    active: false,
    running: false,
    sessionEndsAt: 0,
    pausedTimeLeft: state.duration,
  };
}

// Reset: inactive, back to full duration (same visible result as stop for the circle).
export function resetSession(state: FocusModeState): FocusModeState {
  return {
    ...cloneState(state),
    active: false,
    running: false,
    sessionEndsAt: 0,
    pausedTimeLeft: state.duration,
  };
}

// Natural completion: session done, inactive, back to full duration.
export function completeSession(state: FocusModeState): FocusModeState {
  return {
    ...cloneState(state),
    active: false,
    running: false,
    sessionEndsAt: 0,
    pausedTimeLeft: state.duration,
  };
}

export function setDuration(state: FocusModeState, seconds: number): FocusModeState {
  return {
    ...cloneState(state),
    duration: Math.max(1, seconds),
  };
}

// ---------------------------------------------------------------
// Persistence / sync
// ---------------------------------------------------------------

export async function loadFocusMode(): Promise<FocusModeState> {
  try {
    if (browser?.storage?.local) {
      const stored = await browser.storage.local.get(FOCUS_MODE_STORAGE_KEY);
      const raw = stored[FOCUS_MODE_STORAGE_KEY];
      if (raw && typeof raw === "object") {
        return { ...INACTIVE_FOCUS_MODE, ...(raw as FocusModeState) };
      }
    }
  } catch {
    // ignored
  }
  return INACTIVE_FOCUS_MODE;
}

export async function saveFocusMode(state: FocusModeState): Promise<void> {
  try {
    if (browser?.storage?.local) {
      await browser.storage.local.set({ [FOCUS_MODE_STORAGE_KEY]: state });
    }
  } catch {
    // ignored
  }
}

export function onFocusModeChange(cb: (state: FocusModeState) => void): () => void {
  const handler = (
    changes: Record<string, { oldValue?: any; newValue?: any }>,
    areaName?: string
  ) => {
    if ((!areaName || areaName === "local") && changes[FOCUS_MODE_STORAGE_KEY]?.newValue) {
      const raw = changes[FOCUS_MODE_STORAGE_KEY].newValue;
      if (raw && typeof raw === "object") {
        cb({ ...INACTIVE_FOCUS_MODE, ...(raw as FocusModeState) });
      }
    }
  };
  try {
    browser?.storage?.onChanged?.addListener(handler);
  } catch {
    // ignored
  }
  return () => {
    try {
      browser?.storage?.onChanged?.removeListener(handler);
    } catch {
      // ignored
    }
  };
}