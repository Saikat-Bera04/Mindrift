"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { DashboardHeader } from "@/components/dashboard/header";
import { WellnessGauge } from "@/components/dashboard/wellness-gauge";
import { StatsCard } from "@/components/dashboard/stats-card";
import { MoodTracker } from "@/components/dashboard/mood-tracker";
import { StressWidget } from "@/components/dashboard/stress-widget";
import { MechanicalCard } from "@/components/ui/mechanics";
import { wellnessScore, quickStats, weeklyMoodData, recentActivities } from "@/lib/dummy-data";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, CartesianGrid } from "recharts";
import { Clock, Activity, Heart, Briefcase, Moon, AlertTriangle, Phone, MessageCircle, X } from "lucide-react";
import Link from "next/link";
import { useStress } from "@/hooks/use-stress";
import { motion, AnimatePresence } from "framer-motion";

const moodColors = ['#ff4757', '#f97316', '#f59e0b', '#10b981', '#06b6d4'];
const stressColors = ['#10b981', '#10b981', '#f59e0b', '#f97316', '#ff4757']; // 0-10 scale colors

function getStressColorForValue(value: number): string {
  if (value <= 2) return stressColors[0];
  if (value <= 4) return stressColors[1];
  if (value <= 6) return stressColors[2];
  if (value <= 8) return stressColors[3];
  return stressColors[4];
}

