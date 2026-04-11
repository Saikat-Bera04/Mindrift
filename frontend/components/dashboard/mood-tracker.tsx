"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { moodOptions } from "@/lib/dummy-data";
import { MechanicalCard } from "@/components/ui/mechanics";

export function MoodTracker() {
  const { getToken } = useAuth();
  const [selected, setSelected] = useState<number | null>(4);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");

  const handleMoodSelect = async (moodValue: number) => {
    setSelected(moodValue);
    setIsSyncing(true);
    setSyncStatus("Syncing...");

    try {
      const token = await getToken();
      if (!token) {
        setSyncStatus("Auth error");
        setIsSyncing(false);
        return;
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/moods`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({ moodValue }),
      });

      if (response.ok) {
        setSyncStatus(`Status: ${moodOptions.find(m => m.value === moodValue)?.label || "Logged"}`);
        setTimeout(() => {
          setSyncStatus("");
          setIsSyncing(false);
        }, 2000);
      } else {
        setSyncStatus("Sync failed");
        setIsSyncing(false);
      }
    } catch (error) {
      setSyncStatus("Error");
      setIsSyncing(false);
    }
  };

  return (
    <MechanicalCard className="p-6" withVents>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[11px] font-bold text-muted-fg font-mono tracking-widest uppercase">Input Module: Mood</h3>
        <div className="flex gap-1" title="Power Status">
          <div className={`w-1.5 h-1.5 rounded-full shadow-glow animate-pulse ${isSyncing ? 'bg-yellow-500' : 'bg-accent'}`} />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3">
        {moodOptions.map((mood) => {
          const isActive = selected === mood.value;
          return (
            <button
              key={mood.value}
              onClick={() => handleMoodSelect(mood.value)}
              disabled={isSyncing}
              className={`
                flex flex-col items-center justify-center gap-2 p-3 rounded-xl flex-1
                transition-all duration-200
                ${isActive
                  ? 'bg-background shadow-pressed ring-2 ring-accent ring-offset-2 ring-offset-background translate-y-1'
                  : 'bg-background shadow-card active:shadow-pressed hover:translate-y-px hover:shadow-floating'
                }
                ${isSyncing ? 'opacity-60 cursor-not-allowed' : ''}
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
