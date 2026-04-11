"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { userProfile } from "@/lib/dummy-data";
import { User, Bell, Palette, Shield, ChevronRight, Check } from "lucide-react";
import { MechanicalCard, PhysicalButton, RecessedInput } from "@/components/ui/mechanics";
import { useUser } from "@clerk/nextjs";

const sections = [
  { id: 'profile', label: 'USER PROFILE', icon: User },
  { id: 'notifications', label: 'ALERTS', icon: Bell },
  { id: 'appearance', label: 'INTERFACE', icon: Palette },
  { id: 'privacy', label: 'SECURITY', icon: Shield },
];

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button
      onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
        enabled ? 'bg-accent shadow-recessed' : 'bg-muted-bg shadow-recessed'
      }`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-transform duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.2)] ${
        enabled ? 'translate-x-[26px]' : 'translate-x-1'
      }`} />
    </button>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [notifications, setNotifications] = useState({
    dailyReminder: true, weeklyReport: true, insightAlerts: true, streakReminder: true,
  });
  const [dataSharing, setDataSharing] = useState(false);
  
  const { user } = useUser();
  const initials = `${user?.firstName?.charAt(0) || 'U'}${user?.lastName?.charAt(0) || ''}`;

  return (
    <>
      <DashboardHeader title="SYSTEM CONFIG" subtitle="Parameters & Preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-4">
          <MechanicalCard className="p-4 flex flex-col gap-2" withScrews={false}>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`
                    w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all duration-200 min-h-[56px] focus:outline-none
                    ${isActive 
                      ? 'bg-background shadow-recessed text-accent' 
                      : 'bg-background shadow-card active:shadow-pressed hover:translate-y-px text-muted-fg hover:text-foreground'
                    }
                  `}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-bold uppercase tracking-widest flex-1">{section.label}</span>
                  {isActive && <div className="w-2 h-2 rounded-full bg-accent shadow-glow" />}
                </button>
              );
            })}
          </MechanicalCard>
        </div>

        {/* Content */}
        <div className="lg:col-span-8">
          <MechanicalCard className="p-8">
            {activeSection === 'profile' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
                  <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-widest">Base Identity</h3>
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-background shadow-floating border-2 border-white flex items-center justify-center text-2xl font-bold text-foreground uppercase overflow-hidden">
                    {user?.imageUrl ? <img src={user.imageUrl} className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div>
                    <PhysicalButton variant="secondary" className="!h-10 !text-xs !px-4 mb-2">UPDATE PHOTO</PhysicalButton>
                    <p className="text-[10px] text-muted-fg font-mono uppercase font-bold tracking-widest">Supported: JPG, PNG • Max: 2MB</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {[
                    { label: 'CLASSIFICATION (NAME)', value: user?.fullName || '' },
                    { label: 'COMM_ADDRESS (EMAIL)', value: user?.primaryEmailAddress?.emailAddress || '' },
                    { label: 'OPERATIONAL_TIMEZONE', value: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC' },
                  ].map((field) => (
                    <div key={field.label} className={field.label.includes('EMAIL') ? 'md:col-span-2' : ''}>
                      <label className="text-[10px] text-muted-fg font-mono font-bold tracking-widest block mb-2">{field.label}</label>
                      <RecessedInput defaultValue={field.value} />
                    </div>
                  ))}
                </div>
                
                <div className="pt-4 border-t border-muted-bg shadow-[0_1px_0_#ffffff] flex justify-end">
                  <PhysicalButton>SAVE PARAMETERS</PhysicalButton>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
                  <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-widest">Alert Protocols</h3>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'dailyReminder', label: 'DAILY_CHECK_IN', desc: 'Require daily mood and biometric sync' },
                    { key: 'weeklyReport', label: 'WEEKLY_TELEMETRY', desc: 'Compile 7-day automated reports' },
                    { key: 'insightAlerts', label: 'AI_DIRECTIVES', desc: 'Push notifications for detected anomalies' },
                    { key: 'streakReminder', label: 'STREAK_WARNING', desc: 'Critical alert prior to sequence break' },
                  ].map((item) => (
                    <div key={item.key} className="flex items-center justify-between p-4 rounded-xl bg-background shadow-recessed">
                      <div>
                        <p className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">{item.label}</p>
                        <p className="text-[10px] text-muted-fg font-bold tracking-wide mt-1 uppercase">{item.desc}</p>
                      </div>
                      <ToggleSwitch
                        enabled={notifications[item.key as keyof typeof notifications]}
                        onChange={() => setNotifications(prev => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] }))}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeSection === 'appearance' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
                  <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-widest">Visual Output</h3>
                </div>
                <div>
                  <label className="text-[10px] text-muted-fg font-mono font-bold tracking-widest block mb-4">CHASSIS MATERIAL</label>
                  <div className="grid grid-cols-2 gap-4">
                    {['Light (Active)', 'Dark (Disabled)'].map((theme, i) => (
                      <button key={theme} className={`
                        p-6 rounded-xl relative transition-all min-h-[100px] flex flex-col items-center justify-center gap-2
                        ${i === 0 
                          ? 'bg-background shadow-recessed border-2 border-accent/20' 
                          : 'bg-background shadow-card opacity-50 cursor-not-allowed'
                        }
                      `} disabled={i === 1}>
                        <span className={`text-xs font-bold uppercase tracking-widest flex items-center gap-2 ${i === 0 ? 'text-accent' : 'text-muted-fg'}`}>
                          {i === 0 && <span className="w-1.5 h-1.5 rounded-full bg-accent shadow-glow" />}
                          {theme}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'privacy' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
                  <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-widest">Data Sec / WIPE</h3>
                </div>
                
                <div className="flex items-center justify-between p-4 rounded-xl bg-background shadow-recessed">
                  <div>
                    <p className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">Anonymized Sync</p>
                    <p className="text-[10px] text-muted-fg font-bold tracking-wide mt-1 uppercase">Share non-identifying telemetry to global array</p>
                  </div>
                  <ToggleSwitch enabled={dataSharing} onChange={() => setDataSharing(!dataSharing)} />
                </div>
                
                <div className="mt-8 p-6 rounded-xl bg-background shadow-recessed border border-red-500/20">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse" />
                    <h4 className="text-xs font-bold text-red-500 font-mono tracking-widest uppercase">Critical: Factory Reset</h4>
                  </div>
                  <p className="text-[10px] text-muted-fg font-bold tracking-wide mb-6 uppercase">Executing this sequence will permanently purge all local and synced telemetry databases.</p>
                  <PhysicalButton className="!bg-[#ef4444] !text-white active:!shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3)]">
                    INITIATE WIPE
                  </PhysicalButton>
                </div>
              </div>
            )}
          </MechanicalCard>
        </div>
      </div>
    </>
  );
}
