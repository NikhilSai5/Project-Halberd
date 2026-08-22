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
  { icon: "calendar_today", label: "Calendar" },
  { icon: "emoji_events", label: "Achievements" },
  { icon: "timer", label: "Timer" },
  { icon: "analytics", label: "Analytics" },
  { icon: "construction", label: "Construction" },
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
      <nav className="hidden md:flex justify-between items-center w-full max-w-[1440px] mx-auto pt-[20px] px-[20px] bg-transparent fixed top-0 left-0 right-0 z-40">
        <div className="font-headline-page text-headline-page font-medium text-text-primary dark:text-surface-white">Halberd</div>
        <div className="flex items-center gap-6">
          <span className="material-symbols-outlined text-text-muted cursor-pointer hover:text-primary transition-colors active:scale-95 transition-transform" data-icon="close">close</span>
        </div>
      </nav>
      {/* Top Navigation (Mobile) */}
      <nav className="md:hidden flex justify-between items-center w-full max-w-[1440px] mx-auto pt-[20px] px-[20px] bg-transparent fixed top-0 left-0 right-0 z-40">
        <div className="font-headline-page-mobile text-headline-page-mobile font-medium text-text-primary">Halberd</div>
      </nav>
      {/* Bottom Navigation Dock */}
      <div className="fixed bottom-[24px] left-1/2 -translate-x-1/2 z-50 flex items-center justify-between w-[95%] max-w-[720px] px-[20px]">
        <div className="flex-1 flex justify-start items-center font-caption-metadata text-caption-metadata text-text-muted uppercase tracking-widest">
          {currentTime}
        </div>
        <nav className="flex flex-row items-center justify-center gap-1 bg-surface-white/80 backdrop-blur-md rounded-full px-4 py-2 border border-border-subtle shadow-xl">
          {navItems.map((item) => (
            <button
              key={item.icon}
              onClick={() => handleClick(item.icon)}
              className={`w-10 h-10 flex items-center justify-center transition-all rounded-full ${
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
        <div className="flex-1 flex justify-end items-center text-text-muted">
          <div className="flex items-center gap-1 mr-4">
            <span className="material-symbols-outlined text-[18px] text-text-secondary">light_mode</span>
            <span className="font-label-secondary text-label-secondary text-text-secondary">24°</span>
          </div>
          <span className="material-symbols-outlined text-[20px] opacity-50">pets</span>
        </div>
      </div>
    </>
  );
}