export default function DashboardPage() {
  const { getToken } = useAuth();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { analysis: stressAnalysis, history: stressHistory } = useStress();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await getToken();
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

        const meRes = await fetch(`${backendUrl}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (meRes.ok) {
          const me = await meRes.json();
          setUser(me);
          setProfile({
            age: me.age,
            bmi: me.bmi ?? (me.height && me.weight ? Number((me.weight / ((me.height / 100) ** 2)).toFixed(1)) : null),
            status: me.currentStatus,
            sleepHours: me.sleepHours,
          });
        }

        // Fallback to dummy data for dashboard
        setDashboardData({ latestScore: { overall: wellnessScore } });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getToken]);

  const displayName = user?.displayName || "Operator";
  const level = user?.gamification?.level ?? 1;
  const xp = user?.gamification?.xp ?? 0;
  const streak = user?.gamification?.streak ?? 0;

  // Use real score or fallback to dummy, blend with stress analysis when available
  const baseScore = dashboardData?.latestScore?.overall ?? wellnessScore;
  const stressAdjustedScore = stressAnalysis 
    ? Math.round((baseScore * 0.6) + ((10 - stressAnalysis.stressLevel) * 10 * 0.4)) // 60% wellness + 40% inverse stress
    : baseScore;
  const overallScore = stressAdjustedScore;

  // Build stats from real data + profile
  const liveStats = [
    {
      id: "sleep-quality",
      label: "Sleep",
      value: profile?.sleepHours ? `${profile.sleepHours}` : (quickStats[1]?.value ?? "7.2"),
      unit: "hrs",
      trend: "+0.5",
      positive: true,
    },
    {
      id: "stress-level",
      label: "Stress",
      value: stressAnalysis ? String(stressAnalysis.stressLevel) : (quickStats[2]?.value ?? "5"),
      unit: "/10",
      trend: stressAnalysis ? `${stressAnalysis.confidence}% AI` : "AI",
      positive: stressAnalysis ? stressAnalysis.stressLevel <= 5 : true,
    },
    {
      id: "mood-streak",
      label: "Streak",
      value: String(streak),
      unit: "days",
      trend: streak > 0 ? `+${streak}` : "0",
      positive: streak >= 0,
    },
    {
      id: "mindfulness",
      label: "Level",
      value: String(level),
      unit: "rank",
      trend: `+${xp} XP`,
      positive: true,
    }
  ];

  return (
    <>
      <DashboardHeader title="SYSTEM OVERVIEW" subtitle={`Welcome back, ${displayName}`} />

      {/* Critical Stress Alert Banner */}
      <CriticalStressAlert level={stressAnalysis?.stressLevel} />

      {/* Profile Summary Banner */}
      {profile && (
        <MechanicalCard className="p-6 mb-0" withScrews={false}>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-muted-fg">
              <Heart className="w-4 h-4 text-accent" /> Age: <span className="text-foreground">{profile.age}</span>
            </div>
            <div className="w-px h-6 bg-muted-bg"></div>
            <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-muted-fg">
              <Activity className="w-4 h-4 text-accent" /> BMI: <span className="text-foreground">{profile.bmi}</span>
            </div>
            {profile.status && (
              <>
                <div className="w-px h-6 bg-muted-bg"></div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-muted-fg">
                  <Briefcase className="w-4 h-4 text-accent" /> <span className="text-foreground">{profile.status}</span>
                </div>
              </>
            )}
            {profile.sleepHours && (
              <>
                <div className="w-px h-6 bg-muted-bg"></div>
                <div className="flex items-center gap-2 text-xs font-mono font-bold uppercase tracking-widest text-muted-fg">
                  <Moon className="w-4 h-4 text-accent" /> Sleep: <span className="text-foreground">{profile.sleepHours}h</span>
                </div>
              </>
            )}
            <div className="ml-auto">
              <span className="px-3 py-1 rounded-full shadow-recessed bg-emerald-500/10 text-emerald-600 text-[10px] font-mono font-bold tracking-widest uppercase">
                Profile Synced
              </span>
            </div>
          </div>
        </MechanicalCard>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column - Gauge + Stats */}
        <div className="lg:col-span-4 space-y-8">
          <MechanicalCard className="p-8 flex flex-col items-center" withScrews>
            <div className="w-full flex justify-between items-center mb-6">
              <span className="text-[10px] font-mono tracking-widest font-bold text-muted-fg uppercase">Main Diagnostic</span>
              <span className="px-2 py-0.5 rounded shadow-recessed bg-emerald-500/10 text-emerald-600 text-[10px] font-mono font-bold tracking-widest">ON_LINE</span>
            </div>
            <WellnessGauge score={overallScore} />
          </MechanicalCard>
          <MoodTracker />
          <StressWidget />
        </div>

        {/* Right Column */}
        <div className="lg:col-span-8 space-y-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
            {liveStats.map((stat) => (
              <StatsCard key={stat.id} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <MechanicalCard className="p-6" withScrews>
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
                <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">Stress Trajectory</h3>
                <span className="text-[10px] text-muted-fg font-mono font-bold">
                  {stressHistory && stressHistory.length >= 7 ? "AI_GEN" : "RAW_DATA"}
                </span>
              </div>
              <div className="h-[220px] p-4 rounded-xl bg-background shadow-recessed">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={stressHistory && stressHistory.length >= 7 
                      ? stressHistory.slice(0, 7).reverse().map((h, i) => ({ day: `D${i+1}`, score: h.stressLevel }))
                      : weeklyMoodData
                    } 
                    barSize={24} 
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#babecc" opacity={0.3} vertical={false} />
                    <XAxis dataKey="day" axisLine={false} tickLine={false}
                      tick={{ fill: '#4a5568', fontSize: 10, fontFamily: 'var(--font-jetbrains)' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} domain={[0, 10]} hide />
                    <Bar dataKey="score" radius={[4, 4, 4, 4]}>
                      {(stressHistory && stressHistory.length >= 7 
                        ? stressHistory.slice(0, 7).reverse().map((h) => h.stressLevel)
                        : weeklyMoodData.map((e) => e.score)
                      ).map((score, i) => (
                        <Cell key={i} fill={stressHistory && stressHistory.length >= 7 
                          ? getStressColorForValue(score)
                          : moodColors[score - 1]
                        } />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </MechanicalCard>

            <MechanicalCard className="p-6">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
                <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">Event Log</h3>
                <span className="text-[10px] text-muted-fg font-mono font-bold px-2 py-0.5 rounded shadow-recessed">{recentActivities.length} ENTRIES</span>
              </div>
              <div className="space-y-3 h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                {recentActivities.map((activity) => (
                  <div key={activity.id}
                    className="group bg-background shadow-card hover:shadow-floating hover:-translate-y-0.5 transition-all flex items-center gap-4 p-3 rounded-lg">
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

// Critical Stress Alert Banner Component
function CriticalStressAlert({ level }: { level?: number }) {
  const [dismissed, setDismissed] = useState(false);

  if (!level || level <= 7 || dismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mb-4"
      >
        <div className="bg-red-500 border border-red-600 rounded-xl p-4 shadow-lg shadow-red-500/20">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg uppercase tracking-wide">
                Critical Stress Alert
              </h3>
              <p className="text-red-100 text-sm mt-1">
                Your stress level is <strong>{level.toFixed(1)}/10</strong>. This indicates severe mental strain. 
                Please seek professional help immediately.
              </p>
              <div className="flex flex-wrap gap-3 mt-4">
                <a 
                  href="tel:988" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white text-red-600 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-red-50 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Call 988 Suicide & Crisis Lifeline
                </a>
                <a 
                  href="tel:911" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-700 text-white rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-red-800 transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  Emergency 911
                </a>
                <Link 
                  href="/chat"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-red-500/50 text-white border border-white/30 rounded-lg font-bold text-sm uppercase tracking-wider hover:bg-red-500/70 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Talk to Aura AI
                </Link>
              </div>
              <p className="text-red-200 text-xs mt-3">
                If you're in immediate danger, please call emergency services. You are not alone.
              </p>
            </div>
            <button 
              onClick={() => setDismissed(true)}
              className="text-white/60 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
