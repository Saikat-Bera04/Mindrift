"use client";

import { MechanicalCard } from "@/components/ui/mechanics";
import { Flame, Moon, Activity, Brain } from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  'mood-streak': Flame,
  'sleep-quality': Moon,
  'stress-level': Activity,
  'mindfulness': Brain,
};

interface StatsCardProps {
  id: string;
  label: string;
  value: string;
  unit: string;
  trend: string;
  positive: boolean;
}

export function StatsCard({ id, label, value, unit, trend, positive }: StatsCardProps) {
  const Icon = iconMap[id] || Activity;

  return (
    <MechanicalCard className="p-6 group flex flex-col justify-between min-h-[140px]" elevated={false} withScrews={false}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-background shadow-recessed group-hover:shadow-[inset_2px_2px_4px_#babecc,inset_-2px_-2px_4px_#ffffff,0_0_0_1px_var(--accent)] transition-all">
          <Icon className="w-4 h-4 text-muted-fg group-hover:text-accent transition-colors" />
        </div>
        <div className={`px-3 py-1 rounded shadow-recessed ${positive ? 'text-emerald-600' : 'text-accent'}`}>
          <span className="text-[10px] font-mono font-bold tracking-widest">{trend}</span>
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-mono font-bold text-foreground tracking-tight drop-shadow-[0_1px_0_#ffffff]">{value}</span>
          <span className="text-xs text-muted-fg font-mono font-bold uppercase tracking-widest">{unit}</span>
        </div>
        <p className="text-xs font-bold text-muted-fg uppercase tracking-widest mt-2">{label}</p>
      </div>
    </MechanicalCard>
  );
}
