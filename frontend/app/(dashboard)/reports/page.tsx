"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { monthlyMoodData, sleepData, moodDistribution, weeklyComparison } from "@/lib/dummy-data";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { Download, TrendingUp, TrendingDown } from "lucide-react";
import { MechanicalCard, PhysicalButton } from "@/components/ui/mechanics";

export default function ReportsPage() {
  return (
    <>
      <DashboardHeader title="DATA REPORTS" subtitle="Historical Telemetry & Logs" />

      {/* Weekly Comparison Table */}
      <MechanicalCard className="p-8 mb-8" withScrews>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
          <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">7-Day Variance Report</h3>
          <PhysicalButton variant="secondary" className="!h-10 !text-xs !px-4">
            <Download className="w-3 h-3 mr-1" />
            EXPORT_CSV
          </PhysicalButton>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b-2 border-muted-bg">
                <th className="pb-4 text-[10px] font-bold text-muted-fg uppercase tracking-widest font-mono">Metric</th>
                <th className="pb-4 text-[10px] font-bold text-muted-fg uppercase tracking-widest font-mono text-right">Current</th>
                <th className="pb-4 text-[10px] font-bold text-muted-fg uppercase tracking-widest font-mono text-right">Previous</th>
                <th className="pb-4 text-[10px] font-bold text-muted-fg uppercase tracking-widest font-mono text-right">Delta</th>
              </tr>
            </thead>
            <tbody>
              {weeklyComparison.map((row) => (
                <tr key={row.metric} className="border-b border-muted-bg/50 hover:bg-muted-bg/20 transition-colors">
                  <td className="py-4 text-sm font-bold text-foreground uppercase tracking-widest">{row.metric}</td>
                  <td className="py-4 text-sm text-foreground font-mono font-bold text-right">{row.thisWeek}</td>
                  <td className="py-4 text-sm text-muted-fg font-mono font-bold text-right">{row.lastWeek}</td>
                  <td className="py-4 text-right">
                    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold font-mono tracking-widest px-2.5 py-1 rounded shadow-recessed ${
                      row.positive ? 'text-emerald-600 bg-emerald-500/10' : 'text-accent bg-accent/10'
                    }`}>
                      {row.positive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {row.change}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </MechanicalCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Mood Over Time */}
        <MechanicalCard className="p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
            <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">Aggregate Mood</h3>
          </div>
          <div className="h-[260px] p-4 rounded-xl bg-background shadow-recessed">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyMoodData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#ff4757" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#ff4757" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#babecc" opacity={0.3} vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }} dy={10} />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false}
                  tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }} />
                <Tooltip 
                  contentStyle={{ background: '#e0e5ec', border: 'none', borderRadius: 8, boxShadow: '8px 8px 16px #babecc, -8px -8px 16px #ffffff' }}
                  labelStyle={{ color: '#2d3436', fontWeight: 700, fontFamily: 'monospace' }}
                  itemStyle={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#ff4757' }}
                />
                <Area type="monotone" dataKey="score" stroke="#ff4757" strokeWidth={3} fill="url(#moodGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </MechanicalCard>

        {/* Sleep Analysis */}
        <MechanicalCard className="p-6">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
            <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">Sleep Analysis</h3>
          </div>
          <div className="h-[260px] p-4 rounded-xl bg-background shadow-recessed">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={sleepData} barSize={20} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#babecc" opacity={0.3} vertical={false} />
                <XAxis dataKey="date" axisLine={false} tickLine={false}
                  tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }} />
                <Tooltip 
                  contentStyle={{ background: '#e0e5ec', border: 'none', borderRadius: 8, boxShadow: '8px 8px 16px #babecc, -8px -8px 16px #ffffff' }}
                  labelStyle={{ color: '#2d3436', fontWeight: 700, fontFamily: 'monospace' }}
                  itemStyle={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12, color: '#06b6d4' }}
                />
                <Bar dataKey="hours" radius={[4, 4, 4, 4]} fill="#06b6d4" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </MechanicalCard>
      </div>

      {/* Mood Distribution */}
      <MechanicalCard className="p-8" withVents>
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
          <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">Mood Frequency Spectrum</h3>
        </div>
        
        <div className="space-y-5">
          {moodDistribution.map((item) => (
            <div key={item.mood} className="flex items-center gap-6">
              <span className="text-xs text-foreground font-bold uppercase tracking-widest w-16">{item.mood}</span>
              <div className="flex-1 h-8 rounded bg-background shadow-recessed overflow-hidden relative p-1">
                <div
                  className="h-full rounded transition-all duration-1000 flex items-center px-4 shadow-card"
                  style={{ width: `${item.percentage}%`, backgroundColor: item.color }}
                >
                  <span className="text-[10px] font-mono font-bold text-white tracking-widest">{item.count} LOGS</span>
                </div>
              </div>
              <span className="text-sm font-mono font-bold text-foreground w-12 text-right drop-shadow-[0_1px_0_#ffffff]">{item.percentage}%</span>
            </div>
          ))}
        </div>
      </MechanicalCard>
    </>
  );
}
