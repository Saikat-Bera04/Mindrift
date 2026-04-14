"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { MechanicalCard } from "@/components/ui/mechanics";
import { Slider } from "@/components/ui/slider";
import { Moon, Save, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SleepTracker() {
  const { getToken } = useAuth();
  const [hours, setHours] = useState<number>(7);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string>("");

  const handleSaveSleep = async () => {
    setIsSyncing(true);
    setSyncStatus("Syncing...");

    try {
      const token = await getToken();
      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      const response = await fetch(`${backendUrl}/health/metric`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          metricType: "sleep",
          value: hours,
          unit: "hours",
          notes: "Manual entry from dashboard"
        }),
      });

      if (response.ok) {
        setSyncStatus("Saved Successfully");
        setTimeout(() => setSyncStatus(""), 3000);
      } else {
        setSyncStatus("Sync failed");
      }
    } catch (error) {
      setSyncStatus("Error");
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <MechanicalCard className="p-6" withVents>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-[11px] font-bold text-muted-fg font-mono tracking-widest uppercase flex items-center gap-2">
          <Moon className="w-4 h-4 text-indigo-400" /> Input Module: Sleep Cycle
        </h3>
        <div className="flex gap-1">
          <div className={`w-1.5 h-1.5 rounded-full shadow-glow ${isSyncing ? 'bg-yellow-500 animate-pulse' : 'bg-indigo-500'}`} />
        </div>
      </div>

      <div className="space-y-8">
        <div className="flex flex-col items-center justify-center py-4">
          <span className="text-4xl font-bold font-mono text-foreground mb-2">
            {hours.toFixed(1)}
          </span>
          <span className="text-[10px] font-bold font-mono tracking-widest text-muted-fg uppercase">
            Hours Slept Last Night
          </span>
        </div>

        <div className="px-2">
          <Slider
            value={[hours]}
            min={4}
            max={12}
            step={0.5}
            onValueChange={(val) => setHours(val[0])}
            disabled={isSyncing}
            className="cursor-pointer"
          />
          <div className="flex justify-between mt-2">
            <span className="text-[9px] font-mono text-muted-fg uppercase">4h</span>
            <span className="text-[9px] font-mono text-muted-fg uppercase">8h</span>
            <span className="text-[9px] font-mono text-muted-fg uppercase">12h</span>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={handleSaveSleep}
            disabled={isSyncing}
            className={`
              w-full font-mono text-[10px] font-bold uppercase tracking-widest h-10
              ${syncStatus === "Saved Successfully" ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-indigo-600 hover:bg-indigo-700'}
            `}
          >
            {isSyncing ? (
              "Communicating..."
            ) : syncStatus === "Saved Successfully" ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" /> Logged
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" /> Log Sleep Time
              </>
            )}
          </Button>
          {syncStatus && syncStatus !== "Saved Successfully" && (
            <p className="text-center text-[10px] font-mono font-bold text-yellow-600 uppercase">
              {syncStatus}
            </p>
          )}
        </div>
      </div>
    </MechanicalCard>
  );
}
