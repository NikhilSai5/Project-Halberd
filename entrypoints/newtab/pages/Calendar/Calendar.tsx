"use client";

import { useState, useEffect } from "react";

interface Event {
  id: number;
  title: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  variant: EventVariant;
  icon?: string;
}

type EventVariant = "standard" | "review" | "break" | "deepWork";

const events: Event[] = [
  { id: 1, title: "Team Standup", startHour: 9, startMinute: 0, endHour: 9, endMinute: 30, variant: "standard" },
  { id: 2, title: "Design Review", startHour: 10, startMinute: 30, endHour: 11, endMinute: 30, variant: "review" },
  { id: 3, title: "Lunch Break", startHour: 12, startMinute: 0, endHour: 13, endMinute: 0, variant: "break", icon: "restaurant" },
  { id: 4, title: "Deep Work", startHour: 14, startMinute: 0, endHour: 15, endMinute: 30, variant: "deepWork", icon: "psychology" },
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

const getTop = (hour: number, minute: number) => {
  const hoursFromStart = hour + minute / 60 - 7;
  return hoursFromStart * 60;
};

const getCurrentTimeTop = (hour: number, minute: number) => {
  const time = hour + minute / 60;
  return time >= 7 && time <= 17 ? getTop(hour, minute) : null;
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

export default function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentTime, setCurrentTime] = useState({ hour: 13, minute: 20 });

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime({ hour: now.getHours(), minute: now.getMinutes() });
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).toUpperCase();
  };

  const goToToday = () => setCurrentDate(new Date());
  const goToPrevDay = () => setCurrentDate(d => new Date(d.setDate(d.getDate() - 1)));
  const goToNextDay = () => setCurrentDate(d => new Date(d.setDate(d.getDate() + 1)));
  const currentTimeTop = getCurrentTimeTop(currentTime.hour, currentTime.minute);

  return (
    <div className="page-shell page-shell--centered flex flex-col items-center justify-center font-body-main text-text-primary antialiased relative overflow-hidden">
      <main className="workspace-surface workspace-container workspace-calendar calendar-panel w-full flex flex-col relative z-0 overflow-hidden">
        <header className="calendar-header border-b border-border-subtle bg-surface-white z-10">
          <h1 className="page-title text-text-primary">Calendar</h1>
        </header>
        <div className="calendar-toolbar bg-surface-white border-b border-border-subtle z-10">
          <div className="calendar-date section-heading text-text-primary tracking-wide">
              {formatDate(currentDate)}
          </div>
          <div className="calendar-actions">
            <button type="button" onClick={goToToday} className="button-compact calendar-secondary-action bg-surface-container-low text-text-primary font-label-secondary text-label-secondary hover:bg-surface-container-high">
              Today
            </button>
            <div className="calendar-day-actions">
              <button type="button" onClick={goToPrevDay} aria-label="Previous day" className="icon-button rounded-l text-text-muted hover:text-primary hover:bg-surface-container-low">
                <span className="material-symbols-outlined icon-inline" aria-hidden="true">chevron_left</span>
              </button>
              <button type="button" onClick={goToNextDay} aria-label="Next day" className="icon-button rounded-r text-text-muted hover:text-primary hover:bg-surface-container-low">
                <span className="material-symbols-outlined icon-inline" aria-hidden="true">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        <div className="calendar-body relative bg-surface-white scroll-smooth">
          <div className="calendar-grid relative px-6 pt-4 pb-8">
            <div className="calendar-axis absolute top-4 left-16 right-6 bottom-8 border-l border-border-subtle pointer-events-none" />
            <div className="relative w-full">
              {Array.from({ length: 11 }, (_, i) => 7 + i).map((hour) => (
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
                {events.map((event) => (
                  (() => {
                    const eventStyle = eventStyles[event.variant];
                    return <div
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
                  </div>;
                  })()
                ))}
                {currentTimeTop !== null && (
                  <div className="calendar-current-time absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: currentTimeTop }}>
                    <div className="calendar-current-time-dot w-2 h-2 rounded-full bg-primary -ml-1" />
                    <div className="calendar-current-time-line flex-1 h-[2px] bg-primary" />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
