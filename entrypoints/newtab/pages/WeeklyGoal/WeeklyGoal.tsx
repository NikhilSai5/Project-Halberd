"use client";

import { useState } from "react";
import { useSettings, type WeeklyGoal } from '@/lib/SettingsContext';

export default function WeeklyGoal() {
  const { weeklyGoals, toggleWeeklyGoalComplete, updateWeeklyGoal } = useSettings();
  
  // Get the active (non-completed) weekly goal, or the most recent one
  const activeGoal = weeklyGoals.find(g => !g.completed) || weeklyGoals[0];
  const completedGoals = weeklyGoals.filter(g => g.completed);

  const [showHistory, setShowHistory] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editName, setEditName] = useState("");
  const [editTargetHours, setEditTargetHours] = useState(10);
  const [editStartDate, setEditStartDate] = useState("");

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  const calculateTotalTime = (sessions: { timeRange: string; description: string }[]) => {
    return `${sessions.length * 2}h ${sessions.length * 30}m`;
  };

  const handleCompleteGoal = () => {
    if (activeGoal) {
      toggleWeeklyGoalComplete(activeGoal.id);
    }
  };

  const handleEditGoal = () => {
    if (activeGoal) {
      setEditName(activeGoal.name);
      setEditTargetHours(activeGoal.targetHours);
      setEditStartDate(activeGoal.startDate);
      setShowEditForm(true);
    }
  };

  const handleSaveEdit = () => {
    if (activeGoal && editName.trim()) {
      const fallbackDate = new Date().toISOString().split("T")[0] ?? "";
      const startDate = editStartDate || fallbackDate;
      updateWeeklyGoal(activeGoal.id, {
        name: editName,
        targetHours: editTargetHours,
        startDate,
        endDate: new Date(new Date(startDate).getTime() + 6 * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0] ?? "",
      });
      setShowEditForm(false);
    }
  };

  const handleCancelEdit = () => {
    setShowEditForm(false);
  };

  if (!activeGoal) {
    return (
      <div className="page-shell page-shell--centered text-text-primary font-body-main relative overflow-x-hidden">
        <main className="page-main page-main--raised flex-grow flex items-center justify-center mt-[20px]">
          <article className="workspace-surface workspace-narrow weekly-goal-panel w-full p-6 sm:p-8 relative flex flex-col gap-6">
            <header className="page-header weekly-goal-header items-start">
              <div>
                <h2 className="section-heading text-text-secondary uppercase tracking-wider mb-1">Weekly Goal</h2>
                <h1 className="page-title text-primary text-[28px]">No active goal</h1>
              </div>
            </header>
            <section className="weekly-goal-summary flex flex-col gap-3">
              <div className="text-center py-8 text-text-muted">
                <span className="material-symbols-outlined text-4xl mb-2 block">flag</span>
                <p>Create a weekly goal in Settings to get started!</p>
              </div>
            </section>
          </article>
        </main>
      </div>
    );
  }

  // If the active goal is completed, show completed state
  if (activeGoal.completed) {
    return (
      <div className="page-shell page-shell--centered text-text-primary font-body-main relative overflow-x-hidden">
        <main className="page-main page-main--raised flex-grow flex items-center justify-center mt-[20px]">
          <article className="workspace-surface workspace-narrow weekly-goal-panel w-full p-6 sm:p-8 relative flex flex-col gap-6">
            <header className="page-header weekly-goal-header items-start justify-between">
              <div>
                <h2 className="section-heading text-text-secondary uppercase tracking-wider mb-1">Weekly Goal</h2>
                <h1 className="page-title text-primary text-[28px] line-through">{activeGoal.name}</h1>
                <div className="label-copy text-text-secondary mt-1">{formatDate(activeGoal.startDate)} - {formatDate(activeGoal.endDate)}</div>
                <div className="mt-2 inline-flex items-center gap-1.5 bg-primary-container/20 text-primary px-3 py-1 rounded-full text-sm font-medium">
                  <span className="material-symbols-outlined text-[16px]">check_circle</span>
                  <span>Completed</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowHistory(true)}
                  className="icon-button text-text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
                  aria-label="View goal history"
                  title="View history"
                >
                  <span className="material-symbols-outlined text-[20px]">history</span>
                </button>
                <button
                  onClick={() => toggleWeeklyGoalComplete(activeGoal.id)}
                  className="complete-goal-btn relative w-12 h-12 rounded-full bg-secondary-container text-secondary flex items-center justify-center transition-all duration-300 hover:bg-secondary hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-secondary focus:ring-offset-2 group"
                  aria-label="Restore goal"
                  title="Restore goal"
                >
                  <span className="material-symbols-outlined text-[24px] transition-transform duration-200 group-hover:-rotate-12 group-active:scale-110">undo</span>
                  <span className="absolute inset-0 rounded-full bg-secondary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                </button>
              </div>
            </header>
            
            <section className="weekly-goal-summary flex flex-col gap-3">
              <div className="weekly-duration">
                <span className="font-display-timer text-display-timer text-primary">{calculateTotalTime(activeGoal.sessions)}</span>
                <span className="label-copy text-text-muted uppercase tracking-wider">total time spent / {activeGoal.targetHours}h target</span>
              </div>
              <div className="w-full">
                <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((activeGoal.sessions.length * 2.5) / activeGoal.targetHours * 100, 100)}%` }}
                  />
                </div>
              </div>
            </section>
            
            <section className="weekly-session-list flex flex-col gap-2" aria-label="Weekly goal sessions">
              {activeGoal.sessions.length > 0 ? (
                activeGoal.sessions.map((session, index) => (
                  <div key={index} className="list-row weekly-session-row border-b border-border-subtle group last:border-0 opacity-75">
                    <div className="weekly-session-content">
                      <span className="weekly-session-time label-copy text-primary">{session.timeRange}</span>
                      <span className="weekly-session-description body-copy text-text-primary line-through">{session.description}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-text-muted">
                  <span className="material-symbols-outlined text-4xl mb-2 block">schedule</span>
                  <p>{"No sessions recorded."}</p>
                </div>
              )}
            </section>
          </article>
        </main>
      </div>
    );
  }

  const renderActiveGoal = () => (
    <>
      <header className="page-header weekly-goal-header items-start justify-between">
        <div>
          <h2 className="section-heading text-text-secondary uppercase tracking-wider mb-1">Weekly Goal</h2>
          <h1 className="page-title text-primary text-[28px]">{activeGoal.name}</h1>
          <div className="label-copy text-text-secondary mt-1">{formatDate(activeGoal.startDate)} - {formatDate(activeGoal.endDate)}</div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEditGoal}
            className="icon-button text-text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
            aria-label="Edit goal"
            title="Edit goal"
          >
            <span className="material-symbols-outlined text-[20px]">edit</span>
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className="icon-button text-text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
            aria-label="View goal history"
            title="View history"
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
          </button>
          <button
            onClick={handleCompleteGoal}
            className="complete-goal-btn relative w-12 h-12 rounded-full bg-primary-container text-primary flex items-center justify-center transition-all duration-300 hover:bg-primary hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 group"
            aria-label="Complete goal"
            title="Complete goal"
          >
            <span className="material-symbols-outlined text-[24px] transition-transform duration-200 group-hover:rotate-12 group-active:scale-110">check_circle</span>
            <span className="absolute inset-0 rounded-full bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
          </button>
        </div>
      </header>
      
      {showEditForm && (
        <div className="bg-primary-container/20 border border-primary-container rounded-xl p-4 space-y-3">
          <h4 className="section-heading text-text-primary">Edit Goal</h4>
          <div className="space-y-3">
            <div>
              <label className="font-label-secondary text-label-secondary text-text-secondary block mb-1">Goal Name</label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="form-control w-full bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                placeholder="e.g., Learn TypeScript"
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="font-label-secondary text-label-secondary text-text-secondary block mb-1">Target Hours</label>
                <input
                  type="number"
                  value={editTargetHours}
                  onChange={(e) => setEditTargetHours(Number(e.target.value))}
                  min="1"
                  max="100"
                  className="form-control w-full bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
              <div>
                <label className="font-label-secondary text-label-secondary text-text-secondary block mb-1">Start Date</label>
                <input
                  type="date"
                  value={editStartDate}
                  onChange={(e) => setEditStartDate(e.target.value)}
                  className="form-control w-full bg-transparent border border-border-subtle rounded-lg px-3 py-2 font-body-main text-body-main text-on-surface focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                />
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleSaveEdit}
                className="button-regular font-section-title text-section-title flex-1"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancelEdit}
                className="button-regular button-regular--outlined font-section-title text-section-title flex-1"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      
      <section className="weekly-goal-summary flex flex-col gap-3">
        <div className="weekly-duration">
          <span className="font-display-timer text-display-timer text-primary">{calculateTotalTime(activeGoal.sessions)}</span>
          <span className="label-copy text-text-muted uppercase tracking-wider">total time spent / {activeGoal.targetHours}h target</span>
        </div>
        <div className="w-full">
          <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${Math.min((activeGoal.sessions.length * 2.5) / activeGoal.targetHours * 100, 100)}%` }}
            />
          </div>
        </div>
      </section>
      
      <section className="weekly-session-list flex flex-col gap-2" aria-label="Weekly goal sessions">
        {activeGoal.sessions.length > 0 ? (
          activeGoal.sessions.map((session, index) => (
            <div key={index} className="list-row weekly-session-row border-b border-border-subtle group last:border-0">
              <div className="weekly-session-content">
                <span className="weekly-session-time label-copy text-primary">{session.timeRange}</span>
                <span className="weekly-session-description body-copy text-text-primary">{session.description}</span>
              </div>
              <a
                aria-label={`Open session: ${session.description}`}
                className="weekly-session-link icon-button text-text-muted hover:text-primary transition-colors"
                href="#"
                onClick={(event) => event.preventDefault()}
                title="Session link unavailable"
              >
                <span className="material-symbols-outlined icon-inline" aria-hidden="true">link</span>
              </a>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-text-muted">
            <span className="material-symbols-outlined text-4xl mb-2 block">schedule</span>
            <p>{"No sessions recorded yet. Add sessions in Settings > Goals."}</p>
          </div>
        )}
      </section>
    </>
  );

  const renderHistoryView = () => (
    <div>
      <header className="page-header weekly-goal-header items-start justify-between mb-6">
        <div>
          <h2 className="section-heading text-text-secondary uppercase tracking-wider mb-1">Goal History</h2>
          <p className="label-copy text-text-secondary">{completedGoals.length} completed goal{completedGoals.length !== 1 ? "s" : ""}</p>
        </div>
        <button
          onClick={() => setShowHistory(false)}
          className="icon-button text-text-secondary hover:text-primary transition-colors p-2 rounded-full hover:bg-surface-container"
          aria-label="Back to active goal"
          title="Back to active goal"
        >
          <span className="material-symbols-outlined text-[20px]">arrow_back</span>
        </button>
      </header>
      
      {completedGoals.length > 0 ? (
        <div className="space-y-3">
          {completedGoals.map((goal) => (
            <div key={goal.id} className="bg-surface-container-low rounded-xl border border-border-subtle p-4">
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-body-main text-body-main text-on-surface font-medium line-through">{goal.name}</div>
                  <div className="label-copy text-text-secondary mt-0.5">{formatDate(goal.startDate)} - {formatDate(goal.endDate)}</div>
                </div>
                <button
                  onClick={() => toggleWeeklyGoalComplete(goal.id)}
                  className="button-regular button-regular--outlined font-section-title text-section-title text-primary border-primary text-sm px-3 py-1.5 flex-shrink-0"
                >
                  Restore
                </button>
              </div>
              <div className="flex items-center gap-4 text-sm">
                <div className="flex-1">
                  <div className="label-copy text-text-secondary">Target: {goal.targetHours}h</div>
                  <div className="label-copy text-text-secondary">Time Spent: {calculateTotalTime(goal.sessions)}</div>
                </div>
                <div className="w-32">
                  <div className="h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/50 rounded-full transition-all"
                      style={{ width: `${Math.min((goal.sessions.length * 2.5) / goal.targetHours * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
              {goal.sessions.length > 0 && (
                <div className="mt-3 space-y-2 border-t border-border-subtle pt-3">
                  <div className="label-copy text-text-secondary uppercase tracking-wider">Sessions</div>
                  <div className="space-y-1">
                    {goal.sessions.map((session, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm text-text-secondary">
                        <span className="font-mono text-text-muted">{session.timeRange}</span>
                        <span>{session.description}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-text-muted">
          <span className="material-symbols-outlined text-4xl mb-2 block">history</span>
          <p>No completed weekly goals yet.</p>
          <p className="text-sm mt-1">Complete your first goal to see it here!</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="page-shell page-shell--centered text-text-primary font-body-main relative overflow-x-hidden">
      <main className="page-main page-main--raised flex-grow flex items-center justify-center mt-[20px]">
        <article className="workspace-surface workspace-narrow weekly-goal-panel w-full p-6 sm:p-8 relative flex flex-col gap-6">
          {showHistory ? renderHistoryView() : renderActiveGoal()}
        </article>
      </main>
    </div>
  );
}