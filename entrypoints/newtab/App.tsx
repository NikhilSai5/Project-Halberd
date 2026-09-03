"use client";

import { useState, useEffect } from "react";
import Home from './pages/Home/Home';
import Pomodoro from './pages/Pomodoro/Pomodoro';
import WeeklyGoal from './pages/WeeklyGoal/WeeklyGoal';
import FocusMode from './pages/FocusMode/FocusMode';
import Tools from './pages/Tools/Tools';
import Settings from './pages/Settings/Settings';
import Calendar from './pages/Calendar/Calendar';
import HabitTracker from './pages/HabitTracker/HabitTracker';
import Navbar from '@/components/Navbar';
import PageTransition from '@/components/PageTransition';
import FloatingCircle from '@/components/FloatingCircle';
import { SettingsProvider, useSettings } from '@/lib/SettingsContext';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import { AuthScreen, RegisterScreen } from './pages/Onboarding/Onboarding';
import Onboarding from './pages/Onboarding/Onboarding';
import { supabase } from '@/lib/supabase';
import { userStorageKey } from '@/lib/userStorage';
import defaultWallpaperFallback from '@/assets/default wallpapers/wallhaven-d6q21o.jpg';
import './style.css';

type Page = "home" | "pomodoro" | "weekly-goal" | "focus" | "tools" | "settings" | "calendar" | "habit-tracker";
type NavbarPosition = "bottom-center" | "left" | "right";

function getIntervalMs(interval: string): number {
  switch (interval) {
    case "15min": return 15 * 60 * 1000;
    case "30min": return 30 * 60 * 1000;
    case "1hr": return 60 * 60 * 1000;
    case "6hr": return 6 * 60 * 60 * 1000;
    case "12hr": return 12 * 60 * 60 * 1000;
    case "24hr": return 24 * 60 * 60 * 1000;
    default: return 30 * 60 * 1000;
  }
}

function AppContent() {
  const { user, loading } = useAuth();
  const [authView, setAuthView] = useState<"login" | "register">("login");
  const [onboarding, setOnboarding] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setOnboarding(null);
      return;
    }
    const completedKey = userStorageKey(user.id, "halberd_onboarding_complete");
    const pendingKey = userStorageKey(`registration:${user.email?.toLowerCase() ?? "unknown"}`, "halberd_pending_onboarding");
    if (localStorage.getItem(completedKey) === "true") {
      setOnboarding(false);
      return;
    }
    let cancelled = false;
    const checkOnboarding = async () => {
      if (supabase) {
        const { data } = await supabase
          .from("onboarding_preferences")
          .select("onboarding_completed")
          .eq("user_id", user.id)
          .maybeSingle();
        if (!cancelled && data?.onboarding_completed) {
          localStorage.setItem(completedKey, "true");
          setOnboarding(false);
          return;
        }
        // Any authenticated account without a completed record, including Google accounts,
        // goes through the same onboarding flow.
        if (!cancelled) setOnboarding(true);
        return;
      }
      if (!cancelled) setOnboarding(localStorage.getItem(pendingKey) === "true");
    };
    void checkOnboarding();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || (user && onboarding === null)) {
    return <div className="auth-loading"><span className="material-symbols-outlined">track_changes</span><span>Preparing your workspace...</span></div>;
  }
  if (!user) {
    return authView === "login"
      ? <AuthScreen onRegister={() => setAuthView("register")} />
      : <RegisterScreen onBack={() => setAuthView("login")} onContinue={() => setOnboarding(true)} />;
  }
  if (onboarding) return <Onboarding onComplete={() => setOnboarding(false)} />;
  return <AuthenticatedApp />;
}

function AuthenticatedApp() {
  const {
    showTodoListInHome,
    wallpapers,
    activeWallpaper,
    wallpaperBlur,
    wallpaperDarkness,
    slideshowSettings,
    slideshowIndex,
    setSlideshowIndex,
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

  const renderPage = (page: Page) => {
    switch (page) {
      case "home":
        return <Home showTodoList={showTodoListInHome} />;
      case "pomodoro":
        return <Pomodoro />;
      case "weekly-goal":
        return <WeeklyGoal />;
      case "focus":
        return <FocusMode />;
      case "tools":
        return <Tools />;
      case "settings":
        return <Settings />;
      case "calendar":
        return <Calendar />;
      case "habit-tracker":
        return <HabitTracker />;
    }
  };

  // Slideshow effect: cycle through images when enabled
  useEffect(() => {
    if (!slideshowSettings.enabled || slideshowSettings.images.length === 0) {
      setSlideshowIndex(0);
      return;
    }

    const intervalMs = getIntervalMs(slideshowSettings.interval);
    const timer = setInterval(() => {
      setSlideshowIndex(prev => (prev + 1) % slideshowSettings.images.length);
    }, intervalMs);

    return () => clearInterval(timer);
  }, [slideshowSettings.enabled, slideshowSettings.interval, slideshowSettings.images.length]);

  // Determine current background image
  let backgroundImage: string | null = defaultWallpaperFallback;
  if (slideshowSettings.enabled && slideshowSettings.images.length > 0) {
    backgroundImage = slideshowSettings.images[slideshowIndex] ?? null;
  } else {
    const selectedWallpaper = wallpapers.find((wallpaper) => wallpaper.id === activeWallpaper);
    if (selectedWallpaper) {
      backgroundImage = selectedWallpaper.preview;
    }
  }

  const backgroundStyle = backgroundImage ? {
    backgroundImage: `url("${backgroundImage}")`,
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
        <PageTransition
          pageKey={currentPage}
          renderPage={renderPage}
          animateExitFor={(key) => key === "home"}
          animateEnterFor={(key) => key !== "home"}
        />
        <FloatingCircle />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AppContent />
      </SettingsProvider>
    </AuthProvider>
  );
}
