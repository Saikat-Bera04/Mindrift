"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { WellnessGauge } from "@/components/dashboard/wellness-gauge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { MoodTracker } from "@/components/dashboard/mood-tracker";
import { MechanicalCard } from "@/components/ui/mechanics";
import { wellnessScore, quickStats, weeklyMoodData, recentActivities } from "@/lib/dummy-data";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { Clock } from "lucide-react";

const moodColors = ['#ff4757', '#f97316', '#f59e0b', '#10b981', '#06b6d4'];

export default function DashboardPage() {
  return (
    <>
      <DashboardHeader title="SYSTEM OVERVIEW" subtitle="Control Panel Active" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Gauge + Stats */}
        <div className="lg:col-span-4 space-y-8">
          {/* Main Display Unit */}
          <MechanicalCard className="p-8 flex flex-col items-center" withScrews>
            <div className="w-full flex justify-between items-center mb-6">
              <span className="text-[10px] font-mono tracking-widest font-bold text-muted-fg uppercase">Main Diagnostic</span>
              <span className="px-2 py-0.5 rounded shadow-recessed bg-emerald-500/10 text-emerald-600 text-[10px] font-mono font-bold tracking-widest">ON_LINE</span>
            </div>
            
            <WellnessGauge score={wellnessScore} />
          </MechanicalCard>

          {/* Mood Input Module */}
          <MoodTracker />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-8">
          {/* Telemetry Strip - Quick Stats */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {quickStats.map((stat) => (
              <StatsCard key={stat.id} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Chart Module */}
            <MechanicalCard className="p-6" withScrews>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
                <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">7-Day Trajectory</h3>
                <span className="text-[10px] text-muted-fg font-mono font-bold">RAW_DATA</span>
              </div>
              <div className="h-[220px] p-4 rounded-xl bg-background shadow-recessed">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyMoodData} barSize={24} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#babecc" opacity={0.3} vertical={false} />
                    <XAxis
                      dataKey="day" axisLine={false} tickLine={false}
                      tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }}
                      dy={10}
                    />
                    <YAxis 
                      axisLine={false} tickLine={false} domain={[0, 5]} hide
                    />
                    <Bar dataKey="score" radius={[4, 4, 4, 4]}>
                      {weeklyMoodData.map((entry, i) => (
                        <Cell key={i} fill={moodColors[entry.score - 1]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </MechanicalCard>

            {/* Event Log Module */}
            <MechanicalCard className="p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
                <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">Event Log</h3>
                <span className="text-[10px] text-muted-fg font-mono font-bold px-2 py-0.5 rounded shadow-recessed">{recentActivities.length} ENTRIES</span>
              </div>

              <div className="space-y-3 h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {recentActivities.map((activity) => (
                  <div
                    key={activity.id}
                    className="group bg-background shadow-card hover:shadow-floating hover:-translate-y-0.5 transition-all flex items-center gap-4 p-3 rounded-lg"
                  >
                    <div className="w-10 h-10 rounded-lg bg-background shadow-recessed flex items-center justify-center text-lg shrink-0">
                      {activity.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground truncate">{activity.title}</p>
                      <span className="text-[10px] font-mono font-bold text-accent tracking-widest">{activity.duration}</span>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Clock className="w-3.5 h-3.5 text-muted-fg" />
                      <span className="text-[10px] font-mono font-bold text-muted-fg">{activity.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </MechanicalCard>
          </div>
        </div>
      </div>
    </>
  );
}
