"use client";

import { useState, useEffect } from "react";

interface NavItem {
  icon: string;
  label: string;
}

interface NavbarProps {
  activeItem?: string;
  navItems?: NavItem[];
  onNavClick?: (icon: string) => void;
  position?: "bottom-center" | "left" | "right";
}

const defaultNavItems: NavItem[] = [
  { icon: "center_focus_strong", label: "Focus" },
  // { icon: "calendar_today", label: "Calendar" },
  { icon: "emoji_events", label: "Achievements" },
  { icon: "timer", label: "Timer" },
  { icon: "analytics", label: "Analytics" },
  { icon: "construction", label: "Construction" },
  { icon: "checklist", label: "Habits" },
  { icon: "settings", label: "Settings" },
];

export default function Navbar({ activeItem, navItems = defaultNavItems, onNavClick, position = "bottom-center" }: NavbarProps) {
  const [timeParts, setTimeParts] = useState({ hours: "", minutes: "", ampm: "" });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = now.getHours() >= 12 ? "PM" : "AM";
      const displayHours = now.getHours() % 12 || 12;
      setTimeParts({
        hours: displayHours.toString().padStart(2, "0"),
        minutes,
        ampm,
      });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleClick = (icon: string) => {
    if (onNavClick) {
      onNavClick(icon);
    }
  };

  const isBottomCenter = position === "bottom-center";
  const isLeft = position === "left";
  const isRight = position === "right";

  return (
    <>
      {/* Top Navigation (Desktop) */}
      <nav className="top-navigation hidden md:flex " aria-label="Desktop header">
        <div className="brand-desktop" style={{ fontSize: "58px", fontWeight: 300, letterSpacing: "-2.5px", color: "white", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ display: "flex", alignItems: "baseline" }}>
            <span>{timeParts.hours}:{timeParts.minutes}</span>
            <span style={{ fontSize: "17px", fontWeight: 400, letterSpacing: "0.2px", opacity: 0.95, marginLeft: "10px" }}>{timeParts.ampm}</span>
          </span>
          <div style={{ width: "140px", height: "1px", marginTop: "9px", background: "rgba(255, 255, 255, 0.35)" }} />
          <div style={{ marginTop: "8px", fontSize: "15px", fontWeight: 400, letterSpacing: "0.1px", color: "rgba(255, 255, 255, 0.72)" }}>
            Focus deeply. Make progress.
          </div>
        </div>
      </nav>
      {/* Top Navigation (Mobile) */}
      <nav className="top-navigation md:hidden flex" aria-label="Mobile header">
        <div className="brand-mobile" style={{ fontSize: "58px", fontWeight: 300, letterSpacing: "-2.5px", color: "white", fontFamily: "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", display: "flex", flexDirection: "column", alignItems: "flex-start" }}>
          <span style={{ display: "flex", alignItems: "baseline" }}>
            <span>{timeParts.hours}:{timeParts.minutes}</span>
            <span style={{ fontSize: "17px", fontWeight: 400, letterSpacing: "0.2px", opacity: 0.95, marginLeft: "10px" }}>{timeParts.ampm}</span>
          </span>
          <div style={{ width: "140px", height: "1px", marginTop: "9px", background: "rgba(255, 255, 255, 0.35)" }} />
          <div style={{ marginTop: "8px", fontSize: "15px", fontWeight: 400, letterSpacing: "0.1px", color: "rgba(255, 255, 255, 0.72)" }}>
            Focus deeply. Make progress.
          </div>
        </div>
      </nav>

      {/* Bottom Navigation Dock - Bottom Center (Default) */}
      {isBottomCenter && (
        <div className="dock-shell fixed left-1/2 -translate-x-1/2 bottom-dock-inset z-50">
          <div className="dock-meta dock-meta--left hidden sm:flex font-headline-page text-headline-page font-medium text-white">
            Halberd
          </div>
          <nav className="dock-nav flex flex-row items-center justify-center" aria-label="Primary navigation">
            {navItems.map((item) => (
              <button
                key={item.icon}
                onClick={() => handleClick(item.icon)}
                aria-label={item.label}
                aria-current={item.icon === activeItem ? "page" : undefined}
                title={item.label}
                className={`icon-button dock-button transition-all ${
                  item.icon === activeItem
                    ? "bg-primary-container/30 text-primary"
                    : "text-text-secondary hover:text-primary transition-colors"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[20px]"
                  style={{
                    fontVariationSettings: item.icon === activeItem ? "'FILL' 1, 'wght' 300" : "'FILL' 0, 'wght' 300",
                  }}
                >
                  {item.icon}
                </span>
              </button>
            ))}
          </nav>
          <div className="dock-meta dock-meta--right hidden sm:flex text-white">
            <div className="flex items-center gap-1 mr-4">
              <span className="material-symbols-outlined text-[18px] text-white" aria-hidden="true">light_mode</span>
              <span className="font-label-secondary text-label-secondary text-white">24°</span>
            </div>
            <span className="material-symbols-outlined text-[20px] opacity-50" aria-hidden="true">pets</span>
          </div>
        </div>
      )}

      {/* Left Sidebar Navigation */}
      {isLeft && (
        <nav className="fixed left-0 top-0 bottom-0 z-50 w-20 md:w-24 bg-surface-white/80 dark:bg-surface-white/80 backdrop-blur-md border-r border-border-subtle flex flex-col items-center justify-start pt-20 pb-dock-inset px-2 md:px-3" aria-label="Primary navigation">
          <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.icon}
                onClick={() => handleClick(item.icon)}
                aria-label={item.label}
                aria-current={item.icon === activeItem ? "page" : undefined}
                title={item.label}
                className={`icon-button transition-all w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl ${
                  item.icon === activeItem
                    ? "bg-primary-container/30 text-primary"
                    : "text-text-secondary hover:text-primary hover:bg-surface-container transition-colors"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px] md:text-[24px]"
                  style={{
                    fontVariationSettings: item.icon === activeItem ? "'FILL' 1, 'wght' 300" : "'FILL' 0, 'wght' 300",
                  }}
                >
                  {item.icon}
                </span>
              </button>
            ))}
          </div>
          <div className="dock-meta dock-meta--right mb-4 text-center px-2">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="material-symbols-outlined text-[18px] text-white" aria-hidden="true">light_mode</span>
              <span className="font-label-secondary text-label-secondary text-white">24°</span>
            </div>
            <span className="material-symbols-outlined text-[20px] opacity-50 text-white" aria-hidden="true">pets</span>
          </div>
        </nav>
      )}

      {/* Right Sidebar Navigation */}
      {isRight && (
        <nav className="fixed right-0 top-0 bottom-0 z-50 w-20 md:w-24 bg-surface-white/80 dark:bg-surface-white/80 backdrop-blur-md border-l border-border-subtle flex flex-col items-center justify-start pt-20 pb-dock-inset px-2 md:px-3" aria-label="Primary navigation">
          <div className="flex flex-col items-center gap-2 flex-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.icon}
                onClick={() => handleClick(item.icon)}
                aria-label={item.label}
                aria-current={item.icon === activeItem ? "page" : undefined}
                title={item.label}
                className={`icon-button transition-all w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-xl ${
                  item.icon === activeItem
                    ? "bg-primary-container/30 text-primary"
                    : "text-text-secondary hover:text-primary hover:bg-surface-container transition-colors"
                }`}
              >
                <span
                  className="material-symbols-outlined text-[22px] md:text-[24px]"
                  style={{
                    fontVariationSettings: item.icon === activeItem ? "'FILL' 1, 'wght' 300" : "'FILL' 0, 'wght' 300",
                  }}
                >
                  {item.icon}
                </span>
              </button>
            ))}
          </div>
          <div className="dock-meta dock-meta--right mb-4 text-center px-2">
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="material-symbols-outlined text-[18px] text-white" aria-hidden="true">light_mode</span>
              <span className="font-label-secondary text-label-secondary text-white">24°</span>
            </div>
            <span className="material-symbols-outlined text-[20px] opacity-50 text-white" aria-hidden="true">pets</span>
          </div>
        </nav>
      )}
    </>
  );
}
