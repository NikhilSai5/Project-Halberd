"use client";

import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { SettingsContext, type Habit } from "@/lib/SettingsContext";
import AnimatedEmoji from "@/components/AnimatedEmoji";
import { browser } from "wxt/browser";
import {
  type PomodoroState,
  INACTIVE_POMODORO,
  getTimeLeft,
  getProgress,
  loadPomodoro,
  onPomodoroChange,
} from "@/lib/pomodoro";
import {
  type FocusModeState,
  INACTIVE_FOCUS_MODE,
  getTimeLeft as getFocusTimeLeft,
  getProgress as getFocusProgress,
  loadFocusMode,
  onFocusModeChange,
} from "@/lib/focusMode";

const STORAGE_KEY = "halberd_floating_circle_pos";
const HABITS_STORAGE_KEY = "halberd_habits";
const CIRCLE_SIZE = 44;
const MIN_EXPANDED_CIRCLE_WIDTH = 108;
const MAX_EXPANDED_CIRCLE_WIDTH = 300;
const EXPANDED_HORIZONTAL_PADDING = 12;
const ICON_TEXT_GAP = 8;
const POMODORO_COLLAPSED_WIDTH = 92;
const SLIDESHOW_INTERVAL = 6000; // 6 seconds per habit emoji, synced across all tabs
const CONFIRM_TIMEOUT_MS = 5000; // 5 seconds to confirm before resetting
const MARGIN = 16;

const DEFAULT_HABITS: Habit[] = [
  {
    id: "1",
    name: "Read 20 minutes",
    emoji: "📚",
    color: "#94c7a4",
    tracking: {},
  },
  {
    id: "2",
    name: "Morning workout",
    emoji: "💪",
    color: "#94c7a4",
    tracking: {},
  },
  {
    id: "3",
    name: "Japanese practice",
    emoji: "🇯🇵",
    color: "#94c7a4",
    tracking: {},
  },
  {
    id: "4",
    name: "No sugar",
    emoji: "🚫",
    color: "#94c7a4",
    tracking: {},
  },
];

interface Position {
  x: number;
  y: number;
}

