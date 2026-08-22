"use client";

import { useState, useEffect } from "react";

interface Event {
  id: number;
  title: string;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  color: string;
  bgColor: string;
  icon?: string;
}

const events: Event[] = [
  { id: 1, title: "Team Standup", startHour: 9, startMinute: 0, endHour: 9, endMinute: 30, color: "border-primary text-on-primary-container", bgColor: "bg-primary-container/20" },
  { id: 2, title: "Design Review", startHour: 10, startMinute: 30, endHour: 11, endMinute: 30, color: "border-tertiary text-on-tertiary-container", bgColor: "bg-tertiary-container/20" },
  { id: 3, title: "Lunch Break", startHour: 12, startMinute: 0, endHour: 13, endMinute: 0, color: "border border-border-subtle text-text-muted", bgColor: "bg-surface-container-low", icon: "restaurant" },
  { id: 4, title: "Deep Work", startHour: 14, startMinute: 0, endHour: 15, endMinute: 30, color: "border-accent-purple text-accent-purple", bgColor: "bg-accent-purple/10", icon: "psychology" },
];

const getTop = (hour: number, minute: number) => {
  const hoursFromStart = hour + minute / 60 - 7;
  return hoursFromStart * 60;
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

  return (
    <div className="h-full flex flex-col items-center justify-center font-body-main text-text-primary antialiased relative overflow-hidden">
      <main className="w-full max-w-[800px] h-full md:h-[870px] md:max-h-[800px] bg-surface-white border border-border-subtle rounded-xl workspace-shadow flex flex-col mx-auto my-auto mt-4 md:mt-0 relative z-0 overflow-hidden">
        <header className="flex-none px-6 py-4 border-b border-border-subtle flex items-center justify-between bg-surface-white z-10">
          <h1 className="font-headline-page text-headline-page text-text-primary">Calendar</h1>
        </header>
        <div className="flex-none px-6 py-4 flex items-center justify-between bg-surface-white border-b border-border-subtle z-10">
          <div className="flex items-center gap-4">
            <span className="font-section-title text-section-title text-text-primary tracking-wide">
              {formatDate(currentDate)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToToday} className="px-3 py-1.5 rounded bg-surface-container-low text-text-primary font-label-secondary text-label-secondary hover:bg-surface-container-high transition-colors">
              Today
            </button>
            <div className="flex items-center">
              <button onClick={goToPrevDay} aria-label="Previous day" className="p-1.5 rounded-l text-text-muted hover:text-primary hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_left</span>
              </button>
              <button onClick={goToNextDay} aria-label="Next day" className="p-1.5 rounded-r text-text-muted hover:text-primary hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-sm">chevron_right</span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto relative bg-surface-white scroll-smooth pb-24">
          <div className="relative min-w-full px-6 pt-4 pb-8">
            <div className="absolute top-4 left-16 right-6 bottom-8 border-l border-border-subtle pointer-events-none" />
            <div className="relative w-full">
              {Array.from({ length: 11 }, (_, i) => 7 + i).map((hour) => (
                <div key={hour} className="time-row relative flex w-full">
                  <div className="w-12 pr-4 text-right flex-none">
                    <span className="font-caption-metadata text-caption-metadata text-text-muted">
                      {hour.toString().padStart(2, "0")}:00
                    </span>
                  </div>
                  <div className="flex-1 border-t border-border-subtle/50 relative" />
                </div>
              ))}
              <div className="absolute top-0 left-16 right-0 bottom-0 pointer-events-none">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className={`absolute left-2 right-4 rounded-md p-2 pointer-events-auto hover:shadow-md transition-shadow cursor-pointer flex flex-col justify-start overflow-hidden ${event.bgColor} ${event.color} ${event.id === 3 ? "justify-center items-center" : ""}`}
                    style={{ top: getTop(event.startHour, event.startMinute), height: getHeight(event.startHour, event.startMinute, event.endHour, event.endMinute) }}
                  >
                    {event.icon ? (
                      <div className="font-body-main text-body-main text-text-muted italic flex items-center gap-2">
                        <span className="material-symbols-outlined text-sm" data-icon={event.icon}>{event.icon}</span>
                        {event.title}
                      </div>
                    ) : (
                      <>
                        <div className={`font-${event.id === 2 ? "section-title" : "label-secondary"} text-${event.id === 2 ? "section-title" : "label-secondary"} truncate ${event.id === 2 ? "text-on-tertiary-container" : "font-medium"}`}>
                          {event.icon && <span className="material-symbols-outlined text-sm mr-1" data-icon={event.icon}>{event.icon}</span>}
                          {event.title}
                        </div>
                        {(event.id === 2 || event.id === 4) && (
                          <div className="font-caption-metadata text-caption-metadata mt-1" style={{ opacity: 0.7 }}>
                            {formatTime(event.startHour, event.startMinute)} - {formatTime(event.endHour, event.endMinute)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
                <div className="absolute left-0 right-0 z-20 pointer-events-none flex items-center" style={{ top: getTop(currentTime.hour, currentTime.minute) }}>
                  <div className="w-2 h-2 rounded-full bg-primary -ml-1" />
                  <div className="flex-1 h-[2px] bg-primary" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <div className="fixed bottom-32 right-12 z-0 hidden md:block opacity-40 pointer-events-none">
        <span className="material-symbols-outlined text-[32px] text-tertiary pixel-pet">cruelty_free</span>
      </div>
    </div>
  );
}