"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { userStorageKey } from "@/lib/userStorage";
import {
  type PomodoroState,
  INACTIVE_POMODORO,
  getTimeLeft,
  getTotalTime,
  isSessionComplete,
  advanceSession,
  startSession,
  pauseSession,
  stopSession,
  resetSession,
  setWorkTime as engineSetWorkTime,
  setRestTime as engineSetRestTime,
  loadPomodoro,
  savePomodoro,
} from "@/lib/pomodoro";

const CIRCUMFERENCE = 2 * Math.PI * 15.9155;
const DEFAULT_WORK_TIME = 25 * 60;
const DEFAULT_REST_TIME = 5 * 60;

interface Session {
  id: string;
  date: string;
  workDuration: number;
  restDuration: number;
  completedAt: string;
  type: "work" | "rest";
}

export default function Pomodoro() {
  const { user } = useAuth();

  const [state, setState] = useState<PomodoroState>(INACTIVE_POMODORO);
  const [now, setNow] = useState<number>(Date.now());
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showTimeEdit, setShowTimeEdit] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [history, setHistory] = useState<Session[]>([]);

  const circleRef = useRef<SVGPathElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const editPopupRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<PomodoroState>(state);
  stateRef.current = state;

  const workTime = state.workTime;
  const restTime = state.restTime;
  const isRunning = state.running;
  const isWorkSession = state.mode === "focus";
  const timeLeft = getTimeLeft(state, now);
  const currentTotalTime = getTotalTime(state);

  // Hydrate global pomodoro state (restores an in-progress session across tabs/pages)
  useEffect(() => {
    let cancelled = false;
    loadPomodoro().then((loaded) => {
      if (!cancelled) setState(loaded);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load per-user duration + history settings (for the edit popup / history view)
  useEffect(() => {
    if (!user) return;
    const storedWork = localStorage.getItem(userStorageKey(user.id, "pomodoro_work_time"));
    const storedRest = localStorage.getItem(userStorageKey(user.id, "pomodoro_rest_time"));
    const storedHistory = localStorage.getItem(userStorageKey(user.id, "pomodoro_history"));
    const nextWork = storedWork ? parseInt(storedWork, 10) : DEFAULT_WORK_TIME;
    const nextRest = storedRest ? parseInt(storedRest, 10) : DEFAULT_REST_TIME;
    setState((prev) => ({
      ...prev,
      workTime: nextWork,
      restTime: nextRest,
      ...(prev.active || prev.running
        ? {}
        : { mode: "focus" as const, sessionEndsAt: 0, pausedTimeLeft: nextWork }),
    }));
    if (storedHistory) {
      try { setHistory(JSON.parse(storedHistory)); } catch { setHistory([]); }
    } else setHistory([]);
  }, [user?.id]);

  // --------------------------------------------------
  // Persist per-user duration settings + history
  // --------------------------------------------------

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(
      userStorageKey(user.id, "pomodoro_work_time"),
      workTime.toString()
    );
    localStorage.setItem(
      userStorageKey(user.id, "pomodoro_rest_time"),
      restTime.toString()
    );
  }, [workTime, restTime, user?.id]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(
      userStorageKey(user.id, "pomodoro_history"),
      JSON.stringify(history)
    );
  }, [history, user?.id]);

  // --------------------------------------------------
  // Persist global pomodoro state (drives the floating circle
  // in every tab & page while a session is active)
  // --------------------------------------------------

  useEffect(() => {
    savePomodoro(state);
  }, [state]);

  // --------------------------------------------------
  // Tick: re-render while running and auto-advance modes.
  // The countdown is timestamp based (see lib/pomodoro) so
  // it stays accurate even when this page is in the background.
  // --------------------------------------------------

  const handleSessionComplete = useCallback(() => {
    const current = stateRef.current;
    const completedMode = current.mode;
    const finishedAt = new Date();

    setHistory((prev) => {
      const session: Session = {
        id: `${Date.now()}`,
        date: finishedAt.toLocaleDateString(),
        workDuration: completedMode === "focus" ? current.workTime : 0,
        restDuration: completedMode === "rest" ? current.restTime : 0,
        completedAt: finishedAt.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: completedMode === "focus" ? "work" as const : "rest" as const,
      };

      return [session, ...prev].slice(0, 50);
    });

    if (completedMode === "focus") {
      setSessionsCompleted((prev) => prev + 1);
    }

    setState((prev) => advanceSession(prev));
    setNow(Date.now());
  }, []);

  useEffect(() => {
    if (!isRunning) return;

    const id = window.setInterval(() => {
      const current = stateRef.current;
      if (isSessionComplete(current)) {
        handleSessionComplete();
      } else {
        setNow(Date.now());
      }
    }, 250);

    return () => window.clearInterval(id);
  }, [isRunning, handleSessionComplete]);

  // --------------------------------------------------
  // Progress ring
  // --------------------------------------------------

  useEffect(() => {
    if (!circleRef.current || currentTotalTime <= 0) {
      return;
    }

    const progress =
      ((currentTotalTime - timeLeft) / currentTotalTime) *
      CIRCUMFERENCE;

    circleRef.current.style.strokeDasharray =
      `${progress} ${CIRCUMFERENCE}`;
  }, [timeLeft, currentTotalTime]);

  // --------------------------------------------------
  // Play sound when timer reaches zero
  // --------------------------------------------------

  useEffect(() => {
    if (timeLeft === 0 && !isRunning) {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [timeLeft, isRunning]);

  // --------------------------------------------------
  // Close edit popup when clicking outside
  // --------------------------------------------------

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        editPopupRef.current &&
        !editPopupRef.current.contains(
          event.target as Node
        )
      ) {
        setShowTimeEdit(false);
      }
    };

    if (showTimeEdit) {
      document.addEventListener(
        "mousedown",
        handleClickOutside
      );
    }

    return () => {
      document.removeEventListener(
        "mousedown",
        handleClickOutside
      );
    };
  }, [showTimeEdit]);

  // --------------------------------------------------
  // Format time
  // --------------------------------------------------

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60)
      .toString()
      .padStart(2, "0");

    const secs = (seconds % 60)
      .toString()
      .padStart(2, "0");

    return `${mins}:${secs}`;
  }, []);

  // --------------------------------------------------
  // Start / Pause
  // --------------------------------------------------

  const handleStartPause = useCallback(() => {
    const current = stateRef.current;
    const nowRef = Date.now();

    if (current.running) {
      setState(pauseSession(current, nowRef));
    } else {
      setState(startSession(current));
    }
    setNow(Date.now());
  }, []);

  // --------------------------------------------------
  // Reset
  // --------------------------------------------------

  const handleReset = useCallback(() => {
    setState(resetSession(stateRef.current));
    setNow(Date.now());
  }, []);

  // --------------------------------------------------
  // Stop
  // --------------------------------------------------

  const handleStop = useCallback(() => {
    setState(stopSession(stateRef.current));
    setNow(Date.now());
  }, []);

  // --------------------------------------------------
  // Change work duration
  // --------------------------------------------------

  const handleWorkTimeChange = (minutes: number) => {
    const seconds = Math.max(1, minutes) * 60;

    setState((prev) => {
      const next = engineSetWorkTime(prev, seconds);
      if (!prev.running && prev.mode === "focus" && !prev.active) {
        next.pausedTimeLeft = seconds;
      }
      return next;
    });
  };

  // --------------------------------------------------
  // Change rest duration
  // --------------------------------------------------

  const handleRestTimeChange = (minutes: number) => {
    const seconds = Math.max(1, minutes) * 60;

    setState((prev) => {
      const next = engineSetRestTime(prev, seconds);
      if (!prev.running && prev.mode === "rest" && !prev.active) {
        next.pausedTimeLeft = seconds;
      }
      return next;
    });
  };

  // --------------------------------------------------
  // Clear history
  // --------------------------------------------------

  const clearHistory = () => {
    setHistory([]);
  };

  // --------------------------------------------------
  // Close history
  // --------------------------------------------------

  const handleHistoryClose = () => {
    setShowHistory(false);
  };

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="page-shell page-shell--centered text-on-background font-body-main relative items-center justify-center">

      <audio
        ref={audioRef}
        src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA="
      />

      <main className="page-main flex-1 flex flex-col justify-center items-center relative z-10">

        <div className="workspace-surface workspace-narrow pomodoro-panel w-full p-6 md:p-8 flex flex-col items-center">

          {/* Header */}
          <div className="pomodoro-header w-full flex justify-between items-center mb-8">

            <h1 className="page-title text-text-primary">
              Pomodoro
            </h1>

            {showHistory ? (
              <button
                type="button"
                onClick={handleHistoryClose}
                className="icon-button border border-border-subtle text-text-secondary hover:bg-surface-container-low hover:text-primary active:scale-95 transition-colors"
                aria-label="Back to timer"
              >
                <span className="material-symbols-outlined icon-action">
                  arrow_back
                </span>
              </button>
            ) : (
              <div className="flex items-center gap-3">

                {/* Edit */}
                <div
                  className="relative"
                  ref={editPopupRef}
                >

                  <button
                    type="button"
                    onClick={() =>
                      setShowTimeEdit(!showTimeEdit)
                    }
                    className="icon-button border border-border-subtle text-text-secondary hover:bg-surface-container-low hover:text-primary active:scale-95 transition-colors"
                    aria-expanded={showTimeEdit}
                    aria-label="Edit timer durations"
                  >
                    <span
                      className="material-symbols-outlined icon-action"
                      aria-hidden="true"
                    >
                      edit
                    </span>
                  </button>

                  {showTimeEdit && (
                    <div className="absolute right-0 top-full mt-2 z-20 w-56 bg-surface-white border border-border-subtle rounded-xl shadow-xl p-4 animate-fade-in">

                      <div className="space-y-4">

                        {/* Work */}
                        <div className="space-y-2">

                          <label className="font-label-secondary text-label-secondary text-text-secondary">
                            Work Time
                          </label>

                          <div className="flex items-center gap-2">

                            <input
                              type="number"
                              min="1"
                              max="120"
                              value={workTime / 60}
                              onChange={(e) =>
                                handleWorkTimeChange(
                                  parseInt(
                                    e.target.value
                                  ) || 1
                                )
                              }
                              onBlur={() =>
                                setShowTimeEdit(false)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  setShowTimeEdit(false);
                                }
                              }}
                              className="flex-1 form-control bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                              autoFocus
                            />

                            <span className="text-text-secondary">
                              min
                            </span>

                          </div>
                        </div>

                        {/* Rest */}
                        <div className="space-y-2">

                          <label className="font-label-secondary text-label-secondary text-text-secondary">
                            Rest Time
                          </label>

                          <div className="flex items-center gap-2">

                            <input
                              type="number"
                              min="1"
                              max="60"
                              value={restTime / 60}
                              onChange={(e) =>
                                handleRestTimeChange(
                                  parseInt(
                                    e.target.value
                                  ) || 1
                                )
                              }
                              onBlur={() =>
                                setShowTimeEdit(false)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  setShowTimeEdit(false);
                                }
                              }}
                              className="flex-1 form-control bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface appearance-none focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                            />

                            <span className="text-text-secondary">
                              min
                            </span>

                          </div>
                        </div>

                      </div>
                    </div>
                  )}

                </div>

                {/* History */}
                <button
                  type="button"
                  onClick={() =>
                    setShowHistory(true)
                  }
                  className="font-label-secondary text-label-secondary transition-colors flex items-center gap-1 hover:text-primary"
                >
                  History

                  <span
                    className="material-symbols-outlined icon-inline"
                    aria-hidden="true"
                  >
                    history
                  </span>
                </button>

              </div>
            )}

          </div>

          {/* Timer */}
          {!showHistory && (
            <>

              {/* Ring */}
              <div className="pomodoro-ring relative aspect-square flex items-center justify-center w-full max-w-[340px]">

                <svg
                  className="circular-chart absolute inset-0 w-full h-full"
                  viewBox="0 0 36 36"
                >

                  <path
                    className="circle-bg"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />

                  <path
                    ref={circleRef}
                    className={`circle ${
                      isWorkSession
                        ? "stroke-primary-container"
                        : "stroke-tertiary-container"
                    }`}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    style={{
                      strokeDasharray:
                        `0 ${CIRCUMFERENCE}`,
                      transition:
                        "stroke-dasharray .3s ease",
                    }}
                  />

                </svg>

                <div className="flex flex-col items-center z-10">

                  <span className="font-display-timer text-display-timer text-text-primary">
                    {formatTime(timeLeft)}
                  </span>

                  <span className="font-body-main text-body-main text-text-secondary mt-2">
                    {isWorkSession
                      ? "Focus Time"
                      : "Break Time"}
                  </span>

                  <div className="flex items-center gap-2 mt-3">

                    <span
                      className={`w-2 h-2 rounded-full ${
                        isWorkSession
                          ? "bg-primary"
                          : "bg-tertiary"
                      }`}
                    />

                    <span className="font-label-secondary text-label-secondary text-text-secondary">
                      {sessionsCompleted} sessions today
                    </span>

                  </div>

                </div>

              </div>

              {/* Controls */}
              <div className="pomodoro-controls mt-8">

                {/* Stop */}
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Stop timer"
                  disabled={
                    timeLeft === currentTotalTime &&
                    !isRunning
                  }
                  className={`pomodoro-control-btn pomodoro-stop-btn icon-button border border-error text-error hover:bg-error/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 ease-out ${
                    isRunning
                      ? "w-auto px-4 gap-2 opacity-100"
                      : "w-12 px-0 gap-0 opacity-60"
                  }`}
                >

                  <span
                    className="material-symbols-outlined icon-action"
                    style={{
                      fontVariationSettings:
                        "'FILL' 1",
                    }}
                  >
                    stop
                  </span>

                  <span
                    className="font-section-title text-section-title whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-300"
                    style={{
                      maxWidth: isRunning
                        ? "48px"
                        : "0px",
                      opacity: isRunning ? 1 : 0,
                    }}
                  >
                    Stop
                  </span>

                </button>

                {/* Start / Pause */}
                <button
                  type="button"
                  onClick={handleStartPause}
                  aria-label={
                    isRunning
                      ? "Pause timer"
                      : "Start timer"
                  }
                  className={`button-prominent bg-secondary-container text-on-secondary-container font-section-title text-section-title hover:bg-primary-fixed active:scale-95 border border-secondary-fixed-dim flex items-center gap-2 transition-all duration-300 ease-out ${
                    isRunning
                      ? "w-14 px-0 min-w-0 gap-0"
                      : "w-auto px-6 min-w-[140px] gap-2"
                  }`}
                >

                  <span
                    className="material-symbols-outlined icon-action"
                    aria-hidden="true"
                    style={{
                      fontVariationSettings:
                        "'FILL' 1",
                    }}
                  >
                    {isRunning
                      ? "pause"
                      : "play_arrow"}
                  </span>

                  <span
                    className="whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-300"
                    style={{
                      maxWidth: isRunning
                        ? "0px"
                        : "48px",
                      opacity: isRunning ? 0 : 1,
                    }}
                  >
                    {isRunning
                      ? "Pause"
                      : "Start"}
                  </span>

                </button>

                {/* Reset */}
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Reset timer"
                  className="pomodoro-control-btn pomodoro-reset-btn icon-button w-12 px-0 border border-border-subtle text-text-secondary hover:bg-surface-container-low active:scale-95 flex items-center justify-center transition-all duration-300 ease-out"
                >
                  <span className="material-symbols-outlined icon-action">
                    restart_alt
                  </span>
                </button>

              </div>

              {/* Session Indicators */}
              <div
                className="pomodoro-sessions mt-6 flex items-center gap-2"
                role="group"
                aria-label="Pomodoro session progress"
              >
                {/* {[1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i <= sessionsCompleted
                        ? "bg-primary-container"
                        : "bg-surface-container-high"
                    }`}
                  />
                ))} */}
              </div>

            </>
          )}

          {/* History */}
          {showHistory && (
            <div className="pomodoro-history-view w-full flex flex-col animate-fade-in">

              <div className="flex justify-between items-center mb-4">

                <h3 className="section-heading text-text-primary">
                  Session History
                </h3>

                {history.length > 0 && (
                  <button
                    onClick={clearHistory}
                    className="text-error hover:underline font-label-secondary text-label-secondary"
                  >
                    Clear All
                  </button>
                )}

              </div>

              <div className="flex-1 overflow-y-auto space-y-2">

                {history.length === 0 ? (

                  <div className="flex flex-col items-center justify-center h-full text-text-muted">

                    <span className="material-symbols-outlined text-6xl mb-4">
                      history
                    </span>

                    <div className="font-body-main text-body-main text-text-secondary">
                      No sessions completed yet
                    </div>

                    <div className="font-caption-metadata text-caption-metadata text-text-muted mt-1">
                      Complete a focus session to see it here
                    </div>

                  </div>

                ) : (

                  history.map((session) => (

                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-surface-white rounded-lg border border-border-subtle hover:bg-surface-container-low transition-colors"
                    >

                      <div className="flex items-center gap-3 min-w-0">

                        <span
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 ${
                            session.type === "work"
                              ? "bg-primary-container text-primary"
                              : "bg-tertiary-container text-tertiary"
                          }`}
                        >

                          {session.type === "work" ? (

                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontVariationSettings:
                                  "'FILL' 1",
                              }}
                            >
                              psychology
                            </span>

                          ) : (

                            <span
                              className="material-symbols-outlined"
                              style={{
                                fontVariationSettings:
                                  "'FILL' 1",
                              }}
                            >
                              coffee
                            </span>

                          )}

                        </span>

                        <div className="min-w-0">

                          <div className="font-body-main text-body-main text-text-primary truncate">
                            {session.type === "work"
                              ? "Focus Session"
                              : "Break"}
                          </div>

                          <div className="font-caption-metadata text-caption-metadata text-text-muted">
                            {session.date} at{" "}
                            {session.completedAt}
                          </div>

                        </div>

                      </div>

                      <div className="text-right ml-4 flex-shrink-0">

                        <div className="font-body-main text-body-main text-text-primary">
                          {formatTime(
                            session.type === "work"
                              ? session.workDuration
                              : session.restDuration
                          )}
                        </div>

                        <div className="font-caption-metadata text-caption-metadata text-text-muted">
                          {session.type === "work"
                            ? "work"
                            : "rest"}
                        </div>

                      </div>

                    </div>

                  ))

                )}

              </div>

            </div>
          )}

        </div>

      </main>

    </div>
  );
}
