"use client";

import { useState } from "react";

interface Habit {
  id: number;
  name: string;
  weeklyProgress: ("done" | "missed" | "upcoming")[];
  streak: number;
  monthlyData: ("done" | "missed" | "upcoming")[];
}

const habits: Habit[] = [
  {
    id: 1,
    name: "Read 20 minutes",
    weeklyProgress: ["done", "done", "done", "done", "missed", "upcoming", "upcoming"],
    streak: 4,
    monthlyData: Array.from({ length: 35 }, (_, i) => {
      const r = Math.random();
      return r > 0.6 ? "done" : r > 0.3 ? "missed" : "upcoming";
    }),
  },
  {
    id: 2,
    name: "Morning workout",
    weeklyProgress: ["done", "missed", "done", "missed", "upcoming", "upcoming", "upcoming"],
    streak: 1,
    monthlyData: Array.from({ length: 35 }, (_, i) => {
      const r = Math.random();
      return r > 0.6 ? "done" : r > 0.3 ? "missed" : "upcoming";
    }),
  },
  {
    id: 3,
    name: "Japanese practice",
    weeklyProgress: ["done", "done", "done", "done", "upcoming", "upcoming", "upcoming"],
    streak: 12,
    monthlyData: Array.from({ length: 35 }, (_, i) => {
      const r = Math.random();
      return r > 0.6 ? "done" : r > 0.3 ? "missed" : "upcoming";
    }),
  },
  {
    id: 4,
    name: "No sugar",
    weeklyProgress: ["done", "done", "done", "missed", "upcoming", "upcoming", "upcoming"],
    streak: 0,
    monthlyData: Array.from({ length: 35 }, (_, i) => {
      const r = Math.random();
      return r > 0.6 ? "done" : r > 0.3 ? "missed" : "upcoming";
    }),
  },
];

export default function HabitTracker() {
  const [expandedHabit, setExpandedHabit] = useState<number | null>(null);

  const getDayLabel = (index: number) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return days[index];
  };

  const getProgressClass = (status: "done" | "missed" | "upcoming", size: "weekly" | "monthly" = "weekly") => {
    const base = size === "weekly" ? "w-3 h-3" : "w-2.5 h-2.5";
    switch (status) {
      case "done":
        return `${base} rounded-full bg-primary-container`;
      case "missed":
        return `${base} rounded-full border border-outline-variant bg-transparent`;
      case "upcoming":
        return `${base} rounded-full bg-surface-variant opacity-50`;
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedHabit(expandedHabit === id ? null : id);
  };

  return (
    <div className="page-shell page-shell--centered font-body-main text-text-primary antialiased selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      <main className="page-main page-main--raised flex-1 flex flex-col items-center justify-center z-10">
        <div className="workspace-surface workspace-narrow habit-tracker-panel w-full overflow-hidden flex flex-col">
          <header className="page-header border-b border-border-subtle bg-surface-secondary/50 px-6 py-3 flex justify-between items-center">
            <h1 className="font-section-title text-section-title text-text-primary uppercase tracking-wider">Habit Tracker</h1>
            <button
              type="button"
              aria-label="Close"
              className="icon-button text-text-muted hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container-low"
            >
              <span className="material-symbols-outlined text-[20px]" aria-hidden="true">close</span>
            </button>
          </header>
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="mb-4">
              <span className="font-label-secondary text-label-secondary text-text-muted uppercase tracking-widest">THIS WEEK</span>
            </div>
            <div className="space-y-1">
              {habits.map((habit, index) => (
                <div
                  key={habit.id}
                  className="group flex flex-col rounded-lg hover:bg-surface-container-low transition-colors duration-200 border border-transparent hover:border-border-subtle/50"
                >
                  <div className="flex items-center justify-between p-3">
                    <div className="flex-1 font-body-main text-body-main text-text-primary font-medium">
                      {habit.name}
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex gap-2 mr-2" role="img" aria-label="Weekly progress">
                        {habit.weeklyProgress.map((status, dayIndex) => (
                          <div
                            key={dayIndex}
                            className={getProgressClass(status)}
                            title={getDayLabel(dayIndex)}
                          />
                        ))}
                      </div>
                      <div className="font-label-secondary text-label-secondary text-text-secondary w-20 text-right shrink-0">
                        🔥 {habit.streak} day streak
                      </div>
                      <button
                        onClick={() => toggleExpand(habit.id)}
                        onKeyDown={(e) => {
                          if (e.key === "ArrowRight" && expandedHabit !== habit.id) {
                            e.preventDefault();
                            toggleExpand(habit.id);
                          } else if (e.key === "ArrowLeft" && expandedHabit === habit.id) {
                            e.preventDefault();
                            toggleExpand(habit.id);
                          }
                        }}
                        className={`text-text-muted hover:text-primary transition-transform duration-300 w-6 h-6 flex items-center justify-center rounded-full toggle-btn ${
                          expandedHabit === habit.id ? "rotate-90" : ""
                        }`}
                        aria-expanded={expandedHabit === habit.id}
                        aria-controls={`month-${habit.id}`}
                        tabIndex={0}
                      >
                        <span className="material-symbols-outlined text-[20px]" aria-hidden="true">chevron_right</span>
                      </button>
                    </div>
                  </div>
                  <div
                    id={`month-${habit.id}`}
                    className={`px-3 pb-4 pt-1 ${
                      expandedHabit === habit.id ? "block" : "hidden"
                    }`}
                    role="region"
                    aria-label={`Monthly view for ${habit.name}`}
                  >
                    <div className="font-caption-metadata text-caption-metadata text-text-muted mb-2 tracking-widest uppercase">
                      This Month
                    </div>
                    <div className="grid grid-cols-7 gap-1.5 w-max">
                      {habit.monthlyData.map((status, index) => (
                        <div key={index} className={getProgressClass(status, "monthly")} />
                      ))}
                    </div>
                  </div>
                  {index < habits.length - 1 && (
                    <div className="h-px bg-border-subtle/50 mx-3" />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-6 pl-3">
              <button
                type="button"
                disabled
                aria-label="Add habit unavailable"
                title="Adding habits is not available yet"
                className="control-unavailable flex items-center gap-2 text-text-muted hover:text-primary transition-colors font-body-main text-body-main group"
              >
                <span
                  className="material-symbols-outlined text-[18px] group-hover:bg-primary-container group-hover:text-primary rounded-full transition-all"
                  aria-hidden="true"
                >
                  add
                </span>
                <span>Add habit</span>
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}