"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const STORAGE_KEY = "halberd_floating_circle_pos";
const CIRCLE_SIZE = 56;
const MARGIN = 16;

interface Position {
  x: number;
  y: number;
}

export default function FloatingCircle() {
  const [position, setPosition] = useState<Position>(() => {
    // Default to top-right corner
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
  const [hasLoaded, setHasLoaded] = useState(false);

  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const startPosRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const positionRef = useRef(position);
  positionRef.current = position;

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
        if (typeof browser !== "undefined" && browser.storage?.local) {
          const stored = await browser.storage.local.get(STORAGE_KEY);
          const savedPos = stored[STORAGE_KEY] as Position | undefined;
          if (savedPos && typeof savedPos.x === "number" && typeof savedPos.y === "number") {
            if (isMounted) {
              setPosition(clampPosition(savedPos.x, savedPos.y));
              setHasLoaded(true);
            }
            return;
          }
        }
      } catch (err) {
        console.warn("[Halberd] Could not load saved circle position:", err);
      }

      // Default to top-right corner if no stored position
      if (isMounted) {
        setPosition({
          x: Math.max(MARGIN, window.innerWidth - CIRCLE_SIZE - MARGIN),
          y: MARGIN,
        });
        setHasLoaded(true);
      }
    }

    loadPosition();

    // Listen for storage changes across tabs
    const handleStorageChange = (
      changes: Record<string, { oldValue?: any; newValue?: any }>,
      area: string
    ) => {
      if (area === "local" && changes[STORAGE_KEY]?.newValue) {
        const newPos = changes[STORAGE_KEY].newValue as Position;
        if (!isDraggingRef.current && typeof newPos.x === "number" && typeof newPos.y === "number") {
          setPosition(clampPosition(newPos.x, newPos.y));
        }
      }
    };

    if (typeof browser !== "undefined" && browser.storage?.onChanged) {
      browser.storage.onChanged.addListener(handleStorageChange);
    }

    // Keep circle within viewport on window resize
    const handleResize = () => {
      if (!isDraggingRef.current) {
        setPosition((prev) => clampPosition(prev.x, prev.y));
      }
    };

    window.addEventListener("resize", handleResize);

    return () => {
      isMounted = false;
      window.removeEventListener("resize", handleResize);
      if (typeof browser !== "undefined" && browser.storage?.onChanged) {
        browser.storage.onChanged.removeListener(handleStorageChange);
      }
    };
  }, [clampPosition]);

  // Pointer drag event handlers
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Only drag on main click / touch
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
    } catch {
      // Ignored
    }

    setIsDragging(false);
    isDraggingRef.current = false;

    // Detect if this was a click vs drag
    const distMoved = Math.hypot(
      e.clientX - startPosRef.current.x,
      e.clientY - startPosRef.current.y
    );

    const finalPos = positionRef.current;

    // Persist position to browser.storage
    if (typeof browser !== "undefined" && browser.storage?.local) {
      browser.storage.local
        .set({ [STORAGE_KEY]: finalPos })
        .catch((err) => console.warn("[Halberd] Failed to save circle position:", err));
    }

    if (distMoved < 5) {
      // Click action - trigger brief bounce/feedback
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
          ? "0 20px 30px -5px rgba(0, 0, 0, 0.28), 0 10px 15px -5px rgba(0, 0, 0, 0.15), 0 0 0 2px rgba(99, 102, 241, 0.35)"
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
          : "transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, opacity 0.3s ease",
        opacity: hasLoaded ? 1 : 0,
        pointerEvents: "auto",
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      title="Halberd (Drag to move)"
    >
      <span
        style={{
          fontSize: "26px",
          lineHeight: "1",
          pointerEvents: "none",
          userSelect: "none",
          WebkitUserSelect: "none",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
        }}
      >
        ⚔️
      </span>
    </div>
  );
}
