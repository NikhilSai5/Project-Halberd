"use client";

import { useState } from "react";
import Home from './pages/Home/Home';
import Pomodoro from './pages/Pomodoro/Pomodoro';
import WeeklyGoal from './pages/WeeklyGoal/WeeklyGoal';
import FocusMode from './pages/FocusMode/FocusMode';
import Tools from './pages/Tools/Tools';
import Settings from './pages/Settings/Settings';
import Calendar from './pages/Calendar/Calendar';
import HabitTracker from './pages/HabitTracker/HabitTracker';
import Navbar from '@/components/Navbar';
import { SettingsProvider, useSettings } from '@/lib/SettingsContext';
import './style.css';

type Page = "home" | "pomodoro" | "weekly-goal" | "focus" | "tools" | "settings" | "calendar" | "habit-tracker";
type NavbarPosition = "bottom-center" | "left" | "right";

function AppContent() {
  const {
    showTodoListInHome,
    wallpapers,
    activeWallpaper,
    wallpaperBlur,
    wallpaperDarkness,
  } = useSettings();
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [focusTrigger, setFocusTrigger] = useState<"center_focus_strong" | "analytics">("analytics");
  const [navbarPosition, setNavbarPosition] = useState<NavbarPosition>("bottom-center");

  const handleNavClick = (icon: string) => {
    if (icon === "timer") {
      setCurrentPage("pomodoro");
    } else if (icon === "center_focus_strong") {
      setCurrentPage("home");
    } else if (icon === "emoji_events") {
      setCurrentPage("weekly-goal");
    } else if (icon === "analytics") {
      setFocusTrigger("analytics");
      setCurrentPage("focus");
    } else if (icon === "construction") {
      setCurrentPage("tools");
    } else if (icon === "settings") {
      setCurrentPage("settings");
    } else if (icon === "calendar_today") {
      setCurrentPage("calendar");
    } else if (icon === "checklist") {
      setCurrentPage("habit-tracker");
    }
  };

  const getActiveItem = () => {
    if (currentPage === "pomodoro") return "timer";
    if (currentPage === "weekly-goal") return "emoji_events";
    if (currentPage === "focus") return focusTrigger;
    if (currentPage === "tools") return "construction";
    if (currentPage === "settings") return "settings";
    if (currentPage === "calendar") return "calendar_today";
    if (currentPage === "habit-tracker") return "checklist";
    return "center_focus_strong";
  };

  const selectedWallpaper = wallpapers.find((wallpaper) => wallpaper.id === activeWallpaper);

  const backgroundStyle = selectedWallpaper ? {
    backgroundImage: `url("${selectedWallpaper.preview}")`,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    backgroundRepeat: 'no-repeat',
  } : {};
  const effectsStyle = {
    "--wallpaper-blur": `${wallpaperBlur}px`,
    "--wallpaper-darkness": `${wallpaperDarkness / 100}`,
  } as React.CSSProperties;

  return (
    <div className="app-shell" style={effectsStyle}>
      <div className="wallpaper-image" style={backgroundStyle} aria-hidden="true" />
      <div className="wallpaper-effects" aria-hidden="true" />
      <div className="app-shell-content">
        <Navbar activeItem={getActiveItem()} onNavClick={handleNavClick} position={navbarPosition} />
        {currentPage === "home" && <Home showTodoList={showTodoListInHome} />}
        {currentPage === "pomodoro" && <Pomodoro />}
        {currentPage === "weekly-goal" && <WeeklyGoal />}
        {currentPage === "focus" && <FocusMode />}
        {currentPage === "tools" && <Tools />}
        {currentPage === "settings" && <Settings />}
        {currentPage === "calendar" && <Calendar />}
        {currentPage === "habit-tracker" && <HabitTracker />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <SettingsProvider>
      <AppContent />
    </SettingsProvider>
  );
}
