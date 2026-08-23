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
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const DEFAULT_GROUPS: TodoGroup[] = [
  { id: "1", name: "Personal", todos: [] },
];

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [showTodoListInHome, setShowTodoListInHome] = useState(true);
  const [todoGroups, setTodoGroups] = useState<TodoGroup[]>(DEFAULT_GROUPS);
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