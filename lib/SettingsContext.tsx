"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import {
  getWallpapers,
  addWallpaperToDB,
  removeWallpaperFromDB,
  clearAllWallpapersFromDB,
  getWeeklyGoals,
  addWeeklyGoalToDB,
  removeWeeklyGoalFromDB,
  getSlideshowImages,
  setSlideshowImagesInDB,
  clearSlideshowImagesFromDB,
  getProductiveSessions,
  addProductiveSessionToDB,
  updateProductiveSessionInDB,
  removeProductiveSessionFromDB,
  clearProductiveSessionsFromDB,
} from '@/lib/db';
import {
  DEFAULT_AUTO_TRACKING_CONFIG,
  type AutoTrackingConfig,
  type ProductiveSession,
  type WeeklyGoal as SharedWeeklyGoal,
} from '@/lib/weeklyGoalTypes';

export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface TodoGroup {
  id: string;
  name: string;
  todos: TodoItem[];
}

export interface Habit {
  id: string;
  name: string;
  emoji: string;
  color: string;
  tracking: Record<string, "done" | "missed" | "upcoming">;
}

export interface WallpaperFile {
  id: string;
  name: string;
  preview: string;
}

export interface SlideshowSettings {
  enabled: boolean;
  interval: string;
  folderName: string | null;
  images: string[];
}

export type { AutoTrackingConfig, ProductiveSession } from '@/lib/weeklyGoalTypes';
export type WeeklyGoal = SharedWeeklyGoal;

interface SettingsContextType {
  showTodoListInHome: boolean;
  setShowTodoListInHome: (value: boolean) => void;
  showCompletedTasks: boolean;
  setShowCompletedTasks: (value: boolean) => void;
  todoGroups: TodoGroup[];
  setTodoGroups: (groups: TodoGroup[]) => void;
  addTodoGroup: (name?: string) => void;
  updateTodoGroupName: (groupId: string, name: string) => void;
  deleteTodoGroup: (groupId: string) => void;
  addTodoToGroup: (groupId: string, text?: string) => void;
  updateTodo: (groupId: string, todoId: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (groupId: string, todoId: string) => void;
  reorderTodos: (groupId: string, fromIndex: number, toIndex: number) => void;
  habits: Habit[];
  addHabit: (habit: Omit<Habit, "id">) => void;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  deleteHabit: (habitId: string) => void;
  toggleHabitDate: (habitId: string, date: string) => void;
  wallpapers: WallpaperFile[];
  setWallpapers: (wallpapers: WallpaperFile[]) => void;
  addWallpaper: (wallpaper: WallpaperFile) => void;
  removeWallpaper: (id: string) => void;
  clearAllWallpapers: () => void;
  activeWallpaper: string | null;
  setActiveWallpaper: (id: string | null) => void;
  wallpaperBlur: number;
  setWallpaperBlur: (value: number) => void;
  wallpaperDarkness: number;
  setWallpaperDarkness: (value: number) => void;
  slideshowSettings: SlideshowSettings;
  setSlideshowSettings: (settings: Partial<SlideshowSettings> | ((prev: SlideshowSettings) => SlideshowSettings)) => void;
  setSlideshowFolder: (folderName: string, images: { name: string; data: string }[]) => void;
  clearSlideshowFolder: () => void;
  slideshowIndex: number;
  setSlideshowIndex: (value: number | ((prev: number) => number)) => void;
  nextSlideshowImage: () => void;
  weeklyGoals: WeeklyGoal[];
  setWeeklyGoals: (goals: WeeklyGoal[]) => void;
  addWeeklyGoal: (goal: Omit<WeeklyGoal, "id">) => void;
  updateWeeklyGoal: (goalId: string, updates: Partial<WeeklyGoal>) => void;
  deleteWeeklyGoal: (goalId: string) => void;
  toggleWeeklyGoalComplete: (goalId: string) => void;
  productiveSessions: ProductiveSession[];
  refreshProductiveSessions: (weeklyGoalId?: string) => Promise<void>;
  addProductiveSession: (session: ProductiveSession) => Promise<void>;
  updateProductiveSession: (id: string, updates: Partial<Omit<ProductiveSession, "id">>) => Promise<void>;
  deleteProductiveSession: (id: string) => Promise<void>;
  clearProductiveSessions: (weeklyGoalId?: string) => Promise<void>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_GROUPS: TodoGroup[] = [
  { id: "1", name: "Personal", todos: [] },
];

function generateInitialTracking(daysBack: number): Record<string, "done" | "missed" | "upcoming"> {
  const tracking: Record<string, "done" | "missed" | "upcoming"> = {};
  const today = new Date();
  for (let i = daysBack - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0]!;
    const r = Math.random();
    tracking[dateStr] = r > 0.6 ? "done" : r > 0.3 ? "missed" : "upcoming";
  }
  return tracking;
}

const DEFAULT_HABITS: Habit[] = [
  {
    id: "1",
    name: "Read 20 minutes",
    emoji: "📚",
    color: "#94c7a4",
    tracking: generateInitialTracking(35),
  },
  {
    id: "2",
    name: "Morning workout",
    emoji: "💪",
    color: "#94c7a4",
    tracking: generateInitialTracking(35),
  },
  {
    id: "3",
    name: "Japanese practice",
    emoji: "🇯🇵",
    color: "#94c7a4",
    tracking: generateInitialTracking(35),
  },
  {
    id: "4",
    name: "No sugar",
    emoji: "🚫",
    color: "#94c7a4",
    tracking: generateInitialTracking(35),
  },
];

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [showTodoListInHome, setShowTodoListInHome] = useState(true);
  const [showCompletedTasks, setShowCompletedTasks] = useState(true);
  const [todoGroups, setTodoGroups] = useState<TodoGroup[]>(DEFAULT_GROUPS);
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [wallpapers, setWallpapers] = useState<WallpaperFile[]>([]);
  const [activeWallpaper, setActiveWallpaper] = useState<string | null>(null);
  const [wallpaperBlur, setWallpaperBlur] = useState(0);
  const [wallpaperDarkness, setWallpaperDarkness] = useState(0);
  const [slideshowSettings, setSlideshowSettingsState] = useState<SlideshowSettings>({
    enabled: false,
    interval: "30min",
    folderName: null,
    images: [],
  });
  const [weeklyGoals, setWeeklyGoals] = useState<WeeklyGoal[]>([]);
  const [productiveSessions, setProductiveSessions] = useState<ProductiveSession[]>([]);

