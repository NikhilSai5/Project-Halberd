"use client";

import { useState } from "react";

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
    <div className="page-shell page-shell--centered text-text-primary font-body-main selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      {/* Main Workspace */}
      <main className="page-main page-main--narrow flex-1 flex flex-col justify-center">
        {/* Header */}
        <div className="mb-12 text-center">
          <div className="caption-copy text-text-muted uppercase tracking-widest mb-4">
            {getDayName()}
          </div>
          <h1 className="page-title text-text-primary">
            Good morning.
          </h1>
        </div>

        {/* Task List Card */}
        <div className="surface-card p-6 md:p-8">
          <div className="space-y-0">
            {tasks.map((task) => (
              <label
                key={task.id}
                className="list-row task-row cursor-pointer group"
              >
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    className="task-checkbox"
                    aria-label={task.text}
                    checked={taskStates[task.id] || false}
                    onChange={() => toggleTask(task.id)}
                  />
                  <span
                    className={`task-checkmark material-symbols-outlined absolute text-surface-white pointer-events-none transition-opacity ${
                      taskStates[task.id] ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    check
                  </span>
                </div>
                <div
                  className={`task-copy body-copy transition-colors ${
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
            <button
              type="button"
              disabled
              aria-label="Add task unavailable"
              title="Adding tasks is not available yet"
              className="button-regular add-task-button control-unavailable font-section-title text-section-title group"
            >
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
