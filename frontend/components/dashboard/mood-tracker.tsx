"use client";

import { useState } from "react";
import { moodOptions } from "@/lib/dummy-data";
import { MechanicalCard } from "@/components/ui/mechanics";

export function MoodTracker() {
  const [selected, setSelected] = useState<number | null>(4);

  return (
    <MechanicalCard className="p-6" withVents>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[11px] font-bold text-muted-fg font-mono tracking-widest uppercase">Input Module: Mood</h3>
        <div className="flex gap-1" title="Power Status">
          <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-glow animate-pulse" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        {moodOptions.map((mood) => {
          const isActive = selected === mood.value;
          return (
            <button
              key={mood.value}
              onClick={() => setSelected(mood.value)}
              className={`
                flex flex-col items-center justify-center gap-2 p-3 rounded-xl flex-1
                transition-all duration-200
                ${isActive
                  ? 'bg-background shadow-pressed ring-2 ring-accent ring-offset-2 ring-offset-background translate-y-1'
                  : 'bg-background shadow-card active:shadow-pressed hover:translate-y-px hover:shadow-floating'
                }
              `}
            >
              <span
                className={`text-2xl transition-all duration-300 ${isActive ? 'scale-110 drop-shadow-md' : 'grayscale opacity-60'}`}
              >
                {mood.emoji}
              </span>
              <span className={`text-[10px] font-bold font-mono tracking-wider transition-colors ${isActive ? 'text-accent' : 'text-muted-fg'}`}>
                {mood.label.toUpperCase()}
              </span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="mt-6 pt-4 border-t border-muted-bg shadow-[0_1px_0_#ffffff]">
          <p className="text-xs text-muted-fg font-mono uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            Last Log: <span className="font-bold text-foreground">
              {moodOptions.find(m => m.value === selected)?.label}
            </span>
          </p>
        </div>
      )}
    </MechanicalCard>
  );
}
