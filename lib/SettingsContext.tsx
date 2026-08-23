"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";

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
  tracking: Record<string, "done" | "missed" | "upcoming">;
}

interface SettingsContextType {
  showTodoListInHome: boolean;
  setShowTodoListInHome: (value: boolean) => void;
  todoGroups: TodoGroup[];
  setTodoGroups: (groups: TodoGroup[]) => void;
  addTodoGroup: (name?: string) => void;
  updateTodoGroupName: (groupId: string, name: string) => void;
  deleteTodoGroup: (groupId: string) => void;
  addTodoToGroup: (groupId: string, text?: string) => void;
  updateTodo: (groupId: string, todoId: string, updates: Partial<TodoItem>) => void;
  deleteTodo: (groupId: string, todoId: string) => void;
  habits: Habit[];
  addHabit: (habit: Omit<Habit, "id">) => void;
  updateHabit: (habitId: string, updates: Partial<Habit>) => void;
  deleteHabit: (habitId: string) => void;
  toggleHabitDate: (habitId: string, date: string) => void;
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
    tracking: generateInitialTracking(35),
  },
  {
    id: "2",
    name: "Morning workout",
    emoji: "💪",
    tracking: generateInitialTracking(35),
  },
  {
    id: "3",
    name: "Japanese practice",
    emoji: "🇯🇵",
    tracking: generateInitialTracking(35),
  },
  {
    id: "4",
    name: "No sugar",
    emoji: "🚫",
    tracking: generateInitialTracking(35),
  },
];

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [showTodoListInHome, setShowTodoListInHome] = useState(true);
  const [todoGroups, setTodoGroups] = useState<TodoGroup[]>(DEFAULT_GROUPS);
  const [habits, setHabits] = useState<Habit[]>(DEFAULT_HABITS);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storedShowTodo = localStorage.getItem("showTodoListInHome");
    if (storedShowTodo !== null) {
      setShowTodoListInHome(JSON.parse(storedShowTodo));
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
            if (h.tracking) return h; // already new format
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
            return { ...h, tracking };
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
    if (!initialized) return;
    localStorage.setItem("showTodoListInHome", JSON.stringify(showTodoListInHome));
  }, [showTodoListInHome, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("todoGroups", JSON.stringify(todoGroups));
  }, [todoGroups, initialized]);

  useEffect(() => {
    if (!initialized) return;
    localStorage.setItem("habits", JSON.stringify(habits));
  }, [habits, initialized]);

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

  const addHabit = (habit: Omit<Habit, "id">) => {
    const newHabit: Habit = {
      ...habit,
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

  return (
    <SettingsContext.Provider
      value={{
        showTodoListInHome,
        setShowTodoListInHome,
        todoGroups,
        setTodoGroups,
        addTodoGroup,
        updateTodoGroupName,
        deleteTodoGroup,
        addTodoToGroup,
        updateTodo,
        deleteTodo,
        habits,
        addHabit,
        updateHabit,
        deleteHabit,
        toggleHabitDate,
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