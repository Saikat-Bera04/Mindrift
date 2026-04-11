"use client";

import { recentActivities } from "@/lib/dummy-data";
import { Clock } from "lucide-react";

export function ActivityFeed() {
  return (
    <div className="p-5 rounded-xl bg-[#111827]/80 border border-white/[0.06] relative overflow-hidden">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.08] to-transparent" />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-white/60">Today&apos;s Activity</h3>
        <span className="text-xs text-white/25 font-mono">{recentActivities.length} entries</span>
      </div>

      <div className="space-y-1">
        {recentActivities.map((activity, i) => (
          <div
            key={activity.id}
            className="group flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/[0.02] transition-colors"
          >
            <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-sm shrink-0">
              {activity.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white/70 truncate">{activity.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] text-white/25 font-mono">{activity.duration}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 text-white/20">
              <Clock className="w-3 h-3" />
              <span className="text-[10px] font-mono">{activity.time}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
