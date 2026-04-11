"use client";

import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/sidebar";
import { AICompanion } from "@/components/dashboard/ai-companion";
import { getBackendOrigin } from "@/lib/backend-url";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { getToken, isLoaded } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (!isLoaded) return;
    
    const checkOnboarding = async () => {
      try {
        const token = await getToken();
        const res = await fetch(`${getBackendOrigin()}/api/users/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!res.ok) {
          router.push("/onboarding");
          return;
        }

        const user = await res.json();
        if (!user.height || !user.weight || !user.age || !user.currentStatus || !user.relationshipStatus) {
          router.push("/onboarding");
          return;
        }
        
        setIsChecking(false);
      } catch (error) {
        console.error('Onboarding check failed:', error);
        setIsChecking(false);
      }
    };

    checkOnboarding();
  }, [isLoaded, getToken, router]);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then(function(registrations) {
        for(let registration of registrations) {
          registration.unregister()
        }
      })
    }
  }, [])

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
          <p className="font-mono text-xs uppercase tracking-widest text-muted-fg animate-pulse">Initializing Subsystems...</p>
        </div>
      </div>
    );
  }

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