  const setSlideshowSettings = (settings: Partial<SlideshowSettings> | ((prev: SlideshowSettings) => SlideshowSettings)) => {
    setSlideshowSettingsState(prev => 
      typeof settings === 'function' ? settings(prev) : { ...prev, ...settings }
    );
  };

  /*
   * Slideshow folder images are kept completely separate from the
   * normal wallpapers: they live in their own IndexedDB store and
   * only replace the whole folder at once.
   */
  const setSlideshowFolder = (folderName: string, images: { name: string; data: string }[]) => {
    setSlideshowSettingsState(prev => ({
      ...prev,
      folderName,
      images: images.map((image) => image.data),
    }));

    setSlideshowImagesInDB(
      images.map((image, index) => ({
        id: `${index}-${image.name}`,
        name: image.name,
        data: image.data,
      }))
    ).catch(() => {});
  };

  const clearSlideshowFolder = () => {
    setSlideshowSettingsState(prev => ({
      ...prev,
      folderName: null,
      images: [],
    }));

    clearSlideshowImagesFromDB().catch(() => {});
  };

  const [slideshowIndex, setSlideshowIndex] = useState(0);

  const nextSlideshowImage = () => {
    setSlideshowIndex(prev =>
      slideshowSettings.images.length > 0
        ? (prev + 1) % slideshowSettings.images.length
        : 0
    );
  };

  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storedShowTodo = localStorage.getItem("showTodoListInHome");
    if (storedShowTodo !== null) {
      setShowTodoListInHome(JSON.parse(storedShowTodo));
    }

    const storedShowCompleted = localStorage.getItem("showCompletedTasks");
    if (storedShowCompleted !== null) {
      try {
        setShowCompletedTasks(JSON.parse(storedShowCompleted));
      } catch {
        // ignore parse errors
      }
    }

