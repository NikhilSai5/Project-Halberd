"use client";

import React, { useState, useEffect, useRef, useCallback, useContext } from "react";
import { SettingsContext, type Habit } from "@/lib/SettingsContext";
import { browser } from "wxt/browser";

const STORAGE_KEY = "halberd_floating_circle_pos";
const HABITS_STORAGE_KEY = "halberd_habits";
const CIRCLE_SIZE = 54;
const SLIDESHOW_INTERVAL = 6000; // 6 seconds per emoji, synced across all tabs
const MARGIN = 16;

const DEFAULT_HABIT_EMOJIS = ["📚", "💪", "🇯🇵", "🚫", "⚔️"];

interface Position {
  x: number;
  y: number;
}

export default function FloatingCircle() {
  const settingsContext = useContext(SettingsContext);
  const contextHabits = settingsContext?.habits;

  const [storedHabits, setStoredHabits] = useState<Habit[]>([]);
  const [currentEmojiIndex, setCurrentEmojiIndex] = useState(0);

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
  const [isClicked, setIsClicked] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const positionRef = useRef(position);
  positionRef.current = position;

  // Active list of habits (from context if in New Tab, or from storage if on other websites)
  const effectiveHabits = contextHabits && contextHabits.length > 0 ? contextHabits : storedHabits;
  const emojiList =
    effectiveHabits.length > 0
      ? effectiveHabits.map((h) => h.emoji).filter(Boolean)
      : DEFAULT_HABIT_EMOJIS;

  // Load habits from browser.storage when outside SettingsProvider
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
  useEffect(() => {
    if (emojiList.length === 0) return;

    let timerId: any = null;

    const syncTick = () => {
      const now = Date.now();
      const index = Math.floor(now / SLIDESHOW_INTERVAL) % emojiList.length;

      setCurrentEmojiIndex((prev) => {
        if (prev !== index) {
          setIsTransitioning(true);
          setTimeout(() => setIsTransitioning(false), 200);
        }
        return index;
      });

      // Calculate exact milliseconds until the next interval transition boundary
      const msUntilNext = SLIDESHOW_INTERVAL - (now % SLIDESHOW_INTERVAL);
      timerId = setTimeout(syncTick, Math.max(20, msUntilNext + 10));
    };

    syncTick();

    return () => {
      if (timerId) clearTimeout(timerId);
    };
  }, [emojiList.length, emojiList.join("|")]);

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

    // Listen for storage changes across tabs
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
    };
  }, [clampPosition]);

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

    if (distMoved < 5) {
      setIsClicked(true);
      setTimeout(() => setIsClicked(false), 300);
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

  const activeEmoji = emojiList[currentEmojiIndex % emojiList.length] || "⚔️";

  return (
    <div
      style={{
        position: "fixed",
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: `${CIRCLE_SIZE}px`,
        height: `${CIRCLE_SIZE}px`,
        borderRadius: "50%",
        backgroundColor: "#ffffff",
        boxShadow: isDragging
          ? "0 20px 32px -4px rgba(0, 0, 0, 0.28), 0 10px 16px -4px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(99, 102, 241, 0.35)"
          : isHovered
          ? "0 14px 28px -4px rgba(0, 0, 0, 0.2), 0 6px 12px -2px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.08)"
          : "0 10px 22px -3px rgba(0, 0, 0, 0.16), 0 4px 8px -2px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: isDragging ? "grabbing" : "grab",
        userSelect: "none",
        WebkitUserSelect: "none",
        touchAction: "none",
        zIndex: 2147483647,
        transform: isDragging
          ? "scale(1.08)"
          : isClicked
          ? "scale(0.92)"
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
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Halberd (Drag anywhere to move)"
    >
      <span
        style={{
          fontSize: "24px",
          lineHeight: "1",
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.12))",
          transform: isTransitioning ? "scale(0.7) rotate(-10deg)" : "scale(1) rotate(0deg)",
          opacity: isTransitioning ? 0.4 : 1,
          transition: "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease",
        }}
      >
        {activeEmoji}
      </span>
    </div>
  );
}
