"use client";

import { Search, Bell } from "lucide-react";
import { RecessedInput, PhysicalButton } from "@/components/ui/mechanics";
import { ManualEntryForm } from "@/components/dashboard/manual-entry";

export function DashboardHeader({ title, subtitle }: { title: string, subtitle?: string }) {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short', month: 'short', day: 'numeric'
  }).toUpperCase();

  return (
    <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 mt-4 md:mt-0">
      <div>
        <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight" style={{ textShadow: "0 1px 1px #ffffff" }}>{title}</h1>
        {subtitle && <p className="text-sm text-muted-fg mt-2 font-mono uppercase tracking-widest">{subtitle}</p>}
      </div>
      
      <div className="flex items-center gap-4">
        {/* Status/Date LED cluster */}
        <div className="hidden sm:flex items-center gap-3 px-5 h-12 rounded-lg bg-background shadow-recessed">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]" />
          <span className="font-mono text-xs font-bold text-muted-fg tracking-widest">SYS: OK</span>
          <div className="w-px h-5 bg-border-shadow mx-2" />
          <span className="font-mono text-xs font-bold text-foreground tracking-widest">{today}</span>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-fg" />
          <RecessedInput placeholder="SEARCH LOGS..." className="pl-12 h-12 text-xs" />
        </div>

        <PhysicalButton variant="secondary" className="!w-12 !h-12 !p-0 !min-h-0 flex shrink-0 rounded-full">
          <Bell className="w-5 h-5 text-muted-fg" />
          <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-accent shadow-glow" />
        </PhysicalButton>

        <ManualEntryForm />
      </div>
    </header>
  );
}