    const storedGroups = localStorage.getItem("todoGroups");
    if (storedGroups !== null) {
      try {
        const parsed = JSON.parse(storedGroups);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setTodoGroups(parsed);
        }
      } catch {
        // ignore parse errors
      }
    }

    const storedHabits = localStorage.getItem("habits");
    if (storedHabits !== null) {
      try {
        const parsed = JSON.parse(storedHabits);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Migrate old habit format (weeklyProgress/monthlyData) to new format (tracking)
          const migrated = parsed.map((h: any) => {
            if (h.tracking) {
              // Already new format, ensure color exists
              if (!h.color) {
                return { ...h, color: "#94c7a4" };
              }
              return h;
            }
            const tracking: Record<string, "done" | "missed" | "upcoming"> = {};
            const today = new Date();
            // weeklyProgress: last 7 days
            if (Array.isArray(h.weeklyProgress)) {
              for (let i = 6; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split("T")[0]!;
                tracking[dateStr] = h.weeklyProgress[6 - i] || "upcoming";
              }
            }
            // monthlyData: last 35 days
            if (Array.isArray(h.monthlyData)) {
              for (let i = 34; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateStr = date.toISOString().split("T")[0]!;
                if (!tracking[dateStr]) {
                  tracking[dateStr] = h.monthlyData[34 - i] || "upcoming";
                }
              }
            }
            // Fill any missing dates with "upcoming"
            for (let i = 34; i >= 0; i--) {
              const date = new Date(today);
              date.setDate(date.getDate() - i);
              const dateStr = date.toISOString().split("T")[0]!;
              if (!tracking[dateStr]) tracking[dateStr] = "upcoming";
            }
            return { ...h, tracking, color: h.color || "#94c7a4" };
          });
          setHabits(migrated);
        }
      } catch {
        // ignore parse errors
      }
    }
    setInitialized(true);
  }, []);

