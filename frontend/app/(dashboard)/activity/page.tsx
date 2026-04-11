"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { activityLog, habits, habitGridData } from "@/lib/dummy-data";
import { Clock, Flame, Target } from "lucide-react";
import { MechanicalCard } from "@/components/ui/mechanics";

const typeEmojis: Record<string, string> = {
  meditation: '🧘', journal: '📝', exercise: '🏃', breathing: '🌬️', sleep: '😴',
};

export default function ActivityPage() {
  return (
    <>
      <DashboardHeader title="ACTIVITY LOG" subtitle="Behavioral Telemetry" />

      {/* Habit Streaks */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6 mb-8">
        {habits.map((habit) => (
          <MechanicalCard key={habit.id} className="p-5 flex flex-col justify-between" withScrews={false}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-3 h-3 rounded-full shadow-recessed border border-white" style={{ backgroundColor: habit.color }} />
              <span className="text-xs text-foreground font-bold uppercase tracking-widest truncate">{habit.name}</span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-3">
              <Flame className="w-4 h-4 text-accent" />
              <span className="text-2xl font-extrabold text-foreground font-mono drop-shadow-[0_1px_0_#ffffff]">{habit.streak}</span>
              <span className="text-[10px] text-muted-fg font-mono font-bold tracking-widest">DAYS</span>
            </div>
            
            {/* Mechanical Progress bar */}
            <div className="mt-auto">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] text-muted-fg font-mono font-bold">COMPLETION</span>
                <span className="text-[10px] text-foreground font-mono font-bold">{habit.completionRate}%</span>
              </div>
              <div className="h-2.5 rounded-full bg-background shadow-recessed overflow-hidden p-0.5">
                <div
                  className="h-full rounded-full transition-all duration-1000 shadow-card"
                  style={{ width: `${habit.completionRate}%`, backgroundColor: habit.color }}
                />
              </div>
            </div>
          </MechanicalCard>
        ))}
      </div>

      {/* Habit Grid */}
      <MechanicalCard className="p-8 mb-8" withVents>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
          <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">30-Day Punch Card</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-accent shadow-card" />
              <span className="text-[10px] font-mono font-bold text-muted-fg tracking-widest">DONE</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-accent/40 shadow-recessed" />
              <span className="text-[10px] font-mono font-bold text-muted-fg tracking-widest">PARTIAL</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-background shadow-recessed" />
              <span className="text-[10px] font-mono font-bold text-muted-fg tracking-widest">MISS</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="min-w-[700px]">
            {/* Header */}
            <div className="grid grid-cols-[100px_repeat(30,1fr)] gap-1.5 mb-2">
              <div />
              {Array.from({ length: 30 }, (_, i) => (
                <div key={i} className="text-center text-[10px] text-muted-fg font-mono font-bold">{i + 1}</div>
              ))}
            </div>
            {/* Rows */}
            <div className="space-y-1.5">
              {habits.map((habit, hi) => (
                <div key={habit.id} className="grid grid-cols-[100px_repeat(30,1fr)] gap-1.5 items-center">
                  <span className="text-xs font-bold text-foreground uppercase tracking-widest truncate pr-2" style={{ color: habit.color }}>
                    {habit.name}
                  </span>
                  {habitGridData.map((row, di) => {
                    const val = row[hi];
                    return (
                      <div
                        key={di}
                        className="aspect-square rounded-sm transition-all"
                        style={
                          val === 1 ? { backgroundColor: habit.color, boxShadow: `inset 2px 2px 4px rgba(0,0,0,0.2), inset -2px -2px 4px rgba(255,255,255,0.4)` } :
                          val === 0.5 ? { backgroundColor: habit.color, opacity: 0.4, boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.2)' } :
                          { backgroundColor: 'var(--background)', boxShadow: 'inset 2px 2px 4px #babecc, inset -2px -2px 4px #ffffff' }
                        }
                        title={`Day ${di + 1}: ${val === 1 ? 'Complete' : val === 0.5 ? 'Partial' : 'Missed'}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </MechanicalCard>

      {/* Activity Log */}
      <MechanicalCard className="p-8">
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
          <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">Chronological Log</h3>
        </div>

        <div className="space-y-4">
          {activityLog.map((entry) => (
            <div key={entry.id} className="group flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 p-4 rounded-xl bg-background shadow-recessed hover:shadow-card transition-all">
              <div className="w-12 h-12 rounded-xl bg-background shadow-floating flex items-center justify-center text-xl shrink-0 group-hover:rotate-6 transition-transform">
                {typeEmojis[entry.type] || '📋'}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                  <p className="text-base font-extrabold text-foreground">{entry.title}</p>
                  <span className="px-2 py-0.5 rounded shadow-recessed text-[10px] font-mono font-bold tracking-widest text-accent uppercase">
                    {entry.type}
                  </span>
                </div>
                <p className="text-sm text-foreground/70">{entry.notes}</p>
              </div>
              
              <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-2 shrink-0">
                <div className="flex items-center gap-1.5 px-3 py-1 rounded bg-background shadow-recessed">
                  <Target className="w-3.5 h-3.5 text-accent" />
                  <span className="text-xs font-mono font-bold text-foreground tracking-widest">{entry.duration} MIN</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-muted-fg tracking-widest">{entry.date}</span>
              </div>
            </div>
          ))}
        </div>
      </MechanicalCard>
    </>
  );
}
