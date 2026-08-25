"use client";

import { useState, useEffect, useMemo, useRef } from "react";

type ViewMode = "day" | "week" | "month";

interface CalendarEvent {
  id: number;
  title: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  variant: EventVariant;
  icon?: string;
  /** 0=Sun, 1=Mon, ... 6=Sat — used for week/month views */
  dayOfWeek?: number;
  /** 1-based day of month — used for month view */
  dayOfMonth?: number;
}

type EventVariant = "standard" | "review" | "break" | "deepWork";

const events: CalendarEvent[] = [
  { id: 1, title: "Team Standup", startHour: 9, startMinute: 0, endHour: 9, endMinute: 30, variant: "standard", dayOfWeek: 1, dayOfMonth: 25 },
  { id: 2, title: "Design Review", startHour: 10, startMinute: 30, endHour: 11, endMinute: 30, variant: "review", dayOfWeek: 1, dayOfMonth: 25 },
  { id: 3, title: "Lunch Break", startHour: 12, startMinute: 0, endHour: 13, endMinute: 0, variant: "break", icon: "restaurant", dayOfWeek: 1, dayOfMonth: 25 },
  { id: 4, title: "Deep Work", startHour: 14, startMinute: 0, endHour: 15, endMinute: 30, variant: "deepWork", icon: "psychology", dayOfWeek: 1, dayOfMonth: 25 },
  { id: 5, title: "Sprint Planning", startHour: 9, startMinute: 0, endHour: 10, endMinute: 0, variant: "review", dayOfWeek: 2, dayOfMonth: 26 },
  { id: 6, title: "Code Review", startHour: 11, startMinute: 0, endHour: 12, endMinute: 0, variant: "standard", dayOfWeek: 3, dayOfMonth: 27 },
  { id: 7, title: "1:1 Meeting", startHour: 14, startMinute: 0, endHour: 14, endMinute: 30, variant: "standard", dayOfWeek: 3, dayOfMonth: 27 },
  { id: 8, title: "Deep Work", startHour: 10, startMinute: 0, endHour: 12, endMinute: 0, variant: "deepWork", icon: "psychology", dayOfWeek: 4, dayOfMonth: 28 },
  { id: 9, title: "Retro", startHour: 15, startMinute: 0, endHour: 16, endMinute: 0, variant: "review", dayOfWeek: 5, dayOfMonth: 29 },
  { id: 10, title: "Lunch Break", startHour: 12, startMinute: 0, endHour: 13, endMinute: 0, variant: "break", icon: "restaurant", dayOfWeek: 2, dayOfMonth: 26 },
];

const eventStyles: Record<EventVariant, { containerClass: string; titleClass: string; centered: boolean; showTime: boolean }> = {
  standard: {
    containerClass: "calendar-event--green",
    titleClass: "calendar-event-title calendar-event-title--green",
    centered: false,
    showTime: false,
  },
  review: {
    containerClass: "calendar-event--blue",
    titleClass: "calendar-event-title calendar-event-title--blue",
    centered: false,
    showTime: true,
  },
  break: {
    containerClass: "calendar-event--neutral",
    titleClass: "calendar-event-title calendar-event-title--neutral",
    centered: true,
    showTime: false,
  },
  deepWork: {
    containerClass: "calendar-event--purple",
    titleClass: "calendar-event-title calendar-event-title--purple",
    centered: false,
    showTime: false,
  },
};

const HOUR_START = 0;
const HOURS_COUNT = 24;

const getTop = (hour: number, minute: number) => {
  const hoursFromStart = hour + minute / 60 - HOUR_START;
  return hoursFromStart * 60;
};

const getCurrentTimeTop = (hour: number, minute: number) => {
  return getTop(hour, minute);
};

const getHeight = (startHour: number, startMinute: number, endHour: number, endMinute: number) => {
  const start = startHour + startMinute / 60;
  const end = endHour + endMinute / 60;
  return (end - start) * 60;
};

const formatTime = (hour: number, minute: number) => {
  const h = hour % 12 || 12;
  const m = minute.toString().padStart(2, "0");
  const ampm = hour >= 12 ? "PM" : "AM";
  return `${h}:${m} ${ampm}`;
};

const DAY_LABELS = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