useEffect(() => {
    const storedWallpapers = localStorage.getItem("wallpapers");
    if (storedWallpapers !== null) {
      try {
        const parsed = JSON.parse(storedWallpapers);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setWallpapers(parsed);
          // Migrate existing wallpapers to IndexedDB
          parsed.forEach((wp: WallpaperFile) => {
            addWallpaperToDB(wp).catch(() => {});
          });
        }
      } catch {
        // ignore parse errors
      }
    }
    const storedActiveWallpaper = localStorage.getItem("activeWallpaper");
    if (storedActiveWallpaper !== null) {
      try {
        setActiveWallpaper(JSON.parse(storedActiveWallpaper));
      } catch {
        setActiveWallpaper(storedActiveWallpaper);
      }
    }
    const storedWallpaperBlur = localStorage.getItem("wallpaperBlur");
    if (storedWallpaperBlur !== null) setWallpaperBlur(Number(storedWallpaperBlur) || 0);
    const storedWallpaperDarkness = localStorage.getItem("wallpaperDarkness");
    if (storedWallpaperDarkness !== null) setWallpaperDarkness(Number(storedWallpaperDarkness) || 0);
    
    const storedSlideshow = localStorage.getItem("slideshowSettings");
    if (storedSlideshow !== null) {
      try {
        const parsed = JSON.parse(storedSlideshow);
        if (parsed && typeof parsed === "object") {
          setSlideshowSettings(prev => ({ ...prev, ...parsed }));
        }
      } catch {
        // ignore parse errors
      }
    }
    
    // Load wallpapers from IndexedDB
    getWallpapers().then((wps) => {
      if (wps.length > 0) {
        setWallpapers(wps);
      }
    }).catch(() => {});

    // Load weekly goals from IndexedDB
    getWeeklyGoals().then((goals) => {
      if (goals.length > 0) {
        setWeeklyGoals(goals);
      }
    }).catch(() => {});

    // Load slideshow folder images from IndexedDB
    getSlideshowImages().then((images) => {
      if (images.length > 0) {
        setSlideshowSettingsState(prev => ({
          ...prev,
          images: images.map((image) => image.data),
        }));
      }
    }).catch(() => {});

    getProductiveSessions().then(setProductiveSessions).catch(() => {});

    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("showTodoListInHome", JSON.stringify(showTodoListInHome));
  }, [showTodoListInHome, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("showCompletedTasks", JSON.stringify(showCompletedTasks));
  }, [showCompletedTasks, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("todoGroups", JSON.stringify(todoGroups));
  }, [todoGroups, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("habits", JSON.stringify(habits));
  }, [habits, initialized]);

  useEffect(() => {
    if (!initialized) return;
    wallpapers.forEach((wp) => {
      addWallpaperToDB(wp).catch(() => {});
    });
  }, [wallpapers, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("activeWallpaper", JSON.stringify(activeWallpaper));
  }, [activeWallpaper, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("wallpaperBlur", String(wallpaperBlur));
  }, [wallpaperBlur, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("wallpaperDarkness", String(wallpaperDarkness));
  }, [wallpaperDarkness, initialized]);

  useEffect(() => {
    if (!initialized) return;
    /*
     * Image data lives in IndexedDB (too large for localStorage),
     * so only the lightweight settings are persisted here.
     */
    const persistedSlideshowSettings = {
      enabled: slideshowSettings.enabled,
      interval: slideshowSettings.interval,
      folderName: slideshowSettings.folderName,
    };
    localStorage.setItem("slideshowSettings", JSON.stringify(persistedSlideshowSettings));
  }, [slideshowSettings, initialized]);

  useEffect(() => {
    if (!initialized) return;
    weeklyGoals.forEach((goal) => {
      addWeeklyGoalToDB(goal).catch(() => {});
    });
  }, [weeklyGoals, initialized]);

  const addTodoGroup = (name?: string) => {
    const newGroup: TodoGroup = {
      id: `${Date.now()}`,
      name: name || `Group ${todoGroups.length + 1}`,
      todos: [],
    };
    setTodoGroups((prev) => [...prev, newGroup]);
  };

  const updateTodoGroupName = (groupId: string, name: string) => {
    setTodoGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name } : g))
    );
  };

  const deleteTodoGroup = (groupId: string) => {
    if (todoGroups.length <= 1) return;
    setTodoGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const addTodoToGroup = (groupId: string, text?: string) => {
    const newTodo: TodoItem = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      text: text || "",
      completed: false,
    };
    setTodoGroups((prev) =>
      prev.map((g) =>
        g.id === groupId ? { ...g, todos: [...g.todos, newTodo] } : g
      )
    );
  };

  const updateTodo = (groupId: string, todoId: string, updates: Partial<TodoItem>) => {
    setTodoGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? {
              ...g,
              todos: g.todos.map((t) =>
                t.id === todoId ? { ...t, ...updates } : t
              ),
            }
          : g
      )
    );
  };

  const deleteTodo = (groupId: string, todoId: string) => {
    setTodoGroups((prev) =>
      prev.map((g) =>
        g.id === groupId
          ? { ...g, todos: g.todos.filter((t) => t.id !== todoId) }
          : g
      )
    );
  };

  const reorderTodos = (groupId: string, fromIndex: number, toIndex: number) => {
    setTodoGroups((prev) =>
      prev.map((g) => {
        if (g.id !== groupId) return g;
        const todos = [...g.todos];
        const removed = todos.splice(fromIndex, 1)[0];
        if (!removed) return g;
        todos.splice(toIndex, 0, removed);
        return { ...g, todos };
      })
    );
  };

  const addHabit = (habit: Omit<Habit, "id">) => {
    const newHabit: Habit = {
      ...habit,
      color: habit.color || "#94c7a4",
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setHabits((prev) => [...prev, newHabit]);
  };

  const updateHabit = (habitId: string, updates: Partial<Habit>) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === habitId ? { ...h, ...updates } : h))
    );
  };

  const deleteHabit = (habitId: string) => {
    setHabits((prev) => prev.filter((h) => h.id !== habitId));
  };

  const toggleHabitDate = (habitId: string, date: string) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id !== habitId) return h;
        const current = h.tracking[date] || "upcoming";
        const next = current === "done" ? "missed" : current === "missed" ? "upcoming" : "done";
        return { ...h, tracking: { ...h.tracking, [date]: next } };
      })
    );
  };

  const addWallpaper = (wallpaper: WallpaperFile) => {
    setWallpapers((prev) => {
      if (prev.length === 0) {
        setActiveWallpaper(wallpaper.id);
      }
      return [...prev, wallpaper];
    });
    addWallpaperToDB(wallpaper).catch(() => {});
  };

  const removeWallpaper = (id: string) => {
    setWallpapers((prev) => prev.filter((w) => w.id !== id));
    if (activeWallpaper === id) {
      setActiveWallpaper(null);
    }
    removeWallpaperFromDB(id).catch(() => {});
  };

  const clearAllWallpapers = () => {
    setWallpapers([]);
    setActiveWallpaper(null);
    clearAllWallpapersFromDB().catch(() => {});
  };

  const addWeeklyGoal = (goal: Omit<WeeklyGoal, "id">) => {
    const newGoal: WeeklyGoal = {
      ...goal,
      autoTracking: goal.autoTracking ?? { ...DEFAULT_AUTO_TRACKING_CONFIG },
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setWeeklyGoals((prev) => [...prev, newGoal]);
    addWeeklyGoalToDB(newGoal).catch(() => {});
  };

  const updateWeeklyGoal = (goalId: string, updates: Partial<WeeklyGoal>) => {
    setWeeklyGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, ...updates } : g))
    );
  };

  const deleteWeeklyGoal = (goalId: string) => {
    setWeeklyGoals((prev) => prev.filter((g) => g.id !== goalId));
    removeWeeklyGoalFromDB(goalId).catch(() => {});
  };

  const toggleWeeklyGoalComplete = (goalId: string) => {
    setWeeklyGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, completed: !g.completed } : g))
    );
  };

  const refreshProductiveSessions = async (weeklyGoalId?: string) => {
    const sessions = await getProductiveSessions(weeklyGoalId ? { weeklyGoalId } : undefined);
    setProductiveSessions((current) => weeklyGoalId
      ? [...current.filter((session) => session.weeklyGoalId !== weeklyGoalId), ...sessions]
          .sort((a, b) => b.startTime - a.startTime)
      : sessions
    );
  };

  const addProductiveSession = async (session: ProductiveSession) => {
    await addProductiveSessionToDB(session);
    setProductiveSessions((prev) => [session, ...prev.filter((item) => item.id !== session.id)]);
  };

  const updateProductiveSession = async (
    id: string,
    updates: Partial<Omit<ProductiveSession, "id">>,
  ) => {
    await updateProductiveSessionInDB(id, updates);
    setProductiveSessions((prev) => prev.map((session) =>
      session.id === id ? { ...session, ...updates } : session
    ));
  };

  const deleteProductiveSession = async (id: string) => {
    await removeProductiveSessionFromDB(id);
    setProductiveSessions((prev) => prev.filter((session) => session.id !== id));
  };

  const clearProductiveSessions = async (weeklyGoalId?: string) => {
    await clearProductiveSessionsFromDB(weeklyGoalId);
    setProductiveSessions((prev) => weeklyGoalId
      ? prev.filter((session) => session.weeklyGoalId !== weeklyGoalId)
      : []
    );
  };

  return (
    <SettingsContext.Provider
      value={{
        showTodoListInHome,
        setShowTodoListInHome,
        showCompletedTasks,
        setShowCompletedTasks,
        todoGroups,
        setTodoGroups,
        addTodoGroup,
        updateTodoGroupName,
        deleteTodoGroup,
        addTodoToGroup,
        updateTodo,
        deleteTodo,
        reorderTodos,
        habits,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitDate,
        wallpapers,
        setWallpapers,
        addWallpaper,
        removeWallpaper,
        clearAllWallpapers,
        activeWallpaper,
        setActiveWallpaper,
        wallpaperBlur,
        setWallpaperBlur,
        wallpaperDarkness,
        setWallpaperDarkness,
        slideshowSettings,
        setSlideshowSettings,
        setSlideshowFolder,
        clearSlideshowFolder,
        slideshowIndex,
        setSlideshowIndex,
        nextSlideshowImage,
        weeklyGoals,
        setWeeklyGoals,
        addWeeklyGoal,
        updateWeeklyGoal,
        deleteWeeklyGoal,
         toggleWeeklyGoalComplete,
         productiveSessions,
         refreshProductiveSessions,
         addProductiveSession,
         updateProductiveSession,
         deleteProductiveSession,
         clearProductiveSessions,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return context;
}
