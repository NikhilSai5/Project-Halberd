import { browser } from "wxt/browser";

export const POMODORO_STORAGE_KEY = "halberd_pomodoro";

export type PomodoroMode = "focus" | "rest";

export const DEFAULT_WORK_TIME = 25 * 60;
export const DEFAULT_REST_TIME = 5 * 60;

export interface PomodoroState {
  // started and not stopped/reset
  active: boolean;
  // currently counting down
  running: boolean;
  mode: PomodoroMode;
  workTime: number;
  restTime: number;
  // epoch ms when the current session ends (0 when not running)
  sessionEndsAt: number;
  // seconds remaining when paused (0 when not paused / running)
  pausedTimeLeft: number;
}

export const INACTIVE_POMODORO: PomodoroState = {
  active: false,
  running: false,
  mode: "focus",
  workTime: DEFAULT_WORK_TIME,
  restTime: DEFAULT_REST_TIME,
  sessionEndsAt: 0,
  pausedTimeLeft: DEFAULT_WORK_TIME,
};

export function cloneState(state: PomodoroState): PomodoroState {
  return { ...state };
}

export function getTotalTime(state: PomodoroState): number {
  return state.mode === "focus" ? state.workTime : state.restTime;
}

// Seconds remaining in the current session at the given time.
export function getTimeLeft(state: PomodoroState, now = Date.now()): number {
  if (state.running && state.sessionEndsAt > 0) {
    return Math.max(0, Math.ceil((state.sessionEndsAt - now) / 1000));
  }
  return state.pausedTimeLeft;
}

// 0..1 progress through the current session.
export function getProgress(state: PomodoroState, now = Date.now()): number {
  const total = getTotalTime(state);
  if (total <= 0) return 0;
  return Math.max(0, Math.min(1, 1 - getTimeLeft(state, now) / total));
}

// True once the current session has reached zero.
export function isSessionComplete(state: PomodoroState, now = Date.now()): boolean {
  return state.running && state.sessionEndsAt > 0 && state.sessionEndsAt <= now;
}

// Build the state that should be produced when the current session finishes.
export function advanceSession(state: PomodoroState): PomodoroState {
  const nextMode: PomodoroMode = state.mode === "focus" ? "rest" : "focus";
  const nextDuration = nextMode === "focus" ? state.workTime : state.restTime;
  return {
    ...cloneState(state),
    mode: nextMode,
    running: true,
    sessionEndsAt: Date.now() + nextDuration * 1000,
    pausedTimeLeft: 0,
  };
}

// Start (or resume) the current session.
export function startSession(state: PomodoroState): PomodoroState {
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
  const duration = getTotalTime(state);
  return {
    ...cloneState(state),
    active: true,
    running: true,
    sessionEndsAt: Date.now() + duration * 1000,
    pausedTimeLeft: 0,
  };
}

// Pause the running session.
export function pauseSession(state: PomodoroState, now = Date.now()): PomodoroState {
  if (!state.running) return state;
  return {
    ...cloneState(state),
    running: false,
    pausedTimeLeft: getTimeLeft(state, now),
    sessionEndsAt: 0,
  };
}

// Stop: full reset to focus mode, inactive, shows full focus time.
export function stopSession(state: PomodoroState): PomodoroState {
  return {
    ...cloneState(state),
    active: false,
    running: false,
    mode: "focus",
    sessionEndsAt: 0,
    pausedTimeLeft: state.workTime,
  };
}

// Reset: back to focus full time, inactive.
export function resetSession(state: PomodoroState): PomodoroState {
  return {
    ...cloneState(state),
    active: false,
    running: false,
    mode: "focus",
    sessionEndsAt: 0,
    pausedTimeLeft: state.workTime,
  };
}

export function setWorkTime(state: PomodoroState, seconds: number): PomodoroState {
  return { ...cloneState(state), workTime: Math.max(1, seconds) };
}

export function setRestTime(state: PomodoroState, seconds: number): PomodoroState {
  return { ...cloneState(state), restTime: Math.max(1, seconds) };
}

// ---------------------------------------------------------------
// Persistence / sync
// ---------------------------------------------------------------

export async function loadPomodoro(): Promise<PomodoroState> {
  try {
    if (browser?.storage?.local) {
      const stored = await browser.storage.local.get(POMODORO_STORAGE_KEY);
      const raw = stored[POMODORO_STORAGE_KEY];
      if (raw && typeof raw === "object") {
        return { ...INACTIVE_POMODORO, ...(raw as PomodoroState) };
      }
    }
  } catch {
    // ignored
  }
  return INACTIVE_POMODORO;
}

export async function savePomodoro(state: PomodoroState): Promise<void> {
  try {
    if (browser?.storage?.local) {
      await browser.storage.local.set({ [POMODORO_STORAGE_KEY]: state });
    }
  } catch {
    // ignored
  }
}

export function onPomodoroChange(cb: (state: PomodoroState) => void): () => void {
  const handler = (
    changes: Record<string, { oldValue?: any; newValue?: any }>,
    areaName?: string
  ) => {
    if ((!areaName || areaName === "local") && changes[POMODORO_STORAGE_KEY]?.newValue) {
      const raw = changes[POMODORO_STORAGE_KEY].newValue;
      if (raw && typeof raw === "object") {
        cb({ ...INACTIVE_POMODORO, ...(raw as PomodoroState) });
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
