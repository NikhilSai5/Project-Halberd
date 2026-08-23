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

export default function Navbar({ activeItem, navItems = defaultNavItems, onNavClick }: NavbarProps) {
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours().toString().padStart(2, "0");
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const ampm = now.getHours() >= 12 ? "PM" : "AM";
      const displayHours = now.getHours() % 12 || 12;
      setCurrentTime(`${displayHours.toString().padStart(2, "0")}:${minutes} ${ampm}`);
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

  return (
    <>
      {/* Top Navigation (Desktop) */}
      <nav className="top-navigation hidden md:flex" aria-label="Desktop header">
        <div className="brand-desktop font-headline-page text-headline-page font-medium text-text-primary dark:text-surface-white">Halberd</div>
        <div className="flex items-center gap-6">
          <span className="top-header-unavailable material-symbols-outlined text-text-muted" aria-hidden="true" data-icon="close">close</span>
        </div>
      </nav>
      {/* Top Navigation (Mobile) */}
      <nav className="top-navigation md:hidden flex" aria-label="Mobile header">
        <div className="brand-mobile font-headline-page-mobile text-headline-page-mobile font-medium text-text-primary">Halberd</div>
      </nav>
      {/* Bottom Navigation Dock */}
      <div className="dock-shell fixed left-1/2 -translate-x-1/2 z-50">
        <div className="dock-meta dock-meta--left hidden sm:flex font-caption-metadata text-caption-metadata text-text-muted uppercase tracking-widest">
          {currentTime}
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
        <div className="dock-meta dock-meta--right hidden sm:flex text-text-muted">
          <div className="flex items-center gap-1 mr-4">
            <span className="material-symbols-outlined text-[18px] text-text-secondary" aria-hidden="true">light_mode</span>
            <span className="font-label-secondary text-label-secondary text-text-secondary">24°</span>
          </div>
          <span className="material-symbols-outlined text-[20px] opacity-50" aria-hidden="true">pets</span>
        </div>
      </div>
    </>
  );
}
