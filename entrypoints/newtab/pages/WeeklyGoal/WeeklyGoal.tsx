"use client";

interface Session {
  timeRange: string;
  description: string;
}

const sessions: Session[] = [
  { timeRange: "06:55 - 11:00", description: "spent on studying distributed computing" },
  { timeRange: "13:20 - 15:45", description: "researching consensus algorithms" },
  { timeRange: "16:00 - 18:15", description: "reading Paxos vs Raft whitepapers" },
  { timeRange: "20:00 - 21:30", description: "practical implementation on GitHub" },
  { timeRange: "21:45 - 23:00", description: "reviewing distributed systems notes" },
];

export default function WeeklyGoal() {
  return (
    <div className="page-shell page-shell--centered text-text-primary font-body-main relative overflow-x-hidden">
      <main className="page-main page-main--raised flex-grow flex items-center justify-center mt-[20px]">
        <article className="workspace-surface workspace-narrow weekly-goal-panel w-full p-6 sm:p-8 relative flex flex-col gap-6">
          <header className="page-header weekly-goal-header items-start">
            <div>
              <h2 className="section-heading text-text-secondary uppercase tracking-wider mb-1">Weekly Goal</h2>
              <h1 className="page-title text-primary text-[28px]">Learn Distributed Systems</h1>
            </div>
          </header>
          
          <section className="weekly-goal-summary flex flex-col gap-3">
            <div className="weekly-duration">
              <span className="font-display-timer text-display-timer text-primary">14h 25m</span>
              <span className="label-copy text-text-muted uppercase tracking-wider">total time spent</span>
            </div>
          </section>
          
          <section className="weekly-session-list flex flex-col gap-2" aria-label="Weekly goal sessions">
            {sessions.map((session, index) => (
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
            ))}
          </section>
        </article>
      </main>
    </div>
  );
}