// Local YYYY-MM-DD date string
function getTodayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatClock(totalSeconds: number): string {
  const s = Math.max(0, totalSeconds);
  const mins = Math.floor(s / 60);
  const secs = Math.floor(s % 60);
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function FloatingCircle() {
  const settingsContext = useContext(SettingsContext);
  const contextHabits = settingsContext?.habits;

  const [storedHabits, setStoredHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);
  const [todayStr, setTodayStr] = useState<string>(getTodayDateStr());

  const [pomodoro, setPomodoro] = useState<PomodoroState>(INACTIVE_POMODORO);
  const [pomodoroNow, setPomodoroNow] = useState<number>(Date.now());

  const pomodoroActive = pomodoro.active;

  const [focusMode, setFocusMode] = useState<FocusModeState>(INACTIVE_FOCUS_MODE);
  const [focusNow, setFocusNow] = useState<number>(Date.now());

  const focusModeActive = focusMode.active;

  // Priority: pomodoro takes precedence over focus mode
  const showPomodoro = pomodoroActive;
  const showFocusMode = !showPomodoro && focusModeActive;

  // Position state with default to top-right
  const [position, setPosition] = useState<Position>(() => {
    if (typeof window !== "undefined") {
      return {
         x: Math.max(MARGIN, window.innerWidth - CIRCLE_SIZE - MARGIN),
         y: MARGIN,
      };
    }
    return { x: 100, y: MARGIN };
  });

  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [confirmingHabitId, setConfirmingHabitId] = useState<string | null>(null);
  const [justCompletedHabit, setJustCompletedHabit] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [expandedCircleWidth, setExpandedCircleWidth] = useState(MIN_EXPANDED_CIRCLE_WIDTH);

  const confirmTimerRef = useRef<any>(null);
  const dragFrameRef = useRef<number | null>(null);
  const pendingPositionRef = useRef<Position | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const positionRef = useRef(position);
  const hoverLabelMeasureRef = useRef<HTMLSpanElement>(null);
  positionRef.current = position;

  useEffect(() => {
    return () => {
      if (dragFrameRef.current !== null) window.cancelAnimationFrame(dragFrameRef.current);
    };
  }, []);

  // Active list of all habits
  const allHabits = contextHabits && contextHabits.length > 0 ? contextHabits : storedHabits;

  // Update todayStr when date changes (midnight roll)
  useEffect(() => {
    const checkDate = () => {
      const current = getTodayDateStr();
      setTodayStr((prev) => (prev !== current ? current : prev));
    };
    const interval = setInterval(checkDate, 60000);
    return () => clearInterval(interval);
  }, []);

  // Load initial pomodoro state and react to changes from other tabs/pages
  useEffect(() => {
    let cancelled = false;
    loadPomodoro().then((loaded) => {
      if (!cancelled) {
        setPomodoro(loaded);
        setPomodoroNow(Date.now());
      }
    });
    const unsubscribe = onPomodoroChange((next) => {
      if (cancelled) return;
      setPomodoro(next);
      setPomodoroNow(Date.now());
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Tick while a pomodoro session is active so the countdown/progress stays live
  useEffect(() => {
    if (!pomodoroActive) return;
    const id = window.setInterval(() => {
      setPomodoroNow(Date.now());
    }, 500);
    return () => window.clearInterval(id);
  }, [pomodoroActive]);

  const pomodoroTimeLeft = getTimeLeft(pomodoro, pomodoroNow);
  const pomodoroProgress = getProgress(pomodoro, pomodoroNow);
  const pomodoroMode = pomodoro.mode;
  const pomodoroRunning = pomodoro.running;
  const pomodoroModeLabel = pomodoroMode === "focus" ? "Focus" : "Rest";

  // Load initial focus mode state and react to changes from other tabs/pages
  useEffect(() => {
    let cancelled = false;
    loadFocusMode().then((loaded) => {
      if (!cancelled) {
        setFocusMode(loaded);
        setFocusNow(Date.now());
      }
    });
    const unsubscribe = onFocusModeChange((next) => {
      if (cancelled) return;
      setFocusMode(next);
      setFocusNow(Date.now());
    });
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, []);

  // Tick while a focus mode session is active so the countdown/progress stays live
  useEffect(() => {
    if (!focusModeActive) return;
    const id = window.setInterval(() => {
      setFocusNow(Date.now());
    }, 500);
    return () => window.clearInterval(id);
  }, [focusModeActive]);

  const focusTimeLeft = getFocusTimeLeft(focusMode, focusNow);
  const focusProgress = getFocusProgress(focusMode, focusNow);
  const focusRunning = focusMode.running;

  // Unified "timer" display — a flyby timer (pomodoro or focus mode) suppresses
  // the habit UI on the circle. Pomodoro takes precedence over focus mode.
  const timerActive = showPomodoro || showFocusMode;
  const timerClock = formatClock(showPomodoro ? pomodoroTimeLeft : focusTimeLeft);
  const timerRunning = showPomodoro ? pomodoroRunning : focusRunning;
  const timerProgress = showPomodoro ? pomodoroProgress : focusProgress;
  const timerProgressColor = showPomodoro
    ? pomodoroMode === "focus"
      ? "#5cbe70"
      : "#d5aa5c"
    : "#5cbe70";
  const timerBorderColor = showPomodoro
    ? pomodoroMode === "focus"
      ? "#76a67f"
      : "#d0a07a"
    : "#76a67f";
  const timerTitle = showPomodoro
    ? `Pomodoro · ${pomodoroModeLabel} · ${timerClock}`
    : `Focus · ${timerClock}`;
  const timerCollapsedLabel = showPomodoro ? "Pomodoro" : "Focus";

  // Filter out habits that are ALREADY marked as done for today
  const pendingHabits = allHabits.filter((habit) => {
    return habit.tracking?.[todayStr] !== "done";
  });

  // Reset confirmation mode if the confirming habit is no longer pending
  useEffect(() => {
    if (confirmingHabitId && !pendingHabits.some((h) => h.id === confirmingHabitId)) {
      setConfirmingHabitId(null);
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    }
  }, [confirmingHabitId, pendingHabits]);

  // Load habits from browser.storage when outside SettingsProvider (e.g. content script on YouTube)
  useEffect(() => {
    if (contextHabits && contextHabits.length > 0) return;

    let isMounted = true;

    async function loadHabits() {
      try {
        if (browser?.storage?.local) {
          const stored = await browser.storage.local.get(HABITS_STORAGE_KEY);
          const habits = stored[HABITS_STORAGE_KEY] as Habit[] | undefined;
          if (isMounted && Array.isArray(habits) && habits.length > 0) {
            setStoredHabits(habits);
          }
        }
      } catch (err) {
        console.warn("[Halberd] Could not load habits from storage:", err);
      }
    }

    loadHabits();

    const handleHabitsChange = (
      changes: Record<string, { oldValue?: any; newValue?: any }>,
      areaName?: string
    ) => {
      if ((!areaName || areaName === "local") && changes[HABITS_STORAGE_KEY]?.newValue) {
        const newHabits = changes[HABITS_STORAGE_KEY].newValue as Habit[];
        if (Array.isArray(newHabits) && newHabits.length > 0) {
          setStoredHabits(newHabits);
        }
      }
    };

    try {
      if (browser?.storage?.onChanged) {
        browser.storage.onChanged.addListener(handleHabitsChange);
      }
    } catch {}

    return () => {
      isMounted = false;
      try {
        if (browser?.storage?.onChanged) {
          browser.storage.onChanged.removeListener(handleHabitsChange);
        }
      } catch {}
    };
  }, [contextHabits]);

  // Wall-clock epoch synchronized slideshow across ALL tabs and pages
  // Slideshow pauses while user is in confirmation mode
  useEffect(() => {
    if (pendingHabits.length === 0 || confirmingHabitId !== null) return;

    let timerId: any = null;

    const syncTick = () => {
      const now = Date.now();
      const index = Math.floor(now / SLIDESHOW_INTERVAL) % pendingHabits.length;

      setCurrentEmojiIndex((prev) => {
        if (prev !== index) {
          setIsTransitioning(true);
          setTimeout(() => setIsTransitioning(false), 200);
        }
        return index;
      });

      const msUntilNext = SLIDESHOW_INTERVAL - (now % SLIDESHOW_INTERVAL);
      timerId = setTimeout(syncTick, Math.max(20, msUntilNext + 10));
    };

    syncTick();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [pendingHabits.length, pendingHabits.map((h) => h.id).join("|"), confirmingHabitId]);

  // Clamp position to viewport bounds
  const clampPosition = useCallback((x: number, y: number): Position => {
     const maxX = Math.max(0, window.innerWidth - CIRCLE_SIZE - MARGIN);
     const maxY = Math.max(0, window.innerHeight - CIRCLE_SIZE - MARGIN);
    return {
      x: Math.min(Math.max(MARGIN, x), maxX),
      y: Math.min(Math.max(MARGIN, y), maxY),
    };
  }, []);

  // Position as a fraction of the movable range, so the circle keeps the same
  // relative spot across tabs even when window sizes differ.
  const positionToFractions = useCallback((pos: Position) => {
    const maxX = Math.max(0, window.innerWidth - CIRCLE_SIZE - MARGIN);
    const maxY = Math.max(0, window.innerHeight - CIRCLE_SIZE - MARGIN);
    const rangeX = maxX - MARGIN || 1;
    const rangeY = maxY - MARGIN || 1;
    return {
      rx: Math.min(1, Math.max(0, (pos.x - MARGIN) / rangeX)),
      ry: Math.min(1, Math.max(0, (pos.y - MARGIN) / rangeY)),
    };
  }, []);

  const fractionsToPosition = useCallback((rx: number, ry: number): Position => {
    const maxX = Math.max(0, window.innerWidth - CIRCLE_SIZE - MARGIN);
    const maxY = Math.max(0, window.innerHeight - CIRCLE_SIZE - MARGIN);
    return clampPosition(
      MARGIN + rx * (maxX - MARGIN),
      MARGIN + ry * (maxY - MARGIN)
    );
  }, [clampPosition]);

  // Load saved position from browser storage
  useEffect(() => {
    let isMounted = true;

    async function loadPosition() {
      try {
        if (browser?.storage?.local) {
          const result = await browser.storage.local.get(STORAGE_KEY);
          const savedPos = result?.[STORAGE_KEY] as { rx?: number; ry?: number } | undefined;
          if (savedPos && typeof savedPos.rx === "number" && typeof savedPos.ry === "number") {
            if (isMounted) {
              setPosition(fractionsToPosition(savedPos.rx, savedPos.ry));
            }
            return;
          }
        }
      } catch (err) {
        console.warn("[Halberd] Could not load saved circle position:", err);
      }

      if (isMounted) {
        setPosition({
         x: Math.max(MARGIN, window.innerWidth - CIRCLE_SIZE - MARGIN),
          y: MARGIN,
        });
      }
    }

    loadPosition();

    // Listen for position changes from other tabs
    const handleStorageChange = (
      changes: Record<string, { oldValue?: any; newValue?: any }>,
      areaName?: string
    ) => {
      if ((!areaName || areaName === "local") && changes[STORAGE_KEY]?.newValue) {
        const newPos = changes[STORAGE_KEY].newValue as { rx?: number; ry?: number };
        if (
          !isDraggingRef.current &&
          typeof newPos.rx === "number" &&
          typeof newPos.ry === "number"
        ) {
          setPosition(fractionsToPosition(newPos.rx, newPos.ry));
        }
      }
    };

    try {
      if (browser?.storage?.onChanged) {
        browser.storage.onChanged.addListener(handleStorageChange);
      }
    } catch {}

    const handleResize = () => {
      if (!isDraggingRef.current) {
        setPosition((prev) => clampPosition(prev.x, prev.y));
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      try {
        if (browser?.storage?.onChanged) {
          browser.storage.onChanged.removeListener(handleStorageChange);
        }
      } catch {}
      if (confirmTimerRef.current) {
        clearTimeout(confirmTimerRef.current);
      }
    };
  }, [clampPosition, fractionsToPosition]);

  // Current active habit (or the habit waiting for confirmation)
  const currentHabit = confirmingHabitId
    ? pendingHabits.find((h) => h.id === confirmingHabitId) || null
    : pendingHabits.length > 0
    ? pendingHabits[currentEmojiIndex % pendingHabits.length]
    : null;

  // Handle click with confirmation requirement
  const handleHabitClick = () => {
    if (timerActive) return;
    if (!currentHabit) return;

    // STEP 2: If already in confirmation mode for this habit, mark as complete!
    if (confirmingHabitId === currentHabit.id) {
      if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
      setConfirmingHabitId(null);

      const habitToComplete = currentHabit;
      const dateStr = todayStr;

      // Show celebratory completed badge
      setJustCompletedHabit(habitToComplete.name);
      setTimeout(() => {
        setJustCompletedHabit(null);
      }, 1000);

      // 1. Update in Context if in New Tab
      if (settingsContext?.markHabitDone) {
        settingsContext.markHabitDone(habitToComplete.id, dateStr);
      }

      // 2. Update local state & sync to browser.storage.local for other tabs
      const updatedHabits = allHabits.map((h) => {
        if (h.id !== habitToComplete.id) return h;
        return {
          ...h,
          tracking: {
            ...h.tracking,
            [dateStr]: "done" as const,
          },
        };
      });

      setStoredHabits(updatedHabits);

      try {
        if (browser?.storage?.local) {
          browser.storage.local.set({ [HABITS_STORAGE_KEY]: updatedHabits }).catch(() => {});
        }
      } catch {}
      return;
    }

    // STEP 1: First click -> enter confirmation mode, show tick emoji & tooltip
    setConfirmingHabitId(currentHabit.id);

    if (confirmTimerRef.current) clearTimeout(confirmTimerRef.current);
    confirmTimerRef.current = setTimeout(() => {
      setConfirmingHabitId(null);
    }, CONFIRM_TIMEOUT_MS);
  };

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;

    e.preventDefault();
    e.stopPropagation();

    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);

    dragOffsetRef.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
    startPosRef.current = {
      x: e.clientX,
      y: e.clientY,
    };

    setIsDragging(true);
    isDraggingRef.current = true;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    const rawX = e.clientX - dragOffsetRef.current.x;
    const rawY = e.clientY - dragOffsetRef.current.y;
    const clamped = clampPosition(rawX, rawY);
    positionRef.current = clamped;
    pendingPositionRef.current = clamped;

    if (dragFrameRef.current !== null) return;
    dragFrameRef.current = window.requestAnimationFrame(() => {
      dragFrameRef.current = null;
      const nextPosition = pendingPositionRef.current;
      if (nextPosition) setPosition(nextPosition);
    });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;

    e.preventDefault();
    e.stopPropagation();

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {}

    setIsDragging(false);
    isDraggingRef.current = false;

    if (dragFrameRef.current !== null) {
      window.cancelAnimationFrame(dragFrameRef.current);
      dragFrameRef.current = null;
    }
    pendingPositionRef.current = null;

    const distMoved = Math.hypot(
      e.clientX - startPosRef.current.x,
      e.clientY - startPosRef.current.y
    );

    const finalPos = positionRef.current;

    try {
      if (browser?.storage?.local) {
        browser.storage.local
          .set({ [STORAGE_KEY]: positionToFractions(finalPos) })
          .catch((err: any) => console.warn("[Halberd] Failed to save circle position:", err));
      }
    } catch {}

    // Only process click if user didn't drag
    if (distMoved < 6) {
      handleHabitClick();
    }
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDraggingRef.current) {
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {}
      if (dragFrameRef.current !== null) {
        window.cancelAnimationFrame(dragFrameRef.current);
        dragFrameRef.current = null;
      }
      pendingPositionRef.current = null;
      setIsDragging(false);
      isDraggingRef.current = false;
    }
  };

  // Determine displayed emoji & state
  const isAllDone = pendingHabits.length === 0;
  const isConfirming = confirmingHabitId !== null;

  const displayEmoji = timerActive
    ? "🍅"
    : justCompletedHabit
    ? "🎉"
    : isConfirming
    ? "✅"
    : isAllDone
    ? "🎉"
    : currentHabit?.emoji || "⚔️";

  const nativeTitle = timerActive
    ? `${timerTitle}${timerRunning ? "" : " (paused)"}`
    : isConfirming
    ? "is it really completed?"
    : justCompletedHabit
    ? `Done: ${justCompletedHabit}! 🎉`
    : isAllDone
    ? "All habits completed for today! 🎉"
    : currentHabit
    ? `Click to complete "${currentHabit.name}"`
    : "Halberd";

  const hoverLabel = timerActive
    ? timerTitle
    : justCompletedHabit || (isAllDone ? "All habits done" : currentHabit?.name) || "Halberd";

  useEffect(() => {
    const label = hoverLabelMeasureRef.current;
    if (!label) return;
    const textWidth = Math.ceil(label.getBoundingClientRect().width);
    const contentWidth = textWidth + CIRCLE_SIZE + ICON_TEXT_GAP + EXPANDED_HORIZONTAL_PADDING * 2;
    setExpandedCircleWidth(
      Math.min(MAX_EXPANDED_CIRCLE_WIDTH, Math.max(MIN_EXPANDED_CIRCLE_WIDTH, contentWidth)),
    );
  }, [hoverLabel]);

     // Keep the confirmation tooltip beside the circle.
     const tooltipOnRight = typeof window !== "undefined" && position.x < window.innerWidth / 2;

     // Timer pill anchors & palette. The collapsed pill is centered on the
     // circle; on hover it expands right (left half) or left (right half).
     const timerCollapsedLeft = -(POMODORO_COLLAPSED_WIDTH - CIRCLE_SIZE) / 2;
     const timerPillLeft = isHovered
       ? tooltipOnRight
         ? timerCollapsedLeft
         : timerCollapsedLeft - (expandedCircleWidth - POMODORO_COLLAPSED_WIDTH)
       : timerCollapsedLeft;

  return (
    <>
      {/* Inject keyframe animations — works in shadow DOM */}
      <style>{`
        @keyframes halberd-tooltip-pop {
          0% { transform: translateY(4px) scale(0.92); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
         width: `${CIRCLE_SIZE}px`,
         height: `${CIRCLE_SIZE}px`,
        zIndex: 2147483647,
        userSelect: "none",
        WebkitUserSelect: "none",
         touchAction: "none",
         cursor: isDragging ? "grabbing" : "pointer",
          transform: isDragging ? "scale(1.04)" : isHovered ? "scale(1.03)" : "scale(1)",
         transition: isDragging
           ? "transform 0.1s ease"
           : "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
         pointerEvents: "auto",
       }}
       onPointerDown={handlePointerDown}
       onPointerMove={handlePointerMove}
       onPointerUp={handlePointerUp}
       onPointerCancel={handlePointerCancel}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
       title={nativeTitle}
     >
        {/* Visual Tooltip for Confirmation */}
      {isConfirming && (
        <div
          style={{
            position: "absolute",
             [tooltipOnRight ? "left" : "right"]: `${CIRCLE_SIZE + 10}px`,
             top: "50%",
             transform: "translateY(-50%)",
             backgroundColor: "#0f172a",
            color: "#ffffff",
            padding: "7px 14px",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
             border: "1px solid #334155",
             pointerEvents: "none",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            animation: "halberd-tooltip-pop 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        >
          <span style={{ fontSize: "14px" }}>🤔</span>
          <span>is it really completed ?</span>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          left: timerActive
            ? timerPillLeft
            : isHovered && !tooltipOnRight ? `-${expandedCircleWidth - CIRCLE_SIZE}px` : 0,
          top: 0,
          width: `${timerActive ? (isHovered ? expandedCircleWidth : POMODORO_COLLAPSED_WIDTH) : isHovered ? expandedCircleWidth : CIRCLE_SIZE}px`,
          height: `${CIRCLE_SIZE}px`,
          boxSizing: "border-box",
          borderRadius: `${CIRCLE_SIZE / 2}px`,
          display: "flex",
          alignItems: "center",
          flexDirection: "row",
          overflow: "hidden",
          justifyContent: timerActive ? "center" : "flex-start",
          gap: timerActive ? 0 : isHovered ? `${ICON_TEXT_GAP}px` : 0,
          backgroundColor: timerActive
            ? "#eff8f1"
            : isConfirming ? "#e8f7ec" : justCompletedHabit ? "#fff4dc" : "#eff8f1",
          border: timerActive
            ? `2px solid ${timerBorderColor}`
            : isConfirming ? "2px solid #5cbe70" : justCompletedHabit ? "2px solid #d5aa5c" : "1px solid #8fb69a",
          boxShadow: isDragging
            ? "0 10px 18px rgba(54, 82, 61, 0.2), 0 0 0 2px #76a67f"
            : isConfirming
            ? "0 8px 16px rgba(54, 139, 74, 0.18), 0 0 0 1px #5cbe70"
            : justCompletedHabit
            ? "0 8px 16px rgba(183, 132, 50, 0.16), 0 0 0 1px #d5aa5c"
            : isHovered
            ? "0 8px 16px rgba(54, 82, 61, 0.16), 0 0 0 1px #76a67f"
            : "0 5px 12px rgba(54, 82, 61, 0.14)",
          padding: !timerActive && isHovered ? "0 10px" : 0,
          transition: "left 0.22s ease, width 0.22s ease, padding 0.22s ease, background-color 0.18s ease, border-color 0.18s ease, box-shadow 0.18s ease",
          pointerEvents: timerActive ? "auto" : isHovered ? "auto" : "none",
        }}
        onMouseEnter={() => {
          if (timerActive) setIsHovered(true);
        }}
        onMouseLeave={() => {
          if (timerActive) setIsHovered(false);
        }}
      >
        {timerActive ? (
          <>
            <span
              ref={hoverLabelMeasureRef}
              aria-hidden="true"
              style={{
                position: "absolute",
                visibility: "hidden",
                whiteSpace: "nowrap",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {hoverLabel}
            </span>
            <span
              style={{
                whiteSpace: "nowrap",
                color: "#43604c",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                lineHeight: 1,
                transition: "font-size 0.22s ease",
              }}
            >
              {isHovered ? hoverLabel : timerCollapsedLabel}
            </span>
            {/* Progress along the border of the pill */}
            <div
              style={{
                position: "absolute",
                inset: 0,
                borderRadius: "inherit",
                padding: 2,
                background: `conic-gradient(${timerProgressColor} ${Math.max(
                  0,
                  Math.min(100, timerProgress * 100)
                )}%, transparent 0)`,
                WebkitMask:
                  "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                WebkitMaskComposite: "xor",
                mask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
                maskComposite: "exclude",
                pointerEvents: "none",
              }}
            />
          </>
        ) : (
          <>
            <span
              ref={hoverLabelMeasureRef}
              aria-hidden="true"
              style={{
                position: "absolute",
                visibility: "hidden",
                whiteSpace: "nowrap",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
              }}
            >
              {hoverLabel}
            </span>
            <div
              style={{
                flex: `0 0 ${CIRCLE_SIZE}px`,
                width: `${CIRCLE_SIZE}px`,
                height: `${CIRCLE_SIZE}px`,
                pointerEvents: "none",
                userSelect: "none",
                WebkitUserSelect: "none",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                transform: isTransitioning ? "scale(0.7) rotate(-10deg)" : isConfirming ? "scale(1.1)" : "scale(1)",
                opacity: isTransitioning ? 0.4 : 1,
                transition: "transform 0.2s ease, opacity 0.2s ease",
              }}
            >
              <AnimatedEmoji emoji={displayEmoji} size={24} />
            </div>
            <span
              style={{
                width: isHovered ? `${expandedCircleWidth - CIRCLE_SIZE - ICON_TEXT_GAP - EXPANDED_HORIZONTAL_PADDING * 2}px` : 0,
                maxWidth: isHovered ? `${expandedCircleWidth - CIRCLE_SIZE - ICON_TEXT_GAP - EXPANDED_HORIZONTAL_PADDING * 2}px` : 0,
                overflow: "hidden",
                opacity: isHovered ? 1 : 0,
                color: "#43604c",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                lineHeight: 1,
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                transition: "max-width 0.22s ease, opacity 0.16s ease",
              }}
            >
              {hoverLabel}
            </span>
          </>
        )}
      </div>
      </div>
    </>
  );
}
