"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { useSettings, type Habit } from '@/lib/SettingsContext';
import AnimatedEmoji from '@/components/AnimatedEmoji';
import EmojiPicker, { SkinTonePickerLocation } from 'emoji-picker-react';
import type { EmojiClickData } from 'emoji-picker-react';

export const EMOJIS = [
  "📚", "💪", "🔥", "⚡", "💧", "🎯", "🏆", "✨",
  "🌱", "🥗", "🍎", "☕", "🧠", "⏰", "🚀", "✍️",
  "🎵", "☀️", "🌙", "👟", "🚫", "🎉"
];

export const HABIT_COLORS = [
  "#94c7a4", "#6bb3d6", "#d6a66b", "#d66b6b", "#b36bd6", "#6bd6b3",
  "#d68b6b", "#6bd68b", "#8b6bd6", "#d66bd6", "#6bd6d6", "#d6d66b"
];

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

function getStreakCount(tracking: Record<string, "done" | "missed" | "upcoming">): number {
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split("T")[0]!;
    const status = tracking[dateStr];
    if (status === "done") {
      streak++;
    } else if (status === "missed" || status === "upcoming") {
      break;
    }
  }
  return streak;
}

export const EmojiPickerPanel = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (emoji: string) => void;
}) => (
  <div>
    <div className="flex flex-wrap gap-2">
      {EMOJIS.map((emoji) => (
        <button
          key={emoji}
          type="button"
          onClick={() => onSelect(emoji)}
          className={`w-10 h-10 rounded-full text-2xl flex items-center justify-center transition-all duration-200 ${
            selected === emoji
              ? "ring-2 ring-[#94c7a4] ring-offset-2 ring-offset-white scale-110 shadow-md"
              : "bg-white hover:bg-[#f5f5f5] border border-[#e5e5e5]"
          }`}
          aria-label={emoji}
          aria-pressed={selected === emoji}
        >
          <AnimatedEmoji emoji={emoji} size={22} />
        </button>
      ))}
    </div>
    <div className="mt-3 pt-3 border-t border-[#e5e5e5]">
      <p className="mb-2 text-[11px] font-medium text-[#999]" style={{ letterSpacing: '0.5px' }}>OR PICK ANY EMOJI</p>
      <div style={{ maxWidth: '350px' }}>
        <EmojiPicker
          onEmojiClick={(data: EmojiClickData) => onSelect(data.emoji)}
          theme={"light" as any}
          width="100%"
          height={350}
          lazyLoadEmojis
          skinTonePickerLocation={SkinTonePickerLocation.SEARCH}
        />
      </div>
    </div>
  </div>
);

