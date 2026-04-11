"use client";

import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { AICompanion } from "@/components/dashboard/ai-companion";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister()
        }
      })
    }
  }, [])

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
