"use client";

import { useState, useEffect } from "react";

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

const tasks: Task[] = [
  { id: 1, text: "Finish project documentation", completed: false },
  { id: 2, text: "Study Japanese", completed: false },
  { id: 3, text: "Build Halberd", completed: false },
  { id: 4, text: "Read documentation", completed: false },
];

export default function Home() {
  const [taskStates, setTaskStates] = useState<Record<number, boolean>>({});

  const toggleTask = (id: number) => {
    setTaskStates(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const getDayName = () => {
    const days = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
    const months = ["JANUARY", "FEBRUARY", "MARCH", "APRIL", "MAY", "JUNE", "JULY", "AUGUST", "SEPTEMBER", "OCTOBER", "NOVEMBER", "DECEMBER"];
    const now = new Date();
    return `${days[now.getDay()]} · ${months[now.getMonth()]} ${now.getDate()}`;
  };

  return (
    <div className="min-h-screen text-text-primary font-body-main selection:bg-primary-container selection:text-on-primary-container relative pb-32">
      {/* Main Workspace */}
      <main className="max-w-[720px] mx-auto px-4 md:px-0 mt-16 md:mt-24">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="font-caption-metadata text-caption-metadata text-text-muted uppercase tracking-widest mb-4">
            {getDayName()}
          </div>
          <h1 className="font-headline-page text-headline-page text-text-primary">
            Good morning.
          </h1>
        </div>

        {/* Task List Card */}
        <div className="bg-surface-white rounded-xl border border-border-subtle p-6 md:p-8 glass-panel">
          <div className="space-y-0">
            {tasks.map((task) => (
              <label
                key={task.id}
                className="flex items-center gap-4 py-3 border-b border-border-subtle cursor-pointer group hover:bg-surface-secondary transition-colors -mx-6 px-6 md:-mx-8 md:px-8"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="task-checkbox appearance-none w-5 h-5 border border-outline rounded-full checked:bg-primary checked:border-primary transition-colors cursor-pointer focus:ring-0 focus:ring-offset-0"
                    checked={taskStates[task.id] || false}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span
                    className={`material-symbols-outlined absolute text-[14px] text-surface-white pointer-events-none transition-opacity ${
                      taskStates[task.id] ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                </div>
                <div
                  className={`font-body-main text-body-main transition-colors ${
                    taskStates[task.id] ? "text-text-muted line-through" : "text-text-primary group-hover:text-primary"
                  }`}
                >
                  {task.text}
                </div>
              </label>
            ))}
          </div>

          {/* Add Task Button */}
          <div className="pt-6">
            <button className="flex items-center gap-2 text-primary font-section-title text-section-title hover:bg-primary-container/30 px-3 py-2 -ml-3 rounded-lg transition-colors group">
              <span className="material-symbols-outlined text-[18px] group-hover:rotate-90 transition-transform duration-300" style={{ fontVariationSettings: "'FILL' 1" }}>
                add
              </span>
              Add task
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}