export const ColorPicker = ({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (color: string) => void;
}) => (
  <div className="flex flex-wrap gap-2">
    {HABIT_COLORS.map((color) => (
      <button
        key={color}
        type="button"
        onClick={() => onSelect(color)}
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
          selected === color
            ? "ring-2 ring-[#94c7a4] ring-offset-2 ring-offset-white scale-110 shadow-md"
            : "border-2 border-transparent hover:border-[#ccc]"
        }`}
        aria-label={color}
        aria-pressed={selected === color}
        style={{ backgroundColor: color }}
      >
        {selected === color && (
          <span
            className="material-symbols-outlined text-white text-[18px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            check
          </span>
        )}
      </button>
    ))}
  </div>
);

export default function HabitTracker() {
  const { habits, addHabit, updateHabit, deleteHabit, toggleHabitDate } = useSettings();
  const [expandedHabit, setExpandedHabit] = useState<string | null>(null);
  const [closingHabit, setClosingHabit] = useState<string | null>(null);
  const [showCreatePanel, setShowCreatePanel] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitEmoji, setNewHabitEmoji] = useState("📚");
  const [newHabitColor, setNewHabitColor] = useState("#94c7a4");
  const [editingHabit, setEditingHabit] = useState<string | null>(null);
  const [editHabitName, setEditHabitName] = useState("");
  const [editHabitEmoji, setEditHabitEmoji] = useState("");
  const [editHabitColor, setEditHabitColor] = useState("#94c7a4");
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

  const toggleExpand = (id: string) => {
    if (expandedHabit === id) {
      setClosingHabit(id);
      setExpandedHabit(null);
    } else {
      setClosingHabit(null);
      setExpandedHabit(id);
    }
  };

  const handleClosingAnimationEnd = (habitId: string) => {
    setClosingHabit((prev) => (prev === habitId ? null : prev));
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
      color: newHabitColor,
      tracking,
    });

    setNewHabitName("");
    setNewHabitEmoji("📚");
    setNewHabitColor("#94c7a4");
    setShowCreatePanel(false);
  };

  const handleCancelCreate = () => {
    setNewHabitName("");
    setNewHabitEmoji("📚");
    setNewHabitColor("#94c7a4");
    setShowCreatePanel(false);
  };

  const startEditHabit = (habit: Habit) => {
    setEditingHabit(habit.id);
    setEditHabitName(habit.name);
    setEditHabitEmoji(habit.emoji);
    setEditHabitColor(habit.color || "#94c7a4");
  };

  const handleEditHabit = () => {
    if (!editHabitName.trim() || !editingHabit) return;
    updateHabit(editingHabit, {
      name: editHabitName.trim(),
      emoji: editHabitEmoji,
      color: editHabitColor,
    });
    setEditingHabit(null);
    setEditHabitName("");
    setEditHabitEmoji("");
    setEditHabitColor("#94c7a4");
  };

  const handleCancelEdit = () => {
    setEditingHabit(null);
    setEditHabitName("");
    setEditHabitEmoji("");
    setEditHabitColor("#94c7a4");
  };

  const handleDeleteHabit = (habitId: string) => {
    deleteHabit(habitId);
    if (expandedHabit === habitId) {
      setExpandedHabit(null);
    }
    if (closingHabit === habitId) {
      setClosingHabit(null);
    }
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

  const dayLabels = ["M", "T", "W", "T", "F", "S", "S"];

  const renderHabitForm = (
    habitId: string | null,
    name: string,
    setName: (v: string) => void,
    emoji: string,
    setEmoji: (v: string) => void,
    color: string,
    setColor: (v: string) => void,
    onSave: () => void,
    onCancel: () => void,
    saveLabel: string
  ) => (
    <div className="space-y-4 bg-white rounded-xl border border-[#e5e5e5] p-4 animate-fade-in" style={{ borderRadius: '12px', borderColor: '#e5e5e5' }}>
      <div>
        <label className="block mb-2 text-[13px] font-medium text-[#555]" style={{ letterSpacing: '0.5px' }}>Habit Name</label>
        <input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); onSave(); }
            else if (e.key === "Escape") { e.preventDefault(); onCancel(); }
          }}
          placeholder="e.g., Read 20 minutes"
          className="w-full bg-transparent border border-[#e5e5e5] rounded-lg px-3 py-2 text-[14px] text-[#262626] focus:outline-none focus:ring-1 focus:ring-[#94c7a4] focus:border-[#94c7a4]"
          autoFocus
        />
      </div>
      <div>
        <label className="block mb-2 text-[13px] font-medium text-[#555]" style={{ letterSpacing: '0.5px' }}>Emoji</label>
        <EmojiPickerPanel selected={emoji} onSelect={setEmoji} />
      </div>
      <div>
        <label className="block mb-2 text-[13px] font-medium text-[#555]" style={{ letterSpacing: '0.5px' }}>Color</label>
        <ColorPicker selected={color} onSelect={setColor} />
      </div>
      <div className="flex gap-3 pt-2">
        <button onClick={onCancel} className="flex-1 px-4 py-2.5 rounded-lg text-[14px] font-medium border border-[#e5e5e5] text-[#262626] hover:bg-[#f5f5f5] transition-colors">Cancel</button>
        <button onClick={onSave} disabled={!name.trim()} className="flex-1 px-4 py-2.5 rounded-lg text-[14px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors" style={{ backgroundColor: '#94c7a4' }}>{saveLabel}</button>
      </div>
    </div>
  );

  return (
    <div className="page-shell page-shell--centered font-body-main text-text-primary antialiased selection:bg-primary-container selection:text-on-primary-container relative overflow-hidden">
      <main className="page-main page-main--raised flex-1 flex flex-col items-center justify-center z-10">
        <div
          className="w-full overflow-y-auto scrollbar-hide flex flex-col"
          style={{ maxWidth: '515px', maxHeight: 'calc(100vh - 204px)', background: '#ffffff', borderRadius: '12px', boxShadow: '0 12px 35px rgba(0, 0, 0, 0.18)' }}
        >
          {/* Header */}
          <header className="flex items-center justify-between px-6 py-3 border-b border-[#e5e5e5]" style={{ height: '58px' }}>
            <h1 style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '1px', margin: 0, color: '#262626' }}>HABIT TRACKER</h1>
            <button type="button" aria-label="Close" style={{ border: 'none', background: 'transparent', color: '#333', fontSize: '24px', lineHeight: 1, cursor: 'pointer', padding: '2px', fontWeight: 300 }}>×</button>
          </header>

          {/* Content */}
          <div style={{ padding: '21px 25px 17px' }}>
            {editingHabit ? (
              /* Edit habit panel */
              <div className="animate-fade-in">
                <p style={{ fontSize: '13px', color: '#858585', fontWeight: 500, letterSpacing: '1px', margin: '0 0 17px' }}>EDIT HABIT</p>
                {renderHabitForm(
                  editingHabit,
                  editHabitName,
                  setEditHabitName,
                  editHabitEmoji,
                  setEditHabitEmoji,
                  editHabitColor,
                  setEditHabitColor,
                  handleEditHabit,
                  handleCancelEdit,
                  "Save"
                )}
              </div>
            ) : !showCreatePanel ? (
              <>
                <p style={{ fontSize: '13px', color: '#858585', fontWeight: 500, letterSpacing: '1px', margin: '0 0 17px' }}>THIS WEEK</p>

                {/* Day labels */}
                <div className="grid items-center" style={{ gridTemplateColumns: '1fr 184px 18px', marginBottom: '4px' }}>
                  <div />
                  <div className="grid grid-cols-7 text-center" style={{ color: '#777', fontSize: '12px', fontWeight: 500 }}>
                    {dayLabels.map((day, i) => <span key={i}>{day}</span>)}
                  </div>
                  <div />
                </div>

                {habits.length === 0 ? (
                  <div className="text-center py-12" style={{ color: '#858585' }}>
                    <p style={{ fontSize: '14px' }}>No habits yet. Click &quot;Add habit&quot; to create one.</p>
                  </div>
                ) : (
                  <div>
                    {habits.map((habit) => {
                      const isExpanded = expandedHabit === habit.id;
                      const isClosing = closingHabit === habit.id;
                      return (
                        <div key={habit.id} className="relative" style={{ borderBottom: '1px solid #e5e5e5' }}>
                          {/* Habit row */}
                          <div className="flex items-center" style={{ minHeight: '72px' }}>
                            {/* Icon + Name */}
                            <div className="flex items-center gap-4 flex-1 min-w-0" style={{ gap: '16px' }}>
                              <div className="flex-shrink-0 flex items-center justify-center overflow-hidden" style={{ width: '46px', height: '46px', border: '1px solid #d8d8d8', borderRadius: '9px', fontSize: '23px', color: '#292929', backgroundColor: '#fafafa' }}>
                                <AnimatedEmoji emoji={habit.emoji} size={25} />
                              </div>
                              <div className="min-w-0">
                                <p className="truncate" style={{ fontSize: '14px', fontWeight: 500, color: '#292929', margin: '0 0 5px' }}>{habit.name}</p>
                                <p style={{ fontSize: '13px', color: '#555', margin: 0 }}>{getStreakCount(habit.tracking)} day streak</p>
                              </div>
                            </div>

                            {/* Weekly dots - right aligned */}
                            <div className="flex items-center justify-end flex-shrink-0" style={{ width: '184px' }}>
                              <div className="grid grid-cols-7 items-center justify-items-center" style={{ gap: '12px' }}>
                                {weeklyDates.map((dateStr) => {
                                  const status = habit.tracking[dateStr] || "upcoming";
                                  const habitColor = habit.color || "#94c7a4";
                                  return (
                                    <button
                                      key={dateStr}
                                      onClick={() => toggleHabitDate(habit.id, dateStr)}
                                      className="cursor-pointer transition-transform duration-150 hover:scale-110"
                                      style={{
                                        width: '14px',
                                        height: '14px',
                                        borderRadius: '50%',
                                        border: '1.4px solid',
                                        borderColor: status === "done" ? habitColor : '#aeb3b0',
                                        backgroundColor: status === "done" ? habitColor : 'transparent',
                                      }}
                                      title={getDayLabel(dateStr)}
                                      aria-label={`${getDayLabel(dateStr)}: ${status}`}
                                    />
                                  );
                                })}
                              </div>
                            </div>

                            {/* Chevron */}
                            <button
                              onClick={() => toggleExpand(habit.id)}
                              onKeyDown={(e) => {
                                if (e.key === "ArrowRight" && !isExpanded) { e.preventDefault(); toggleExpand(habit.id); }
                                else if (e.key === "ArrowLeft" && isExpanded) { e.preventDefault(); toggleExpand(habit.id); }
                              }}
                              className="flex items-center justify-center w-6 h-6 rounded-full transition-all duration-300 ease-out"
                              style={{
                                fontSize: '22px',
                                fontWeight: 300,
                                color: '#292929',
                                transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)',
                              }}
                              aria-expanded={isExpanded}
                              tabIndex={0}
                            >
                              ›
                            </button>
                          </div>

                          {/* Expanded monthly dropdown - appears under this habit */}
                          {(isExpanded || isClosing) && (
                            <div
                              className={`${isClosing ? 'animate-slide-up' : 'animate-slide-down'} z-10`}
                              style={{ marginTop: '8px', marginBottom: '4px', overflow: 'scroll', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                              onAnimationEnd={() => handleClosingAnimationEnd(habit.id)}
                              role="region"
                              aria-label={`Monthly view for ${habit.name}`}
                            >
                              <div className="rounded-xl border border-[#e5e5e5] bg-white" style={{ borderRadius: '12px', padding: '14px 16px' }}>
                                <div className="flex items-center justify-between mb-3">
                                  <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '1.5px', color: '#999' }}>THIS MONTH</span>
                                  <div className="flex items-center gap-0.5">
                                    <button onClick={() => startEditHabit(habit)} className="p-1 rounded-md hover:bg-[#f0f0f0] transition-colors" aria-label="Edit habit">
                                      <span className="material-symbols-outlined text-[16px] text-[#999]" aria-hidden="true">edit</span>
                                    </button>
                                    <button onClick={() => handleDeleteHabit(habit.id)} className="p-1 rounded-md hover:bg-[#f0f0f0] transition-colors" aria-label="Delete habit">
                                      <span className="material-symbols-outlined text-[16px] text-[#999]" aria-hidden="true">delete</span>
                                    </button>
                                  </div>
                                </div>

                                <div>
                                    <div className="grid gap-x-[6px] gap-y-[5px] w-max" style={{ gridTemplateColumns: 'repeat(7, 16px)' }}>
                                      {["S","M","T","W","T","F","S"].map((d, i) => (
                                        <div key={i} className="flex items-center justify-center" style={{ fontSize: '9px', fontWeight: 600, color: '#bbb', letterSpacing: '0.5px' }}>
                                          {d}
                                        </div>
                                      ))}
                                      {monthlyDates.map((dateStr) => {
                                        const status = habit.tracking[dateStr] || "upcoming";
                                        const habitColor = habit.color || "#94c7a4";
                                        return (
                                          <button
                                            key={dateStr}
                                            onClick={() => toggleHabitDate(habit.id, dateStr)}
                                            className="cursor-pointer hover:scale-125 transition-transform duration-150"
                                            style={{
                                              width: '16px',
                                              height: '16px',
                                              borderRadius: '50%',
                                              border: status === "done" ? `2px solid ${habitColor}` : status === "missed" ? '2px solid #d8d8d8' : '2px solid #eaeaea',
                                              backgroundColor: status === "done" ? habitColor : status === "missed" ? '#f0f0f0' : 'transparent',
                                            }}
                                            aria-label={`${getMonthDayLabel(dateStr)}: ${status}`}
                                            title={`${getMonthDayLabel(dateStr)}: ${status}`}
                                          />
                                        );
                                      })}
                                    </div>
                                    {/* Legend */}
                                    <div className="flex items-center gap-3 mt-3 pt-2.5 border-t border-[#f0f0f0]">
                                      <div className="flex items-center gap-1.5">
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: `2px solid ${habit.color || "#94c7a4"}`, backgroundColor: habit.color || "#94c7a4" }} />
                                        <span style={{ fontSize: '10px', color: '#999' }}>Done</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #d8d8d8', backgroundColor: '#f0f0f0' }} />
                                        <span style={{ fontSize: '10px', color: '#999' }}>Missed</span>
                                      </div>
                                      <div className="flex items-center gap-1.5">
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', border: '2px solid #eaeaea', backgroundColor: 'transparent' }} />
                                        <span style={{ fontSize: '10px', color: '#999' }}>Upcoming</span>
                                      </div>
                                    </div>
                                  </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Add habit button */}
                <div style={{ marginTop: '14px', paddingLeft: '12px' }}>
                  <button
                    onClick={() => setShowCreatePanel(true)}
                    className="flex items-center gap-3 transition-colors duration-150 cursor-pointer group rounded-lg"
                    style={{ height: '50px', paddingInline: '12px', fontSize: '14px', color: '#292929' }}
                    onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f0f0')}
                    onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                    aria-label="Add new habit"
                  >
                    <span className="transition-transform duration-200 group-hover:rotate-90 group-hover:scale-110" style={{ fontSize: '27px', fontWeight: 300, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px' }}>+</span>
                    <span style={{ fontWeight: 500 }}>Add habit</span>
                  </button>
                </div>
              </>
            ) : (
              /* Create new habit form */
              <div className="animate-fade-in">
                <p style={{ fontSize: '13px', color: '#858585', fontWeight: 500, letterSpacing: '1px', margin: '0 0 17px' }}>NEW HABIT</p>
                <div className="rounded-xl border border-[#e5e5e5] p-6" style={{ background: '#fafafa' }}>
                  <div style={{ marginBottom: '16px' }}>
                    <label className="block mb-2 text-[13px] font-medium text-[#555]" style={{ letterSpacing: '0.5px' }}>Habit Name</label>
                    <input
                      ref={nameInputRef}
                      type="text"
                      value={newHabitName}
                      onChange={(e) => setNewHabitName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder="e.g., Read 20 minutes"
                      className="w-full bg-transparent border border-[#e5e5e5] rounded-lg px-3 py-2 text-[14px] text-[#262626] focus:outline-none focus:ring-1 focus:ring-[#94c7a4] focus:border-[#94c7a4]"
                      autoFocus
                    />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label className="block mb-2 text-[13px] font-medium text-[#555]" style={{ letterSpacing: '0.5px' }}>Emoji</label>
                    <EmojiPickerPanel selected={newHabitEmoji} onSelect={setNewHabitEmoji} />
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <label className="block mb-2 text-[13px] font-medium text-[#555]" style={{ letterSpacing: '0.5px' }}>Color</label>
                    <ColorPicker selected={newHabitColor} onSelect={setNewHabitColor} />
                  </div>
                  <div className="flex gap-3" style={{ paddingTop: '16px' }}>
                    <button onClick={handleCancelCreate} className="flex-1 px-4 py-2.5 rounded-lg text-[14px] font-medium border border-[#e5e5e5] text-[#262626] hover:bg-[#f5f5f5] transition-colors">Cancel</button>
                    <button onClick={handleCreateHabit} disabled={!newHabitName.trim()} className="flex-1 px-4 py-2.5 rounded-lg text-[14px] font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors" style={{ backgroundColor: '#94c7a4' }}>Create</button>
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
