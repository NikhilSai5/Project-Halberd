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
    <div className="page-shell page-shell--centered text-text-primary font-body-main relative overflow-x-hidden antialiased">
      <main className="page-main flex-grow flex items-center justify-center">
        <article className="workspace-surface workspace-narrow focus-card w-full p-6 sm:p-8 relative flex flex-col gap-6 text-center items-center">
          <header className="page-header items-start w-full">
            <h2 className="section-heading text-text-secondary uppercase tracking-wider mb-1">Focus Mode</h2>
            <button
              type="button"
              aria-disabled="true"
              aria-label="Close focus mode unavailable"
              title="Closing focus mode is not available yet"
              onClick={(event) => event.preventDefault()}
              className="control-unavailable icon-button"
            >
              <span className="material-symbols-outlined icon-action" aria-hidden="true">close</span>
            </button>
          </header>
          <div className="focus-content">
            <span className="material-symbols-outlined focus-icon" aria-hidden="true" data-icon="target">center_focus_strong</span>
            <div className="focus-task">
              <h1 className="page-title text-primary">Build Halberd</h1>
            </div>
            <div className="focus-timer">
              <div className="font-display-timer text-display-timer text-text-primary tracking-tight">
                {time}
              </div>
            </div>
          </div>
          <button
            type="button"
            aria-disabled="true"
            aria-label="End focus unavailable"
            title="Ending focus is not available yet"
            onClick={(event) => event.preventDefault()}
            className="control-unavailable button-prominent w-full font-section-title text-section-title"
          >
            End Focus
          </button>
        </article>
      </main>
    </div>
  );
}
