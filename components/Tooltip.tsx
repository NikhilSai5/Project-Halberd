"use client";

import * as React from "react";
import ReactDOM from "react-dom";

interface TooltipProps {
  children: React.ReactElement;
  content: React.ReactNode;
  side?: "top" | "bottom" | "left" | "right";
  align?: "center" | "start" | "end";
  offset?: number;
  delay?: number;
  hideDelay?: number;
}

interface TooltipContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.MutableRefObject<HTMLElement | null>;
  contentRef: React.MutableRefObject<HTMLDivElement | null>;
}

const TooltipContext = React.createContext<TooltipContextType | null>(null);

export function Tooltip({
  children,
  content,
  side = "top",
  align = "center",
  offset = 8,
  delay = 200,
  hideDelay = 100,
}: TooltipProps) {
  const [open, setOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const triggerRef = React.useRef<HTMLElement | null>(null);
  const contentRef = React.useRef<HTMLDivElement | null>(null);
  const showTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    setMounted(true);
    return () => {
      if (showTimeoutRef.current) clearTimeout(showTimeoutRef.current);
      if (hideTimeoutRef.current) clearTimeout(hideTimeoutRef.current);
    };
  }, []);

  const handleMouseEnter = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    showTimeoutRef.current = setTimeout(() => setOpen(true), delay);
  };

  const handleMouseLeave = () => {
    if (showTimeoutRef.current) {
      clearTimeout(showTimeoutRef.current);
      showTimeoutRef.current = null;
    }
    hideTimeoutRef.current = setTimeout(() => setOpen(false), hideDelay);
  };

  const handleFocus = () => setOpen(true);
  const handleBlur = () => setOpen(false);

  const contextValue = React.useMemo(
    () => ({
      open,
      setOpen,
      triggerRef,
      contentRef,
    }),
    [open]
  );

  const childProps = {
    ref: triggerRef,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
  };

  const triggerElement = React.isValidElement(children)
    ? React.cloneElement(children, childProps)
    : React.createElement("div", childProps, children);

  if (!mounted) return <>{triggerElement}</>;

  return (
    <TooltipContext.Provider value={contextValue}>
      {triggerElement}
      <TooltipContent
        content={content}
        side={side}
        align={align}
        offset={offset}
        open={open}
      />
    </TooltipContext.Provider>
  );
}

interface TooltipContentProps {
  content: React.ReactNode;
  side: "top" | "bottom" | "left" | "right";
  align: "center" | "start" | "end";
  offset: number;
  open: boolean;
}

function TooltipContent({
  content,
  side,
  align,
  offset,
  open,
}: TooltipContentProps) {
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const context = React.useContext(TooltipContext);
  const triggerRef = context?.triggerRef;
  const contentRef = context?.contentRef;

  const updatePosition = React.useCallback(() => {
    if (!triggerRef?.current || !contentRef?.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const contentRect = contentRef.current.getBoundingClientRect();

    let x = 0;
    let y = 0;

    switch (side) {
      case "top":
        y = triggerRect.top - contentRect.height - offset;
        break;
      case "bottom":
        y = triggerRect.bottom + offset;
        break;
      case "left":
        x = triggerRect.left - contentRect.width - offset;
        break;
      case "right":
        x = triggerRect.right + offset;
        break;
    }

    if (side === "top" || side === "bottom") {
      switch (align) {
        case "start":
          x = triggerRect.left;
          break;
        case "end":
          x = triggerRect.right - contentRect.width;
          break;
        default:
          x = triggerRect.left + triggerRect.width / 2 - contentRect.width / 2;
      }
    } else {
      switch (align) {
        case "start":
          y = triggerRect.top;
          break;
        case "end":
          y = triggerRect.bottom - contentRect.height;
          break;
        default:
          y = triggerRect.top + triggerRect.height / 2 - contentRect.height / 2;
      }
    }

    const padding = 8;
    x = Math.max(padding, Math.min(x, window.innerWidth - contentRect.width - padding));
    y = Math.max(padding, Math.min(y, window.innerHeight - contentRect.height - padding));

    setPosition({ x, y });
  }, [side, align, offset, triggerRef, contentRef]);

  React.useEffect(() => {
    if (open) {
      const id = requestAnimationFrame(updatePosition);
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        cancelAnimationFrame(id);
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }
  }, [open, updatePosition]);

  if (!open) return null;

  const arrowStyles: Record<string, React.CSSProperties> = {
    top: {
      bottom: -4,
      left: align === "center" ? "50%" : align === "start" ? "16px" : undefined,
      right: align === "end" ? "16px" : undefined,
      transform: align === "center" ? "translateX(-50%) rotate(45deg)" : "rotate(45deg)",
    },
    bottom: {
      top: -4,
      left: align === "center" ? "50%" : align === "start" ? "16px" : undefined,
      right: align === "end" ? "16px" : undefined,
      transform: align === "center" ? "translateX(-50%) rotate(45deg)" : "rotate(45deg)",
    },
    left: {
      right: -4,
      top: align === "center" ? "50%" : align === "start" ? "8px" : undefined,
      bottom: align === "end" ? "8px" : undefined,
      transform: align === "center" ? "translateY(-50%) rotate(45deg)" : "rotate(45deg)",
    },
    right: {
      left: -4,
      top: align === "center" ? "50%" : align === "start" ? "8px" : undefined,
      bottom: align === "end" ? "8px" : undefined,
      transform: align === "center" ? "translateY(-50%) rotate(45deg)" : "rotate(45deg)",
    },
  };

  return ReactDOM.createPortal(
    <div
      ref={contentRef}
      className="fixed z-[9999] pointer-events-none animate-tooltip-in"
      style={{
        top: position.y,
        left: position.x,
        maxWidth: "200px",
      }}
      onMouseEnter={() => context?.setOpen(true)}
      onMouseLeave={() => context?.setOpen(false)}
    >
      <div
        className="relative bg-surface-white/95 dark:bg-surface-white/95 backdrop-blur-sm border border-border-subtle rounded-lg px-3 py-1.5 text-xs font-medium text-text-primary shadow-lg"
      >
        <div
          className="absolute w-2 h-2 bg-surface-white/95 dark:bg-surface-white/95 border border-border-subtle border-t-0 border-l-0"
          style={arrowStyles[side]}
        />
        {content}
      </div>
    </div>,
    document.body
  );
}

export function useTooltip() {
  const context = React.useContext(TooltipContext);
  if (!context) {
    throw new Error("useTooltip must be used within a Tooltip component");
  }
  return context;
}