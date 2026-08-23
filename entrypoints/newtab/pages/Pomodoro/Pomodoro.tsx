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
    <div className="page-shell page-shell--centered bg-background text-on-background font-body-main relative items-center justify-center">
      {/* Main Workspace Container */}
      <main className="page-main flex-1 flex flex-col justify-center items-center relative z-10">
        {/* Pomodoro Panel */}
        <div className="workspace-surface workspace-narrow pomodoro-panel w-full p-6 md:p-10 flex flex-col items-center">
          {/* Header */}
          <div className="pomodoro-header w-full flex justify-between items-center mb-8">
            <h1 className="page-title text-text-primary">Pomodoro</h1>
            <button
              type="button"
              disabled
              aria-label="History unavailable"
              title="History is not available yet"
              className="control-unavailable font-label-secondary text-label-secondary transition-colors flex items-center gap-1"
            >
              History
              <span className="material-symbols-outlined icon-inline" aria-hidden="true">history</span>
            </button>
          </div>
          {/* Progress Ring & Timer */}
          <div className="pomodoro-ring relative aspect-square flex items-center justify-center">
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
          <div className="pomodoro-controls">
            <button
              type="button"
              onClick={handleStop}
              aria-label="Stop timer"
              className="icon-button border border-border-subtle text-text-secondary hover:bg-surface-container-low active:scale-95"
            >
              <span className="material-symbols-outlined icon-action" style={{ fontVariationSettings: "'FILL' 1" }}>stop</span>
            </button>
            <button
              type="button"
              onClick={handleStartPause}
              aria-label={isRunning ? "Pause timer" : "Start timer"}
              className="button-prominent bg-secondary-container text-on-secondary-container font-section-title text-section-title hover:bg-primary-fixed active:scale-95 border border-secondary-fixed-dim"
            >
              <span className="material-symbols-outlined icon-action" aria-hidden="true" style={{ fontVariationSettings: "'FILL' 1" }}>
                {isRunning ? "pause" : "play_arrow"}
              </span>
              {isRunning ? "Pause" : "Start"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              aria-label="Reset timer"
              className="icon-button border border-border-subtle text-text-secondary hover:bg-surface-container-low active:scale-95"
            >
              <span className="material-symbols-outlined icon-action">restart_alt</span>
            </button>
          </div>
          {/* Session Indicators */}
          <div className="pomodoro-sessions" role="group" aria-label="Pomodoro session progress">
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
