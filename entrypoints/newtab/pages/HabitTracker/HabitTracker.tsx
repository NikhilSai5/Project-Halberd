"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSettings, type Habit } from '@/lib/SettingsContext';

const EMOJIS = ["📚", "💪", "🇯🇵", "🚫", "🧘", "🏃", "💧", "🥗", "🌙", "☀️", "🎯", "📝", "🎨", "🎵", "🌱", "✨"];

function getDateStr(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return date.toISOString().split("T")[0]!;
}

function getDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function getMonthDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export default function HabitTracker() {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabitDate } = useSettings();
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("📚");
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editHabitName, setEditHabitName] = useState("");
  const [editHabitEmoji, setEditHabitEmoji] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  const weeklyDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = -6; i <= 0; i++) {
      dates.push(getDateStr(i));
    }
    return dates;
  }, []);

  const monthlyDates = useMemo(() => {
    const dates: string[] = [];
    for (let i = -34; i <= 0; i++) {
      dates.push(getDateStr(i));
    }
    return dates;
  }, []);

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

  const toggleExpand = (id: string) => {
    setExpandedHabit(expandedHabit === id ? null : id);
  };

  const handleCreateHabit = () => {
    if (!newHabitName.trim()) return;
    const tracking: Record<string, "done" | "missed" | "upcoming"> = {};
    const today = new Date();
    for (let i = 34; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      tracking[date.toISOString().split("T")[0]!] = "upcoming";
    }

    addHabit({
      name: newHabitName.trim(),
      emoji: newHabitEmoji,
      tracking,
    });

    setNewHabitName("");
    setNewHabitEmoji("📚");
    setShowCreatePanel(false);
  };

  const handleCancelCreate = () => {
    setNewHabitName("");
    setNewHabitEmoji("📚");
    setShowCreatePanel(false);
  };

  const startEditHabit = (habit: Habit) => {
    setEditingHabit(habit.id);
    setEditHabitName(habit.name);
    setEditHabitEmoji(habit.emoji);
  };

  const handleEditHabit = () => {
    if (!editHabitName.trim() || !editingHabit) return;
    updateHabit(editingHabit, {
      name: editHabitName.trim(),
      emoji: editHabitEmoji,
    });
    setEditingHabit(null);
    setEditHabitName("");
    setEditHabitEmoji("");
  };

  const handleCancelEdit = () => {
    setEditingHabit(null);
    setEditHabitName("");
    setEditHabitEmoji("");
  };

  const handleDeleteHabit = (habitId: string) => {
    deleteHabit(habitId);
    if (expandedHabit === habitId) {
      setExpandedHabit(null);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewHabitName(e.target.value);
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewHabitEmoji(emoji);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleCreateHabit();
    } else if (e.key === "Escape") {
      handleCancelCreate();
    }
  };

  useEffect(() => {
    if (showCreatePanel) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [showCreatePanel]);

  useEffect(() => {
    if (editingHabit) {
      setTimeout(() => nameInputRef.current?.focus(), 100);
    }
  }, [editingHabit]);

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
          <div className="p-6 flex-1 overflow-y-auto max-h-[calc(100vh-200px)]">
            {!showCreatePanel ? (
              <>
                <div className="mb-4">
                  <span className="font-label-secondary text-label-secondary text-text-muted uppercase tracking-widest">THIS WEEK</span>
                </div>
                {habits.length === 0 ? (
                  <div className="text-center py-12 text-text-muted">
                    <span className="material-symbols-outlined text-4xl mb-2 block">track_changes</span>
                    <p className="body-copy">No habits yet. Click "Add habit" to create one.</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {habits.map((habit, index) => (
                      <div
                        key={habit.id}
                        className="group flex flex-col rounded-lg hover:bg-surface-container-low transition-colors duration-200 border border-transparent hover:border-border-subtle/50"
                      >
                        <div className="flex items-center justify-between p-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-2xl flex-shrink-0">{habit.emoji}</span>
                            <span className="font-body-main text-body-main text-text-primary font-medium truncate">
                              {habit.name}
                            </span>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex gap-2 mr-2" role="img" aria-label="Weekly progress">
                              {weeklyDates.map((dateStr, dayIndex) => {
                                const status = habit.tracking[dateStr] || "upcoming";
                                return (
                                  <button
                                    key={dateStr}
                                    onClick={() => toggleHabitDate(habit.id, dateStr)}
                                    className={getProgressClass(status) + " cursor-pointer hover:scale-110 transition-transform duration-150"}
                                    title={getDayLabel(dateStr)}
                                    aria-label={`${getDayLabel(dateStr)}: ${status}`}
                                  />
                                );
                              })}
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
                            expandedHabit === habit.id ? "block animate-slide-down" : "hidden"
                          }`}
                          role="region"
                          aria-label={`Monthly view for ${habit.name}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="font-caption-metadata text-caption-metadata text-text-muted tracking-widest uppercase">
                              This Month
                            </div>
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => startEditHabit(habit)}
                                className="text-text-secondary hover:text-primary transition-colors p-1.5 rounded-full hover:bg-surface-container"
                                aria-label="Edit habit"
                              >
                                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">edit</span>
                              </button>
                              <button
                                onClick={() => handleDeleteHabit(habit.id)}
                                className="text-text-secondary hover:text-error transition-colors p-1.5 rounded-full hover:bg-surface-container"
                                aria-label="Delete habit"
                              >
                                <span className="material-symbols-outlined text-[18px]" aria-hidden="true">delete</span>
                              </button>
                            </div>
                          </div>
                          {editingHabit === habit.id ? (
                            <div className="space-y-4 bg-surface-container-low rounded-xl border border-border-subtle p-4 animate-fade-in">
                              <div>
                                <label className="font-label-secondary text-label-secondary text-text-secondary block mb-2">Habit Name</label>
                                <input
                                  type="text"
                                  value={editHabitName}
                                  onChange={(e) => setEditHabitName(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      handleEditHabit();
                                    } else if (e.key === "Escape") {
                                      handleCancelEdit();
                                    }
                                  }}
                                  placeholder="e.g., Read 20 minutes"
                                  className="form-control w-full bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                                  autoFocus
                                />
                              </div>
                              <div>
                                <label className="font-label-secondary text-label-secondary text-text-secondary block mb-2">Emoji</label>
                                <div className="flex flex-wrap gap-2">
                                  {EMOJIS.map((emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => setEditHabitEmoji(emoji)}
                                      className={`w-10 h-10 rounded-full text-2xl flex items-center justify-center transition-all duration-200 ${
                                        editHabitEmoji === emoji
                                          ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-white scale-110 shadow-md"
                                          : "bg-surface-container-high hover:bg-surface-container border border-border-subtle"
                                      }`}
                                      aria-label={emoji}
                                      aria-pressed={editHabitEmoji === emoji}
                                    >
                                      {emoji}
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <div className="flex gap-3 pt-2">
                                <button
                                  onClick={handleCancelEdit}
                                  className="button-regular button-regular--outlined font-section-title text-section-title flex-1"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={handleEditHabit}
                                  disabled={!editHabitName.trim()}
                                  className="button-regular font-section-title text-section-title flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  Save
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-7 gap-1.5 w-max">
                              {monthlyDates.map((dateStr) => {
                                const status = habit.tracking[dateStr] || "upcoming";
                                return (
                                  <button
                                    key={dateStr}
                                    onClick={() => toggleHabitDate(habit.id, dateStr)}
                                    className={getProgressClass(status, "monthly") + " cursor-pointer hover:scale-110 transition-transform duration-150"}
                                    aria-label={`${getMonthDayLabel(dateStr)}: ${status}`}
                                    title={getMonthDayLabel(dateStr)}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                        {index < habits.length - 1 && (
                          <div className="h-px bg-border-subtle/50 mx-3" />
                        )}
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-6 pl-3">
                  <button
                    onClick={() => setShowCreatePanel(true)}
                    className="add-habit-btn flex items-center gap-2 text-text-primary hover:text-primary transition-colors font-body-main text-body-main group"
                    aria-label="Add new habit"
                  >
                    <span className="material-symbols-outlined text-[20px] group-hover:rotate-90 transition-transform duration-300 hover:bg-primary-container/30 rounded-full p-1" aria-hidden="true">
                      add
                    </span>
                    <span className="font-medium">Add habit</span>
                  </button>
                </div>
              </>
            ) : (
              <div className="animate-fade-in">
                <div className="mb-4">
                  <span className="font-label-secondary text-label-secondary text-text-muted uppercase tracking-widest">NEW HABIT</span>
                </div>
                <div className="space-y-4 bg-surface-container-low rounded-xl border border-border-subtle p-6">
                  <div>
                    <label className="font-label-secondary text-label-secondary text-text-secondary block mb-2">Habit Name</label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={newHabitName}
                      onChange={handleNameChange}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g., Read 20 minutes"
                      className="form-control w-full bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                      autoFocus
                    />
                  </div>
                  <div>
                    <label className="font-label-secondary text-label-secondary text-text-secondary block mb-2">Emoji</label>
                    <div className="flex flex-wrap gap-2">
                      {EMOJIS.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => handleEmojiSelect(emoji)}
                          className={`w-10 h-10 rounded-full text-2xl flex items-center justify-center transition-all duration-200 ${
                            newHabitEmoji === emoji
                              ? "ring-2 ring-primary ring-offset-2 ring-offset-surface-white scale-110 shadow-md"
                              : "bg-surface-container-high hover:bg-surface-container border border-border-subtle"
                          }`}
                          aria-label={emoji}
                          aria-pressed={newHabitEmoji === emoji}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleCancelCreate}
                      className="button-regular button-regular--outlined font-section-title text-section-title flex-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateHabit}
                      disabled={!newHabitName.trim()}
                      className="button-regular font-section-title text-section-title flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}