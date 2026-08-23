"use client";

import { useState } from "react";
import Home from './pages/Home/Home';
import Pomodoro from './pages/Pomodoro/Pomodoro';
import WeeklyGoal from './pages/WeeklyGoal/WeeklyGoal';
import FocusMode from './pages/FocusMode/FocusMode';
import Tools from './pages/Tools/Tools';
import Settings from './pages/Settings/Settings';
import Calendar from './pages/Calendar/Calendar';
import Navbar from '@/components/Navbar';
import './style.css';

type Page = "home" | "pomodoro" | "weekly-goal" | "focus" | "tools" | "settings" | "calendar";

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("home");
  const [focusTrigger, setFocusTrigger] = useState<"center_focus_strong" | "analytics">("analytics");

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
    }
  };

  const getActiveItem = () => {
    if (currentPage === "pomodoro") return "timer";
    if (currentPage === "weekly-goal") return "emoji_events";
    if (currentPage === "focus") return focusTrigger;
    if (currentPage === "tools") return "construction";
    if (currentPage === "settings") return "settings";
    if (currentPage === "calendar") return "calendar_today";
    return "center_focus_strong";
  };

  return (
    <div className="app-shell">
      <Navbar activeItem={getActiveItem()} onNavClick={handleNavClick} />
      {currentPage === "home" && <Home />}
      {currentPage === "pomodoro" && <Pomodoro />}
      {currentPage === "weekly-goal" && <WeeklyGoal />}
      {currentPage === "focus" && <FocusMode />}
      {currentPage === "tools" && <Tools />}
      {currentPage === "settings" && <Settings />}
      {currentPage === "calendar" && <Calendar />}
    </div>
  );
}

export default App;