const getMonthDays = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: { day: number; currentMonth: boolean }[] = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDay - 1; i >= 0; i--) {
    cells.push({ day: prevMonthDays - i, currentMonth: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, currentMonth: true });
  }
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    cells.push({ day: d, currentMonth: false });
  }
  return cells;
};

const getWeekStart = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
};

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState({ hour: 13, minute: 20 });
  const [view, setView] = useState<ViewMode>("day");
  const calendarBodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime({ hour: now.getHours(), minute: now.getMinutes() });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (view === "month") return;
    const timer = setTimeout(() => {
      const el = calendarBodyRef.current;
      if (!el) return;
      const now = new Date();
      const top = getTop(now.getHours(), now.getMinutes());
      el.scrollTo({ top: Math.max(0, top - 120), behavior: "smooth" });
    }, 50);
    return () => clearTimeout(timer);
  }, [view]);

  const formatToolbarDate = (date: Date, mode: ViewMode) => {
    if (mode === "month") {
      return date.toLocaleDateString("en-US", { month: "long", year: "numeric" }).toUpperCase();
    }
    if (mode === "week") {
      const weekStart = getWeekStart(date);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      const startStr = weekStart.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      const endStr = weekEnd.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      return `${startStr} – ${endStr}`.toUpperCase();
    }
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).toUpperCase();
  };

  const goToToday = () => setCurrentDate(new Date());

  const goToPrev = () => {
    setCurrentDate((d) => {
      const nd = new Date(d);
      if (view === "day") nd.setDate(nd.getDate() - 1);
      else if (view === "week") nd.setDate(nd.getDate() - 7);
      else nd.setMonth(nd.getMonth() - 1);
      return nd;
    });
  };

  const goToNext = () => {
    setCurrentDate((d) => {
      const nd = new Date(d);
      if (view === "day") nd.setDate(nd.getDate() + 1);
      else if (view === "week") nd.setDate(nd.getDate() + 7);
      else nd.setMonth(nd.getMonth() + 1);
      return nd;
    });
  };

  const currentTimeTop = getCurrentTimeTop(currentTime.hour, currentTime.minute);

  const monthCells = useMemo(
    () => getMonthDays(currentDate.getFullYear(), currentDate.getMonth()),
    [currentDate.getFullYear(), currentDate.getMonth()]
  );

  const weekDays = useMemo(() => {
    const start = getWeekStart(currentDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate.getTime()]);

  const getEventsForDate = (date: Date) => {
    const dow = date.getDay();
    const dom = date.getDate();
    return events.filter((e) => e.dayOfWeek === dow && e.dayOfMonth === dom);
  };

  const navLabel = view === "day" ? "Previous day" : view === "week" ? "Previous week" : "Previous month";
  const navLabelNext = view === "day" ? "Next day" : view === "week" ? "Next week" : "Next month";

  return (
    <div className="page-shell page-shell--centered flex flex-col items-center justify-center font-body-main text-text-primary antialiased relative overflow-hidden">
      <main className="workspace-surface workspace-container workspace-calendar calendar-panel w-full flex flex-col relative z-0 overflow-hidden">
        <header className="calendar-header border-b border-border-subtle bg-surface-white z-10">
          <h1 className="page-title text-text-primary">Calendar</h1>
        </header>
        <div className="calendar-toolbar bg-surface-white border-b border-border-subtle z-10">
          <div className="flex items-center gap-4 min-w-0">
            <div className="calendar-date section-heading text-text-primary tracking-wide">
              {formatToolbarDate(currentDate, view)}
            </div>
          </div>
          <div className="calendar-actions">
            <div className="calendar-view-switcher">
              {(["day", "week", "month"] as ViewMode[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setView(v)}
                  className={`calendar-view-btn${view === v ? " calendar-view-btn--active" : ""}`}
                >
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </button>
              ))}
            </div>
            <button type="button" onClick={goToToday} className="button-compact calendar-secondary-action bg-surface-container-low text-text-primary font-label-secondary text-label-secondary hover:bg-surface-container-high">
              Today
            </button>
            <div className="calendar-day-actions">
              <button type="button" onClick={goToPrev} aria-label={navLabel} className="icon-button rounded-l text-text-muted hover:text-primary hover:bg-surface-container-low">
                <span className="material-symbols-outlined icon-inline" aria-hidden="true">chevron_left</span>
              </button>
              <button type="button" onClick={goToNext} aria-label={navLabelNext} className="icon-button rounded-r text-text-muted hover:text-primary hover:bg-surface-container-low">
                <span className="material-symbols-outlined icon-inline" aria-hidden="true">chevron_right</span>
              </button>
            </div>
          </div>
        </div>

        <div ref={calendarBodyRef} className="calendar-body relative bg-surface-white scroll-smooth">
          {/* ── Day View ── */}
          {view === "day" && (
            <div className="calendar-grid relative px-6 pt-4 pb-8">
              <div className="calendar-axis absolute top-4 left-16 right-6 bottom-8 border-l border-border-subtle pointer-events-none" />
              <div className="relative w-full">
                {Array.from({ length: HOURS_COUNT }, (_, i) => HOUR_START + i).map((hour) => (
                  <div key={hour} className="calendar-time-row relative flex w-full">
                    <div className="calendar-hour-label pr-4 text-right flex-none">
                      <span className="font-caption-metadata text-caption-metadata text-text-muted">
                        {hour.toString().padStart(2, "0")}:00
                      </span>
                    </div>
                    <div className="calendar-hour-line flex-1 border-t border-border-subtle/50 relative" />
                  </div>
                ))}
                <div className="calendar-event-layer absolute top-0 left-16 right-0 bottom-0 pointer-events-none">
                  {events.map((event) => {
                    const eventStyle = eventStyles[event.variant];
                    return (
                      <div
                        key={event.id}
                        className={`calendar-event absolute left-2 right-4 pointer-events-auto flex flex-col justify-start overflow-hidden ${eventStyle.containerClass} ${eventStyle.centered ? "calendar-event--centered" : ""}`}
                        style={{ top: getTop(event.startHour, event.startMinute), height: getHeight(event.startHour, event.startMinute, event.endHour, event.endMinute) }}
                      >
                        {event.icon ? (
                          <div className={`${eventStyle.titleClass} flex items-center gap-2`}>
                            <span className="material-symbols-outlined icon-inline" aria-hidden="true" data-icon={event.icon}>{event.icon}</span>
                            {event.title}
                          </div>
                        ) : (
                          <>
                            <div className={`${eventStyle.titleClass} truncate`}>
                              {event.title}
                            </div>
                            {eventStyle.showTime && (
                              <div className="calendar-event-meta font-caption-metadata text-caption-metadata mt-1">
                                {formatTime(event.startHour, event.startMinute)} - {formatTime(event.endHour, event.endMinute)}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                  {currentTimeTop !== null && (
                    <div className="calendar-current-time absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: currentTimeTop }}>
                      <div className="calendar-current-time-dot w-2 h-2 rounded-full bg-primary -ml-1" />
                      <div className="calendar-current-time-line flex-1 h-[2px] bg-primary" />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── Week View ── */}
          {view === "week" && (
            <div className="calendar-week relative">
              <div className="calendar-week-header sticky top-0 bg-surface-white z-10 border-b border-border-subtle/50">
                <div className="calendar-week-header-inner flex">
                  <div className="calendar-week-gutter flex-none" />
                  {weekDays.map((d, i) => {
                    const isToday = isSameDay(d, new Date());
                    return (
                      <div key={i} className="calendar-week-col-header flex-1 text-center py-2">
                        <div className="font-caption-metadata text-caption-metadata text-text-muted tracking-wider">
                          {DAY_LABELS[i]}
                        </div>
                        <div className={`calendar-week-date mt-0.5 ${isToday ? "calendar-week-date--today" : ""}`}>
                          {d.getDate()}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="calendar-week-grid relative px-0 pt-0 pb-8">
                <div className="relative w-full flex">
                  <div className="calendar-week-gutter flex-none w-12 relative">
                    {Array.from({ length: HOURS_COUNT }, (_, i) => HOUR_START + i).map((hour) => (
                      <div key={hour} className="calendar-week-hour-label relative h-[60px] pr-3 text-right flex items-start justify-end pt-[-6px]">
                        <span className="font-caption-metadata text-caption-metadata text-text-muted leading-none -mt-[6px]">
                          {hour.toString().padStart(2, "0")}:00
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="calendar-week-columns flex-1 relative">
                    {/* Hour lines spanning all columns */}
                    {Array.from({ length: HOURS_COUNT }, (_, i) => HOUR_START + i).map((hour) => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-t border-border-subtle/50"
                        style={{ top: (hour - HOUR_START) * 60 }}
                      />
                    ))}
                    {/* Column dividers */}
                    {Array.from({ length: 6 }, (_, i) => (
                      <div
                        key={i}
                        className="absolute top-0 bottom-0 border-l border-border-subtle/30"
                        style={{ left: `${((i + 1) / 7) * 100}%` }}
                      />
                    ))}
                    {/* Current time line */}
                    {currentTimeTop !== null && (
                      <div
                        className="calendar-current-time absolute left-0 right-0 z-20 pointer-events-none flex items-center"
                        style={{ top: currentTimeTop }}
                      >
                        <div className="calendar-current-time-dot w-2 h-2 rounded-full bg-primary -ml-1" />
                        <div className="calendar-current-time-line flex-1 h-[2px] bg-primary" />
                      </div>
                    )}
                    {/* Events per day column */}
                    {weekDays.map((d, dayIdx) => {
                      const dayEvents = getEventsForDate(d);
                      return (
                        <div
                          key={dayIdx}
                          className="absolute top-0 bottom-0"
                          style={{ left: `${(dayIdx / 7) * 100}%`, width: `${100 / 7}%` }}
                        >
                          {dayEvents.map((event) => {
                            const eventStyle = eventStyles[event.variant];
                            return (
                              <div
                                key={event.id}
                                className={`calendar-event absolute left-0.5 right-1 pointer-events-auto flex flex-col justify-start overflow-hidden ${eventStyle.containerClass} ${eventStyle.centered ? "calendar-event--centered" : ""}`}
                                style={{
                                  top: getTop(event.startHour, event.startMinute),
                                  height: getHeight(event.startHour, event.startMinute, event.endHour, event.endMinute),
                                }}
                              >
                                {event.icon ? (
                                  <div className={`${eventStyle.titleClass} flex items-center gap-1`}>
                                    <span className="material-symbols-outlined icon-inline text-[14px]" aria-hidden="true">{event.icon}</span>
                                    {event.title}
                                  </div>
                                ) : (
                                  <div className={`${eventStyle.titleClass} truncate`}>
                                    {event.title}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                    {/* Ghost hour cells for alignment */}
                    {Array.from({ length: HOURS_COUNT }, (_, i) => HOUR_START + i).map((hour) => (
                      <div key={hour} className="calendar-week-hour-row relative" style={{ height: 60 }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── Month View ── */}
          {view === "month" && (
            <div className="calendar-month px-4 pt-2 pb-4">
              <div className="calendar-month-header grid grid-cols-7 border-b border-border-subtle">
                {DAY_LABELS.map((label) => (
                  <div key={label} className="calendar-month-col-label py-2 text-center font-caption-metadata text-caption-metadata text-text-muted tracking-wider">
                    {label}
                  </div>
                ))}
              </div>
              <div className="calendar-month-grid grid grid-cols-7">
                {monthCells.map((cell, i) => {
                  const cellDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), cell.day);
                  const isToday = cell.currentMonth && isSameDay(cellDate, new Date());
                  const cellEvents = cell.currentMonth ? getEventsForDate(cellDate) : [];
                  return (
                    <div
                      key={i}
                      className={`calendar-month-cell border-b border-r border-border-subtle/40 min-h-[80px] p-1 ${!cell.currentMonth ? "calendar-month-cell--other" : ""}`}
                    >
                      <div className={`calendar-month-day-number ${isToday ? "calendar-month-day-number--today" : ""} ${!cell.currentMonth ? "text-text-muted" : ""}`}>
                        {cell.day}
                      </div>
                      <div className="mt-0.5 flex flex-col gap-0.5">
                        {cellEvents.slice(0, 3).map((event) => {
                          const variantColor =
                            event.variant === "standard" ? "#486551" :
                            event.variant === "review" ? "#6c91ad" :
                            event.variant === "deepWork" ? "#9b7bb7" : "#a0a0a0";
                          return (
                            <div
                              key={event.id}
                              className="calendar-month-event truncate rounded px-1 py-0.5"
                              style={{ backgroundColor: `${variantColor}20`, color: variantColor, fontSize: "10px", lineHeight: "14px", fontWeight: 500 }}
                            >
                              {event.title}
                            </div>
                          );
                        })}
                        {cellEvents.length > 3 && (
                          <div className="text-text-muted" style={{ fontSize: "10px", lineHeight: "14px" }}>
                            +{cellEvents.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
