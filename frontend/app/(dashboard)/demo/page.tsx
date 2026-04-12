"use client";

import { DemoDataDisplay } from "@/components/dashboard/stress-alert";

export default function DemoPage() {
  return (
    <div className="w-full bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen py-8">
      <DemoDataDisplay />
    </div>
  );
}
