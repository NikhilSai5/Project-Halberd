"use client";

import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { SettingsContext, type Habit, type TodoGroup } from "@/lib/SettingsContext";
import AnimatedEmoji from "@/components/AnimatedEmoji";
import { browser } from "wxt/browser";

const STORAGE_KEY = "halberd_floating_circle_pos";
const HABITS_STORAGE_KEY = "halberd_habits";
const TODO_GROUPS_STORAGE_KEY = "halberd_todo_groups";
const CIRCLE_SIZE = 54;
const SATELLITE_SIZE = 36;
const SATELLITE_RADIUS = 72; // distance from center to satellite circle center
const SLIDESHOW_INTERVAL = 6000; // 6 seconds per habit emoji, synced across all tabs
const CONFIRM_TIMEOUT_MS = 5000; // 5 seconds to confirm before resetting
const MARGIN = 16;

// Soft palette cycling for satellite circles, matches project green/light theme
const SATELLITE_COLORS = [
  { bg: "#b9d9c0", text: "#43604c", border: "#94c7a4" },
  { bg: "#c5d8f0", text: "#3a5a80", border: "#9bbfe0" },
  { bg: "#f0d9c5", text: "#7a4a20", border: "#d0a07a" },
  { bg: "#e8d0f0", text: "#6a3080", border: "#c09ad0" },
  { bg: "#f0e8c5", text: "#7a6020", border: "#d0b87a" },
  { bg: "#d0f0e8", text: "#207a5a", border: "#7ad0b8" },
];

// Compute satellite positions spread toward screen center
function getSatellitePositions(
  count: number,
  centerX: number,
  centerY: number,
  radius: number
): Array<{ x: number; y: number }> {
  if (count === 0) return [];
  const screenCX = typeof window !== "undefined" ? window.innerWidth / 2 : 500;
  const screenCY = typeof window !== "undefined" ? window.innerHeight / 2 : 400;
  const baseAngle = Math.atan2(screenCY - centerY, screenCX - centerX);
  const spread = Math.min(Math.PI * 1.1, (count - 1) * 0.55 + 0.3);
  const startAngle = baseAngle - spread / 2;
  const step = count === 1 ? 0 : spread / (count - 1);
  return Array.from({ length: count }, (_, i) => ({
    x: Math.cos(startAngle + i * step) * radius,
    y: Math.sin(startAngle + i * step) * radius,
  }));
}

function getGroupInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}

function getTopTodo(group: TodoGroup): string | null {
  const item = group.todos.find((t) => !t.completed);
  return item ? item.text : null;
}

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

