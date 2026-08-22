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
];

export default function WeeklyGoal() {
  return (
    <div className="min-h-screen text-text-primary font-body-main flex flex-col relative overflow-x-hidden">
      <main className="flex-grow flex items-center justify-center p-[20px] pt-32 pb-32">
        <article className="glass-panel w-full max-w-md rounded-xl p-6 sm:p-8 relative flex flex-col gap-6">
          <header className="flex justify-between items-start">
            <div>
              <h2 className="font-section-title text-section-title text-text-secondary uppercase tracking-wider mb-1">Weekly Goal</h2>
              <h1 className="font-headline-page text-headline-page md:font-headline-page md:text-headline-page text-primary text-[28px]">Learn Distributed Systems</h1>
            </div>
          </header>
          
          <section className="flex flex-col gap-3">
            <div className="flex flex-col items-center justify-center gap-1 py-4">
              <span className="font-display-timer text-display-timer text-primary">14h 25m</span>
              <span className="font-label-secondary text-label-secondary text-text-muted uppercase tracking-wider">total time spent</span>
            </div>
          </section>
          
          <section className="flex flex-col gap-[8px]">
            {sessions.map((session, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-border-subtle group last:border-0">
                <div className="flex items-center gap-3">
                  <span className="font-label-secondary text-label-secondary text-primary">{session.timeRange}</span>
                  <span className="font-body-main text-body-main text-text-primary">{session.description}</span>
                </div>
                <a className="text-text-muted hover:text-primary transition-colors" href="#">
                  <span className="material-symbols-outlined text-[18px]">link</span>
                </a>
              </div>
            ))}
          </section>
        </article>
      </main>
      
      <div className="fixed bottom-32 right-8 md:right-16 z-40 opacity-80 hover:opacity-100 transition-opacity" />
    </div>
  );
}