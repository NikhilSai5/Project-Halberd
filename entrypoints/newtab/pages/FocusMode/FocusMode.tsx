"use client";

import { useState, useEffect } from "react";

export default function FocusMode() {
  const [time, setTime] = useState("42:17");

  useEffect(() => {
    let seconds = 42 * 60 + 17;
    const interval = setInterval(() => {
      seconds--;
      if (seconds < 0) seconds = 0;
      const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
      const secs = (seconds % 60).toString().padStart(2, "0");
      setTime(`${mins}:${secs}`);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen text-text-primary font-body-main flex flex-col relative overflow-x-hidden antialiased">
      <main className="flex-grow flex items-center justify-center p-[20px] pb-32 pt-24">
        <article className="glass-panel w-full max-w-md rounded-xl p-6 sm:p-8 relative flex flex-col gap-6 text-center items-center">
          <header className="flex justify-between items-start w-full">
            <h2 className="font-section-title text-section-title text-text-secondary uppercase tracking-wider mb-1">Focus Mode</h2>
            <button className="text-text-muted hover:text-primary transition-colors cursor-pointer active:scale-95 flex items-center justify-center">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </header>
          <div className="flex flex-col items-center gap-8 py-8">
            <span className="material-symbols-outlined text-[32px] text-text-muted" data-icon="target">center_focus_strong</span>
            <div className="flex flex-col items-center gap-4">
              <h1 className="font-headline-page text-headline-page md:text-headline-page text-primary">Build Halberd</h1>
            </div>
            <div className="flex flex-col items-center gap-4">
              <div className="font-display-timer text-display-timer text-text-primary tracking-tight">
                {time}
              </div>
            </div>
          </div>
          <button className="w-full bg-primary-container/30 hover:bg-primary-container/50 text-secondary border border-primary-container/50 rounded-lg py-3 font-section-title text-section-title transition-colors">
            End Focus
          </button>
        </article>
      </main>
      <div className="fixed bottom-32 right-8 md:right-16 z-40 opacity-80 hover:opacity-100 transition-opacity" />
    </div>
  );
}