export default function FloatingCircle() {
  const settingsContext = useContext(SettingsContext);
  const contextHabits = settingsContext?.habits;
  const contextTodoGroups = settingsContext?.todoGroups;

  const [storedHabits, setStoredHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [storedTodoGroups, setStoredTodoGroups] = useState<TodoGroup[]>([]);
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);
  const [todayStr, setTodayStr] = useState<string>(getTodayDateStr());

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
  const [satellitesVisible, setSatellitesVisible] = useState(false);
  const [hoveredSatelliteId, setHoveredSatelliteId] = useState<string | null>(null);
  const [confirmingHabitId, setConfirmingHabitId] = useState<string | null>(null);
  const [justCompletedHabit, setJustCompletedHabit] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const confirmTimerRef = useRef<any>(null);
  const hoverTimeoutRef = useRef<any>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const positionRef = useRef(position);
  positionRef.current = position;

  // Active list of all habits
  const allHabits = contextHabits && contextHabits.length > 0 ? contextHabits : storedHabits;
  // Active list of todo groups
  const allTodoGroups =
    contextTodoGroups && contextTodoGroups.length > 0 ? contextTodoGroups : storedTodoGroups;

  // Update todayStr when date changes (midnight roll)
  useEffect(() => {
    const checkDate = () => {
      const current = getTodayDateStr();
      setTodayStr((prev) => (prev !== current ? current : prev));
    };
    const interval = setInterval(checkDate, 60000);
    return () => clearInterval(interval);
  }, []);

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

  // Load todo groups from browser.storage.local (works across all tabs / origins)
  useEffect(() => {
    if (contextTodoGroups && contextTodoGroups.length > 0) return;

    let isMounted = true;

    async function loadTodoGroups() {
      try {
        if (browser?.storage?.local) {
          const stored = await browser.storage.local.get(TODO_GROUPS_STORAGE_KEY);
          const groups = stored[TODO_GROUPS_STORAGE_KEY] as TodoGroup[] | undefined;
          if (isMounted && Array.isArray(groups) && groups.length > 0) {
            setStoredTodoGroups(groups);
          }
        }
      } catch (err) {
        console.warn("[Halberd] Could not load todo groups from storage:", err);
      }
    }

    loadTodoGroups();

    const handleTodoGroupsChange = (
      changes: Record<string, { oldValue?: any; newValue?: any }>,
      areaName?: string
    ) => {
      if ((!areaName || areaName === "local") && changes[TODO_GROUPS_STORAGE_KEY]?.newValue) {
        const newGroups = changes[TODO_GROUPS_STORAGE_KEY].newValue as TodoGroup[];
        if (Array.isArray(newGroups)) {
          setStoredTodoGroups(newGroups);
        }
      }
    };

    try {
      if (browser?.storage?.onChanged) {
        browser.storage.onChanged.addListener(handleTodoGroupsChange);
      }
    } catch {}

    return () => {
      isMounted = false;
      try {
        if (browser?.storage?.onChanged) {
          browser.storage.onChanged.removeListener(handleTodoGroupsChange);
        }
      } catch {};
    };
  }, [contextTodoGroups]);

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

  // Load saved position from browser storage
  useEffect(() => {
    let isMounted = true;

    async function loadPosition() {
      try {
        if (browser?.storage?.local) {
          const result = await browser.storage.local.get(STORAGE_KEY);
          const savedPos = result?.[STORAGE_KEY] as Position | undefined;
          if (savedPos && typeof savedPos.x === "number" && typeof savedPos.y === "number") {
            if (isMounted) {
              setPosition(clampPosition(savedPos.x, savedPos.y));
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
        const newPos = changes[STORAGE_KEY].newValue as Position;
        if (!isDraggingRef.current && typeof newPos.x === "number" && typeof newPos.y === "number") {
          setPosition(clampPosition(newPos.x, newPos.y));
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
  }, [clampPosition]);

  // Current active habit (or the habit waiting for confirmation)
  const currentHabit = confirmingHabitId
    ? pendingHabits.find((h) => h.id === confirmingHabitId) || null
    : pendingHabits.length > 0
    ? pendingHabits[currentEmojiIndex % pendingHabits.length]
    : null;

  // Handle click with confirmation requirement
  const handleHabitClick = () => {
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

    setPosition(clamped);
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

    const distMoved = Math.hypot(
      e.clientX - startPosRef.current.x,
      e.clientY - startPosRef.current.y
    );

    const finalPos = positionRef.current;

    try {
      if (browser?.storage?.local) {
        browser.storage.local
          .set({ [STORAGE_KEY]: finalPos })
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
      setIsDragging(false);
      isDraggingRef.current = false;
    }
  };

  // Determine displayed emoji & state
  const isAllDone = pendingHabits.length === 0;
  const isConfirming = confirmingHabitId !== null;

  const displayEmoji = justCompletedHabit
    ? "🎉"
    : isConfirming
    ? "✅"
    : isAllDone
    ? "🎉"
    : currentHabit?.emoji || "⚔️";

  const nativeTitle = isConfirming
    ? "is it really completed?"
    : justCompletedHabit
    ? `Done: ${justCompletedHabit}! 🎉`
    : isAllDone
    ? "All habits completed for today! 🎉"
    : currentHabit
    ? `Click to complete "${currentHabit.name}"`
    : "Halberd";

  // Position tooltip above or below circle based on screen clearance
  const isNearTop = position.y < 60;
  const isNearRight = typeof window !== "undefined" && position.x > window.innerWidth - 180;

  // Satellite geometry
  const mainCX = position.x + CIRCLE_SIZE / 2;
  const mainCY = position.y + CIRCLE_SIZE / 2;
  const satelliteOffsets = getSatellitePositions(
    allTodoGroups.length,
    mainCX,
    mainCY,
    SATELLITE_RADIUS
  );

  return (
    <>
      {/* Inject keyframe animations — works in shadow DOM */}
      <style>{`
        @keyframes halberd-tooltip-pop {
          0% { transform: translateY(4px) scale(0.92); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
      `}</style>

      {/* Satellite circles — one per todo group, rendered at fixed positions */}
      {allTodoGroups.map((group, i) => {
        const offset = satelliteOffsets[i];
        if (!offset) return null;
        const palette = SATELLITE_COLORS[i % SATELLITE_COLORS.length]!;
        const topTodo = getTopTodo(group);
        const initial = getGroupInitial(group.name);
        const isHov = hoveredSatelliteId === group.id;
        const satAbsX = mainCX + offset.x;
        const satAbsY = mainCY + offset.y;
        const tooltipOnLeft = typeof window !== "undefined" && satAbsX > window.innerWidth / 2;
        const tooltipOnTop = typeof window !== "undefined" && satAbsY > window.innerHeight * 0.6;

        return (
          <div
            key={group.id}
            style={{
              position: "fixed",
              left: `${satAbsX - SATELLITE_SIZE / 2}px`,
              top: `${satAbsY - SATELLITE_SIZE / 2}px`,
              width: `${SATELLITE_SIZE}px`,
              height: `${SATELLITE_SIZE}px`,
              zIndex: 2147483646,
              pointerEvents: satellitesVisible ? "auto" : "none",
            }}
            onMouseEnter={() => {
              if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
              setSatellitesVisible(true);
              setHoveredSatelliteId(group.id);
            }}
            onMouseLeave={() => {
              hoverTimeoutRef.current = setTimeout(() => {
                setHoveredSatelliteId(null);
                setSatellitesVisible(false);
              }, 120);
            }}
          >
            {/* Satellite dot */}
            <div
              style={{
                width: `${SATELLITE_SIZE}px`,
                height: `${SATELLITE_SIZE}px`,
                borderRadius: "50%",
                backgroundColor: palette.bg,
                border: `1.5px solid ${palette.border}`,
                boxShadow: isHov
                  ? `0 8px 20px -4px rgba(0,0,0,0.22), 0 0 0 2.5px ${palette.border}`
                  : "0 4px 12px -2px rgba(0,0,0,0.14)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "Inter, system-ui, sans-serif",
                fontSize: "13px",
                fontWeight: 700,
                color: palette.text,
                letterSpacing: "0.01em",
                transform: satellitesVisible
                  ? isHov
                    ? "scale(1.2)"
                    : "scale(1)"
                  : "scale(0)",
                opacity: satellitesVisible ? 1 : 0,
                transition: satellitesVisible
                  ? `transform 0.3s cubic-bezier(0.34,1.56,0.64,1) ${i * 45}ms, opacity 0.22s ease ${i * 45}ms, box-shadow 0.18s ease`
                  : `transform 0.18s ease ${(allTodoGroups.length - 1 - i) * 30}ms, opacity 0.15s ease ${(allTodoGroups.length - 1 - i) * 30}ms`,
              }}
            >
              {initial}
            </div>

            {/* Tooltip — top incomplete todo */}
            {isHov && (
              <div
                style={{
                  position: "absolute",
                  [tooltipOnTop ? "bottom" : "top"]: `${SATELLITE_SIZE + 8}px`,
                  [tooltipOnLeft ? "right" : "left"]: "50%",
                  transform: tooltipOnLeft ? "translateX(50%)" : "translateX(-50%)",
                  backgroundColor: "rgba(10, 18, 30, 0.94)",
                  color: "#e8f0ea",
                  padding: "8px 13px",
                  borderRadius: "10px",
                  fontSize: "11.5px",
                  fontWeight: 500,
                  fontFamily: "Inter, system-ui, sans-serif",
                  whiteSpace: "nowrap",
                  maxWidth: "220px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  boxShadow: "0 10px 25px -3px rgba(0,0,0,0.32), 0 4px 8px -2px rgba(0,0,0,0.18)",
                  border: `1px solid ${palette.border}`,
                  backdropFilter: "blur(10px)",
                  pointerEvents: "none",
                  zIndex: 2147483647,
                  animation: "halberd-tooltip-pop 0.18s cubic-bezier(0.34, 1.56, 0.64, 1)",
                  lineHeight: "1.45",
                }}
              >
                <div
                  style={{
                    fontSize: "9px",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: palette.bg,
                    marginBottom: "3px",
                    fontWeight: 700,
                  }}
                >
                  {group.name}
                </div>
                <div style={{ color: topTodo ? "#e8f0ea" : "#94c7a4" }}>
                  {topTodo ?? "✓ All done!"}
                </div>
              </div>
            )}
          </div>
        );
      })}

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
      }}
    >
      {/* Visual Tooltip for Confirmation */}
      {isConfirming && (
        <div
          style={{
            position: "absolute",
            [isNearTop ? "top" : "bottom"]: `${CIRCLE_SIZE + 10}px`,
            [isNearRight ? "right" : "left"]: isNearRight ? "0px" : "50%",
            transform: isNearRight ? "none" : "translateX(-50%)",
            backgroundColor: "rgba(15, 23, 42, 0.94)",
            color: "#ffffff",
            padding: "7px 14px",
            borderRadius: "10px",
            fontSize: "12px",
            fontWeight: 600,
            whiteSpace: "nowrap",
            boxShadow: "0 10px 25px -3px rgba(0, 0, 0, 0.35), 0 4px 6px -2px rgba(0, 0, 0, 0.2)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            backdropFilter: "blur(8px)",
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

      {/* Main Floating Circle */}
      <div
        style={{
          width: `${CIRCLE_SIZE}px`,
          height: `${CIRCLE_SIZE}px`,
          borderRadius: "50%",
          backgroundColor: "#ffffff",
          boxShadow: isDragging
            ? "0 20px 32px -4px rgba(0, 0, 0, 0.28), 0 10px 16px -4px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(99, 102, 241, 0.35)"
            : isConfirming
            ? "0 14px 28px -4px rgba(34, 197, 94, 0.4), 0 6px 12px -2px rgba(34, 197, 94, 0.25), 0 0 0 2.5px rgba(34, 197, 94, 0.6)"
            : justCompletedHabit
            ? "0 14px 28px -4px rgba(99, 102, 241, 0.4), 0 6px 12px -2px rgba(99, 102, 241, 0.2), 0 0 0 2px rgba(99, 102, 241, 0.5)"
            : isHovered
            ? "0 14px 28px -4px rgba(0, 0, 0, 0.2), 0 6px 12px -2px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.08)"
            : "0 10px 22px -3px rgba(0, 0, 0, 0.16), 0 4px 8px -2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: isDragging ? "grabbing" : "pointer",
          transform: isDragging
            ? "scale(1.08)"
            : isConfirming
            ? "scale(1.12)"
            : justCompletedHabit
            ? "scale(1.15)"
            : isHovered
            ? "scale(1.06)"
            : "scale(1)",
          transition: isDragging
            ? "transform 0.1s ease, box-shadow 0.15s ease"
            : "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease",
          pointerEvents: "auto",
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerCancel}
        onMouseEnter={() => {
          setIsHovered(true);
          if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
          setSatellitesVisible(true);
        }}
        onMouseLeave={() => {
          setIsHovered(false);
          hoverTimeoutRef.current = setTimeout(() => {
            setSatellitesVisible(false);
            setHoveredSatelliteId(null);
          }, 120);
        }}
        title={nativeTitle}
      >
        <div
          style={{
            pointerEvents: "none",
            userSelect: "none",
            WebkitUserSelect: "none",
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
            transform: isTransitioning
              ? "scale(0.7) rotate(-10deg)"
              : isConfirming
              ? "scale(1.15)"
              : "scale(1) rotate(0deg)",
            opacity: isTransitioning ? 0.4 : 1,
            transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease",
          }}
        >
          <AnimatedEmoji emoji={displayEmoji} size={30} />
        </div>
      </div>
    </div>
    </>
  );
}
