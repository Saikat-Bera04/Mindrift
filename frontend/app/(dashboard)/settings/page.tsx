"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { DashboardHeader } from "@/components/dashboard/header";
import { User, Bell, Palette, Shield, Heart, Activity } from "lucide-react";
import { MechanicalCard, PhysicalButton, RecessedInput } from "@/components/ui/mechanics";

const sections = [
  { id: 'profile', label: 'USER PROFILE', icon: User },
  { id: 'health', label: 'HEALTH DATA', icon: Heart },
  { id: 'notifications', label: 'ALERTS', icon: Bell },
  { id: 'appearance', label: 'INTERFACE', icon: Palette },
  { id: 'privacy', label: 'SECURITY', icon: Shield },
  { id: 'extension', label: 'EXTENSION', icon: Activity },
];

function ToggleSwitch({ enabled, onChange }: { enabled: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange}
      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${enabled ? 'bg-accent shadow-recessed' : 'bg-muted-bg shadow-recessed'}`}>
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-background transition-transform duration-300 shadow-[0_2px_4px_rgba(0,0,0,0.2)] ${enabled ? 'translate-x-[26px]' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState('profile');
  const [notifications, setNotifications] = useState({
    dailyReminder: true, weeklyReport: true, insightAlerts: true, streakReminder: true,
  });
  const [dataSharing, setDataSharing] = useState(false);
  
  const dbUser = useQuery(api.users.queries.getMe);
  const profile = useQuery(api.users.queries.getOnboardingProfile);

  const nameForInitials = dbUser?.displayName || dbUser?.email || "User";
  const initials = nameForInitials
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() ?? "")
    .join("") || "U";

  return (
    <>
      <DashboardHeader title="SYSTEM CONFIG" subtitle="Parameters & Preferences" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <MechanicalCard className="p-4 flex flex-col gap-2" withScrews={false}>
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              return (
                <button key={section.id} onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl text-left transition-all duration-200 min-h-[56px] focus:outline-none
                    ${isActive ? 'bg-background shadow-recessed text-accent' : 'bg-background shadow-card active:shadow-pressed hover:translate-y-px text-muted-fg hover:text-foreground'}`}>
                  <Icon className="w-5 h-5 shrink-0" />
                  <span className="text-sm font-bold uppercase tracking-widest flex-1">{section.label}</span>
                  {isActive && <div className="w-2 h-2 rounded-full bg-accent shadow-glow" />}
                </button>
              );
            })}
          </MechanicalCard>
        </div>

        <div className="lg:col-span-8">
          <MechanicalCard className="p-8">
            {activeSection === 'profile' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
                  <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-widest">Base Identity</h3>
                  {dbUser && <span className="px-2 py-1 rounded shadow-recessed bg-emerald-500/10 text-emerald-600 text-[10px] font-mono font-bold tracking-widest">DB CONNECTED</span>}
                </div>
                
                <div className="flex items-center gap-6">
                  <div className="w-20 h-20 rounded-full bg-background shadow-floating border-2 border-white flex items-center justify-center text-2xl font-bold text-foreground uppercase overflow-hidden">
                    {dbUser?.avatarUrl ? <img src={dbUser.avatarUrl} className="w-full h-full object-cover" /> : initials}
                  </div>
                  <div>
                    <p className="text-lg font-bold text-foreground">{dbUser?.displayName || "User"}</p>
                    <p className="text-xs font-mono text-muted-fg uppercase tracking-widest">
                      Level {dbUser?.level ?? 1} • {dbUser?.xp ?? 0} XP • Streak: {dbUser?.currentStreak ?? 0}d
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  {[
                    { label: 'CLASSIFICATION (NAME)', value: dbUser?.displayName || '' },
                    { label: 'COMM_ADDRESS (EMAIL)', value: dbUser?.email || '' },
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

            {activeSection === 'health' && (
              <div className="space-y-8">
                <div className="flex items-center justify-between pb-6 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
                  <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-widest">Health & Lifestyle Profile</h3>
                  {profile ? (
                    <span className="px-2 py-1 rounded shadow-recessed bg-emerald-500/10 text-emerald-600 text-[10px] font-mono font-bold tracking-widest">FROM DATABASE</span>
                  ) : (
                    <span className="px-2 py-1 rounded shadow-recessed bg-amber-500/10 text-amber-600 text-[10px] font-mono font-bold tracking-widest">NOT SET</span>
                  )}
                </div>
                
                {profile ? (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: "Age", value: profile.age, unit: "yrs" },
                        { label: "Height", value: profile.height, unit: "cm" },
                        { label: "Weight", value: profile.weight, unit: "kg" },
                        { label: "BMI", value: profile.bmi, unit: "" },
                      ].map((m) => (
                        <div key={m.label} className="p-4 rounded-xl bg-background shadow-recessed text-center">
                          <p className="text-[10px] font-mono font-bold text-muted-fg uppercase tracking-widest mb-1">{m.label}</p>
                          <p className="text-2xl font-mono font-bold text-foreground">{m.value}<span className="text-sm text-muted-fg ml-1">{m.unit}</span></p>
                        </div>
                      ))}
                    </div>

                    {profile.bloodPressure && (
                      <div className="p-4 rounded-xl bg-background shadow-recessed flex items-center justify-between">
                        <span className="text-xs font-mono font-bold text-muted-fg uppercase tracking-widest">Blood Pressure</span>
                        <span className="text-lg font-mono font-bold text-foreground">{profile.bloodPressure}</span>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {[
                        { label: "Status", value: profile.status },
                        { label: "Relationship", value: profile.relationshipStatus },
                        { label: "Working Hrs/Day", value: profile.workingHours ? `${profile.workingHours}h` : null },
                        { label: "Sleep Hrs/Night", value: profile.sleepHours ? `${profile.sleepHours}h` : null },
                      ].filter(f => f.value).map((f) => (
                        <div key={f.label} className="p-4 rounded-xl bg-background shadow-recessed flex items-center justify-between">
                          <span className="text-[10px] font-mono font-bold text-muted-fg uppercase tracking-widest">{f.label}</span>
                          <span className="text-sm font-bold text-foreground">{f.value}</span>
                        </div>
                      ))}
                    </div>

                    {profile.likes && (
                      <div className="p-4 rounded-xl bg-background shadow-recessed">
                        <p className="text-[10px] font-mono font-bold text-muted-fg uppercase tracking-widest mb-2">Likes</p>
                        <p className="text-sm text-foreground">{profile.likes}</p>
                      </div>
                    )}
                    {profile.dislikes && (
                      <div className="p-4 rounded-xl bg-background shadow-recessed">
                        <p className="text-[10px] font-mono font-bold text-muted-fg uppercase tracking-widest mb-2">Dislikes</p>
                        <p className="text-sm text-foreground">{profile.dislikes}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="w-12 h-12 text-muted-fg mx-auto mb-4 opacity-30" />
                    <p className="text-muted-fg font-mono uppercase tracking-widest text-sm">No onboarding data found</p>
                    <p className="text-muted-fg text-xs mt-2">Complete onboarding to populate health metrics</p>
                  </div>
                )}
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
                      <button key={theme} className={`p-6 rounded-xl relative transition-all min-h-[100px] flex flex-col items-center justify-center gap-2
                        ${i === 0 ? 'bg-background shadow-recessed border-2 border-accent/20' : 'bg-background shadow-card opacity-50 cursor-not-allowed'}`} disabled={i === 1}>
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

            {activeSection === 'extension' && <ExtensionPairingSection />}
          </MechanicalCard>
        </div>
      </div>
    </>
  );
}

function ExtensionPairingSection() {
  const [pairingData, setPairingData] = useState<{code: string, expires: number} | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const generateCode = useMutation(api.users.mutations.generatePairingCode);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await generateCode({ deviceName: "Chrome Extension" });
      setPairingData({ code: res.pairingCode, expires: res.expiresAt });
    } catch (e) {
      console.error(e);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between pb-6 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
        <h3 className="text-sm font-bold text-foreground font-mono uppercase tracking-widest">Extension Pairing</h3>
        <span className="px-2 py-1 rounded shadow-recessed bg-accent/10 text-accent text-[10px] font-mono font-bold tracking-widest">DEVICE_GATEWAY</span>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-2xl bg-background shadow-recessed border border-white/40">
          <h4 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest mb-4">Pairing Protocol</h4>
          <p className="text-xs text-muted-fg leading-relaxed mb-6">
            To enable real-time analysis of your digital behavior, you must pair the Santulan Chrome Extension with your user core.
          </p>
          
          <div className="flex flex-col items-center gap-6 py-4">
            {pairingData ? (
              <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-300">
                <div className="flex gap-2">
                  {pairingData.code.split('').map((digit, i) => (
                    <div key={i} className="w-12 h-16 rounded-xl bg-background shadow-card border border-white flex items-center justify-center text-3xl font-mono font-bold text-accent">
                      {digit}
                    </div>
                  ))}
                </div>
                <p className="text-[10px] font-mono font-bold text-muted-fg uppercase tracking-widest">
                  Expires in {Math.round((pairingData.expires - Date.now()) / 60000)} minutes
                </p>
              </div>
            ) : (
              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-accent text-white font-bold uppercase tracking-widest shadow-floating active:shadow-pressed transition-all disabled:opacity-50"
              >
                {isGenerating ? "Generating..." : "Generate Pairing Code"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold text-muted-fg uppercase tracking-widest">Installation Status</h4>
            <div className="p-4 rounded-xl bg-background shadow-recessed flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Chrome Extension</span>
              <a href="#" className="text-[10px] font-mono font-bold text-accent hover:underline">DOWNLOAD_CRX</a>
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="text-[10px] font-mono font-bold text-muted-fg uppercase tracking-widest">Sync Metrics</h4>
            <div className="p-4 rounded-xl bg-background shadow-recessed flex items-center justify-between">
              <span className="text-xs font-bold text-foreground">Real-time Stream</span>
              <span className="text-[10px] font-mono font-bold text-emerald-600">INACTIVE</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
