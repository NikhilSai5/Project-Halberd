"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/lib/AuthContext";
import { userStorageKey } from "@/lib/userStorage";

const DEFAULT_FOCUS_TIME = 25 * 60;

interface Session {
  id: string;
  date: string;
  duration: number;
  completedAt: string;
  taskName: string;
  completed: boolean;
}

export default function FocusMode() {
  const { user } = useAuth();
  const [focusTime, setFocusTime] = useState(DEFAULT_FOCUS_TIME);
  const [timeLeft, setTimeLeft] = useState(focusTime);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [isEditingTimer, setIsEditingTimer] = useState(false);
  const [editTimerValue, setEditTimerValue] = useState("");
  const [taskName, setTaskName] = useState("Build Halberd");
  const [history, setHistory] = useState<Session[]>([]);
  
  const intervalRef = useRef<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const storedTime = localStorage.getItem(userStorageKey(user.id, "focus_time"));
    const storedHistory = localStorage.getItem(userStorageKey(user.id, "focus_history"));
    const nextTime = storedTime ? parseInt(storedTime, 10) : DEFAULT_FOCUS_TIME;
    setFocusTime(nextTime); setTimeLeft(nextTime);
    if (storedHistory) {
      try { setHistory(JSON.parse(storedHistory)); } catch { setHistory([]); }
    } else setHistory([]);
  }, [user?.id]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(userStorageKey(user.id, "focus_time"), focusTime.toString());
  }, [focusTime, user?.id]);

  useEffect(() => {
    if (!user) return;
    localStorage.setItem(userStorageKey(user.id, "focus_history"), JSON.stringify(history));
  }, [history, user?.id]);

  useEffect(() => {
    if (!isRunning) return;
    intervalRef.current = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  useEffect(() => {
    if (timeLeft === 0 && !isRunning) {
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [timeLeft, isRunning]);

  const formatTime = useCallback((seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  }, []);

  const handleTimerDoubleClick = useCallback(() => {
    if (!isRunning) {
      setEditTimerValue(formatTime(timeLeft));
      setIsEditingTimer(true);
    }
  }, [isRunning, timeLeft, formatTime]);

  const handleTimerEditSubmit = useCallback(() => {
    const parts = editTimerValue.split(":").map(Number);
    if (parts.length === 2) {
      const mins = parts[0] ?? 0;
      const secs = parts[1] ?? 0;
      if (!isNaN(mins) && !isNaN(secs) && secs < 60) {
        const totalSeconds = mins * 60 + secs;
        setTimeLeft(totalSeconds);
        setFocusTime(totalSeconds);
      }
    }
    setIsEditingTimer(false);
  }, [editTimerValue]);

  const handleTimerEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (/^[\d:]*$/.test(value)) {
      setEditTimerValue(value);
    }
  }, []);

  const handleTimerEditKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleTimerEditSubmit();
    } else if (e.key === "Escape") {
      setIsEditingTimer(false);
    }
  }, [handleTimerEditSubmit]);

  const handleTimerEditBlur = useCallback(() => {
    handleTimerEditSubmit();
  }, [handleTimerEditSubmit]);

  const handleSessionComplete = useCallback(() => {
    const now = new Date();
    const session: Session = {
      id: `${Date.now()}`,
      date: now.toLocaleDateString(),
      duration: focusTime,
      completedAt: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      taskName,
      completed: true,
    };

    setHistory((prev) => [session, ...prev].slice(0, 50));
    setSessionsCompleted((prev) => prev + 1);
    setIsRunning(false);
    setTimeLeft(focusTime);
  }, [focusTime, taskName]);

  const handleStartPause = useCallback(() => {
    if (timeLeft === 0) {
      setTimeLeft(focusTime);
    }
    setIsRunning(!isRunning);
  }, [timeLeft, focusTime, isRunning]);

  const handleStop = useCallback(() => {
    if (timeLeft < focusTime && timeLeft > 0) {
      const now = new Date();
      const session: Session = {
        id: `${Date.now()}`,
        date: now.toLocaleDateString(),
        duration: focusTime - timeLeft,
        completedAt: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        taskName,
        completed: false,
      };
      setHistory((prev) => [session, ...prev].slice(0, 50));
    }
    setIsRunning(false);
    setTimeLeft(focusTime);
  }, [focusTime, timeLeft, taskName]);

  const handleReset = useCallback(() => {
    setIsRunning(false);
    setTimeLeft(focusTime);
  }, [focusTime]);

  const clearHistory = () => {
    setHistory([]);
  };

  const handleHistoryClose = () => {
    setShowHistory(false);
  };

  return (
    <div className="page-shell page-shell--centered text-text-primary font-body-main relative overflow-x-hidden antialiased">
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAA=" />
      
      <main className="page-main flex-grow flex items-center justify-center">
        <article className="workspace-surface workspace-narrow focus-card w-full p-6 sm:p-8 relative flex flex-col gap-6 text-center items-center">
          <header className="page-header items-start w-full flex justify-between items-center">
            <h2 className="section-heading text-text-secondary uppercase tracking-wider mb-1">Focus Mode</h2>
            {showHistory ? (
              <button
                type="button"
                onClick={handleHistoryClose}
                className="icon-button border border-border-subtle text-text-secondary hover:bg-surface-container-low hover:text-primary active:scale-95 transition-colors"
                aria-label="Back to timer"
              >
                <span className="material-symbols-outlined icon-action">arrow_back</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="font-label-secondary text-label-secondary transition-colors flex items-center gap-1 hover:text-primary"
              >
                History
                <span className="material-symbols-outlined icon-inline" aria-hidden="true">history</span>
              </button>
            )}
          </header>
          
          {!showHistory && (
            <div className="focus-content flex flex-col items-center gap-6 w-full flex-1">
              <span className="material-symbols-outlined focus-icon text-primary" aria-hidden="true" data-icon="target">center_focus_strong</span>
              
              <div className="focus-task w-full">
                <input
                  type="text"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                  className="page-title text-primary text-center bg-transparent border-none focus:outline-none font-section-title text-section-title w-full max-w-md mx-auto placeholder:text-text-muted"
                  placeholder="Task name"
                />
              </div>
              
              <div className="focus-timer flex-1 flex items-center justify-center">
                {isEditingTimer ? (
<input
                      ref={timerInputRef}
                      type="text"
                      value={editTimerValue}
                      onChange={handleTimerEditChange}
                      onKeyDown={handleTimerEditKeyDown}
                      onBlur={handleTimerEditBlur}
                      onDoubleClick={(e) => e.stopPropagation()}
                      className="font-display-timer text-display-timer text-text-primary tracking-tight text-[72px] leading-none text-center bg-transparent border-none focus:outline-none w-56"
                      maxLength={5}
                      autoFocus
                    />
                ) : (
                  <div
                    className="font-display-timer text-display-timer text-text-primary tracking-tight text-[72px] leading-none cursor-pointer hover:opacity-80 transition-opacity"
                    onDoubleClick={handleTimerDoubleClick}
                  >
                    {formatTime(timeLeft)}
                  </div>
                )}
              </div>

              <div className="pomodoro-controls mt-auto pt-6 w-full">
                <button
                  type="button"
                  onClick={handleStop}
                  aria-label="Stop timer"
                  disabled={timeLeft === focusTime && !isRunning}
                  className={`pomodoro-control-btn pomodoro-stop-btn icon-button border border-error text-error hover:bg-error/10 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-all duration-300 ease-out ${
                    isRunning
                      ? "w-auto px-4 gap-2 opacity-100"
                      : "w-12 px-0 gap-0 opacity-60"
                  }`}
                >
                  <span className="material-symbols-outlined icon-action" style={{ fontVariationSettings: "'FILL' 1" }}>stop</span>
                  <span
                    className="font-section-title text-section-title whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-300"
                    style={{ maxWidth: isRunning ? "48px" : "0px", opacity: isRunning ? 1 : 0 }}
                  >
                    Stop
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleStartPause}
                  aria-label={isRunning ? "Pause timer" : "Start timer"}
                  className={`button-prominent bg-secondary-container text-on-secondary-container font-section-title text-section-title hover:bg-primary-fixed active:scale-95 border border-secondary-fixed-dim flex items-center gap-2 transition-all duration-300 ease-out ${
                    isRunning ? "w-14 px-0 min-w-0 gap-0" : "w-auto px-6 min-w-[140px] gap-2"
                  }`}
                >
                  <span className="material-symbols-outlined icon-action" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
                    {isRunning ? "pause" : "play_arrow"}
                  </span>
                  <span
                    className="whitespace-nowrap overflow-hidden transition-[max-width,opacity] duration-300"
                    style={{ maxWidth: isRunning ? "0px" : "48px", opacity: isRunning ? 0 : 1 }}
                  >
                    {isRunning ? "Pause" : "Start"}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={handleReset}
                  aria-label="Reset timer"
                  className="pomodoro-control-btn pomodoro-reset-btn icon-button w-12 px-0 border border-border-subtle text-text-secondary hover:bg-surface-container-low active:scale-95 flex items-center justify-center transition-all duration-300 ease-out"
                >
                  <span className="material-symbols-outlined icon-action">restart_alt</span>
                </button>
              </div>
            </div>
          )}

          {showHistory && (
            <div className="pomodoro-history-view w-full flex flex-col animate-fade-in">
              <div className="flex justify-between items-center mb-4">
                <h3 className="section-heading text-text-primary">Focus History</h3>
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
                    <span className="material-symbols-outlined text-6xl mb-4">history</span>
                    <div className="font-body-main text-body-main text-text-secondary">No focus sessions yet</div>
                    <div className="font-caption-metadata text-caption-metadata text-text-muted mt-1">Complete a focus session to see it here</div>
                  </div>
                ) : (
                  history.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 bg-surface-white rounded-lg border border-border-subtle hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0 bg-primary-container text-primary">
                          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{session.completed ? "check_circle" : "cancel"}</span>
                        </span>
                        <div className="min-w-0">
                          <div className="font-body-main text-body-main text-text-primary truncate">{session.taskName}</div>
                          <div className="font-caption-metadata text-caption-metadata text-text-muted">{session.date} at {session.completedAt}</div>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <div className="font-body-main text-body-main text-text-primary">{formatTime(session.duration)}</div>
                        <div className="font-caption-metadata text-caption-metadata text-text-muted">{session.completed ? "completed" : "interrupted"}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </article>
      </main>
    </div>
  );
}
