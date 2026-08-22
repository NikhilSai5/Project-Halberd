"use client";

import { useState, useEffect, useRef } from "react";

const CIRCUMFERENCE = 2 * Math.PI * 15.9155;
const TOTAL_TIME = 25 * 60; // 25 minutes in seconds

export default function Pomodoro() {
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [isRunning, setIsRunning] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const circleRef = useRef<SVGPathElement>(null);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = window.setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current!);
            setIsRunning(false);
            return TOTAL_TIME;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning]);

  useEffect(() => {
    if (circleRef.current) {
      const progress = ((TOTAL_TIME - timeLeft) / TOTAL_TIME) * CIRCUMFERENCE;
      circleRef.current.style.strokeDasharray = `${progress} ${CIRCUMFERENCE}`;
    }
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60).toString().padStart(2, "0");
    const secs = (seconds % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  const handleStartPause = () => {
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setIsRunning(false);
    setTimeLeft(TOTAL_TIME);
  };

  const handleStop = () => {
    setIsRunning(false);
    setTimeLeft(0);
  };

  return (
    <div className="bg-background text-on-background min-h-screen font-body-main relative flex flex-col items-center justify-center pt-[20px] pb-32">
      {/* Main Workspace Container */}
      <main className="w-full max-w-lg px-[20px] flex-1 flex flex-col justify-center items-center mt-12 md:mt-0 relative z-10">
        {/* Pomodoro Panel */}
        <div className="w-full bg-surface-white rounded-2xl border border-border-subtle shadow-[0_4px_20px_rgba(0,0,0,0.05)] p-6 md:p-10 flex flex-col items-center">
          {/* Header */}
          <div className="w-full flex justify-between items-center mb-8">
            <h1 className="font-headline-page text-headline-page md:text-headline-page text-text-primary">Pomodoro</h1>
            <button className="font-label-secondary text-label-secondary text-text-muted hover:text-primary transition-colors flex items-center gap-1">
              History
              <span className="material-symbols-outlined text-[14px]">history</span>
            </button>
          </div>
          {/* Progress Ring & Timer */}
          <div className="relative w-full max-w-[280px] aspect-square flex items-center justify-center mb-10">
            <svg className="circular-chart absolute inset-0 w-full h-full" viewBox="0 0 36 36">
              <path
                className="circle-bg"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                ref={circleRef}
                className="circle stroke-primary-container"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                style={{ strokeDasharray: `0 ${CIRCUMFERENCE}`, transition: "stroke-dasharray .3s ease" }}
              />
            </svg>
            <div className="flex flex-col items-center z-10">
              <span className="font-display-timer text-display-timer text-text-primary">{formatTime(timeLeft)}</span>
              <span className="font-body-main text-body-main text-text-secondary mt-2">Focus Time</span>
            </div>
          </div>
          {/* Controls */}
          <div className="flex items-center gap-4 w-full justify-center">
            <button
              onClick={handleStop}
              className="w-12 h-12 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:bg-surface-container-low transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>stop</span>
            </button>
            <button
              onClick={handleStartPause}
              className="px-8 py-3 bg-secondary-container text-on-secondary-container rounded-full font-section-title text-section-title hover:bg-primary-fixed transition-colors active:scale-95 flex items-center gap-2 border border-secondary-fixed-dim"
            >
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isRunning ? "pause" : "play_arrow"}
              </span>
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              onClick={handleReset}
              className="w-12 h-12 rounded-full border border-border-subtle flex items-center justify-center text-text-secondary hover:bg-surface-container-low transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined">restart_alt</span>
            </button>
          </div>
          {/* Session Indicators */}
          <div className="mt-8 flex gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-container" />
            <div className="w-2 h-2 rounded-full bg-primary-container" />
            <div className="w-2 h-2 rounded-full bg-surface-container-high" />
            <div className="w-2 h-2 rounded-full bg-surface-container-high" />
          </div>
        </div>
      </main>
    </div>
  );
}