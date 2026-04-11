"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { AICompanion } from "@/components/dashboard/ai-companion";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen relative flex">
      <DashboardSidebar />

      {/* Main content - offset for sidebar */}
      <main className="md:ml-[240px] flex-1 transition-all duration-300 min-h-screen relative">
        <div className="px-6 md:px-12 py-10 max-w-[72rem] mx-auto space-y-12">
          {children}
        </div>
      </main>
      <AICompanion />
    </div>
  );
}
