"use client";

import { DashboardHeader } from "@/components/dashboard/header";
import { insights, trendData } from "@/lib/dummy-data";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { TrendingUp, TrendingDown, AlertTriangle, Sparkles, ArrowRight } from "lucide-react";
import { MechanicalCard } from "@/components/ui/mechanics";

const trendIcons: Record<string, React.ElementType> = {
  positive: TrendingUp,
  warning: AlertTriangle,
  negative: TrendingDown,
};

const trendColors: Record<string, string> = {
  positive: 'text-emerald-500 bg-emerald-500/10',
  warning: 'text-amber-500 bg-amber-500/10',
  negative: 'text-red-500 bg-red-500/10',
};

export default function InsightsPage() {
  return (
    <>
      <DashboardHeader title="INSIGHTS CORE" subtitle="AI Pattern Analysis Active" />

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <MechanicalCard className="p-6" withScrews>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
            <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">Mood/Sleep Correlation</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-card" />
                <span className="text-[10px] text-muted-fg font-mono font-bold tracking-widest">MOOD</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-cyan-500 shadow-card" />
                <span className="text-[10px] text-muted-fg font-mono font-bold tracking-widest">SLEEP</span>
              </div>
            </div>
          </div>
          
          <div className="h-[240px] p-4 rounded-xl bg-background shadow-recessed">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#babecc" opacity={0.3} vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false}
                  tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }} />
                <Tooltip
                  contentStyle={{ background: '#e0e5ec', border: 'none', borderRadius: 8, boxShadow: '8px 8px 16px #babecc, -8px -8px 16px #ffffff' }}
                  labelStyle={{ color: '#2d3436', fontWeight: 700, fontFamily: 'monospace' }}
                  itemStyle={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="mood" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#e0e5ec', stroke: '#f59e0b' }} />
                <Line type="monotone" dataKey="sleep" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#e0e5ec', stroke: '#06b6d4' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </MechanicalCard>

        <MechanicalCard className="p-6" withScrews>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
            <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">Stress vs Mindfulness</h3>
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-card" />
                <span className="text-[10px] text-muted-fg font-mono font-bold tracking-widest">STRESS</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-card" />
                <span className="text-[10px] text-muted-fg font-mono font-bold tracking-widest">MIND</span>
              </div>
            </div>
          </div>
          
          <div className="h-[240px] p-4 rounded-xl bg-background shadow-recessed">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#babecc" opacity={0.3} vertical={false} />
                <XAxis dataKey="week" axisLine={false} tickLine={false}
                  tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false}
                  tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }} />
                <Tooltip
                  contentStyle={{ background: '#e0e5ec', border: 'none', borderRadius: 8, boxShadow: '8px 8px 16px #babecc, -8px -8px 16px #ffffff' }}
                  labelStyle={{ color: '#2d3436', fontWeight: 700, fontFamily: 'monospace' }}
                  itemStyle={{ fontFamily: 'monospace', fontWeight: 700, fontSize: 12 }}
                />
                <Line type="monotone" dataKey="stress" stroke="#ef4444" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#e0e5ec', stroke: '#ef4444' }} />
                <Line type="monotone" dataKey="mindfulness" stroke="#10b981" strokeWidth={3} dot={{ r: 4, strokeWidth: 2, fill: '#e0e5ec', stroke: '#10b981' }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </MechanicalCard>
      </div>

      {/* AI Insights Cards */}
      <div className="mb-6 flex items-center gap-3">
        <div className="p-2 bg-background shadow-floating rounded-full">
          <Sparkles className="w-4 h-4 text-accent" />
        </div>
        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Generated Directives</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {insights.map((insight) => {
          const TrendIcon = trendIcons[insight.trend] || TrendingUp;
          return (
            <MechanicalCard key={insight.id} className="p-6 group cursor-pointer border-l-4 border-l-transparent hover:border-l-accent transition-colors" withVents>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded shadow-recessed ${trendColors[insight.trend]}`}>
                  <TrendIcon className="w-4 h-4" />
                </div>
                <span className="px-3 py-1 bg-background shadow-recessed rounded text-[10px] text-muted-fg font-mono uppercase font-bold tracking-widest">
                  {insight.category}
                </span>
              </div>
              <h4 className="text-base font-extrabold text-foreground mb-3">{insight.title}</h4>
              <p className="text-sm text-foreground/80 leading-relaxed min-h-[60px]">{insight.description}</p>
              <div className="mt-6 pt-4 border-t border-muted-bg shadow-[0_1px_0_#ffffff] flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold tracking-widest text-muted-fg">PRIORITY: {insight.impact.toUpperCase()}</span>
                <div className="flex items-center gap-2 text-xs font-bold text-accent group-hover:translate-x-1 transition-transform">
                  <span>EXECUTE</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </div>
            </MechanicalCard>
          );
        })}
      </div>
    </>
  );
}
