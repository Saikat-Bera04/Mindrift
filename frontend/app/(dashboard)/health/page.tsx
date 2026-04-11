"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard/header";
import { MechanicalCard, PhysicalButton, RecessedInput } from "@/components/ui/mechanics";
import { useHealthTracker, formatTime } from "@/hooks/useHealthTracker";
import type { MovementStatus, HealthInsight } from "@/hooks/useHealthTracker";
import {
  Play,
  Square,
  MapPin,
  Footprints,
  Timer,
  Armchair,
  Route,
  Zap,
  PlusCircle,
  RotateCcw,
  Crosshair,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
  Dumbbell,
} from "lucide-react";

// ─── Status Badge Colors ────────────────────────────────────────────────
const statusConfig: Record<
  MovementStatus,
  { color: string; bg: string; glow: string; label: string; icon: string }
> = {
  Idle: {
    color: "#4a5568",
    bg: "rgba(74,85,104,0.08)",
    glow: "rgba(74,85,104,0.15)",
    label: "STANDBY",
    icon: "🧍",
  },
  Walking: {
    color: "#10b981",
    bg: "rgba(16,185,129,0.08)",
    glow: "rgba(16,185,129,0.3)",
    label: "WALKING",
    icon: "🚶",
  },
  Running: {
    color: "#ff4757",
    bg: "rgba(255,71,87,0.08)",
    glow: "rgba(255,71,87,0.3)",
    label: "RUNNING",
    icon: "🏃",
  },
};

// ─── Insight Icon Map ───────────────────────────────────────────────────
function InsightIcon({ type }: { type: HealthInsight["type"] }) {
  switch (type) {
    case "warning":
      return <AlertTriangle className="w-4 h-4 text-amber-500" />;
    case "success":
      return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    default:
      return <Info className="w-4 h-4 text-blue-400" />;
  }
}

export default function HealthPage() {
  const tracker = useHealthTracker();
  const config = statusConfig[tracker.status];

  // Manual input form state
  const [manualType, setManualType] = useState<"steps" | "workout">("steps");
  const [manualValue, setManualValue] = useState("");
  const [manualLabel, setManualLabel] = useState("");

  const handleManualSubmit = () => {
    const val = parseInt(manualValue, 10);
    if (!val || val <= 0) return;
    tracker.addManualEntry(
      manualType,
      val,
      manualLabel || (manualType === "steps" ? "Manual Steps" : "Workout")
    );
    setManualValue("");
    setManualLabel("");
  };

  return (
    <>
      <DashboardHeader title="HEALTH TRACKER" subtitle="Movement & Vitals Monitor" />

      {/* ─── Permission Denied Banner ──────────────────────────────── */}
      {tracker.permissionDenied && (
        <MechanicalCard className="p-5 mb-0 border-l-4 border-amber-500" withScrews={false}>
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-sm font-bold text-foreground">Location Access Denied</p>
              <p className="text-xs text-muted-fg mt-1">
                Enable location permissions in your browser settings to use GPS tracking.
                Manual input is still available below.
              </p>
            </div>
          </div>
        </MechanicalCard>
      )}

      {/* ─── Hero: Status + Control ───────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-5">
          <MechanicalCard className="p-8 flex flex-col items-center" withScrews>
            {/* Status label */}
            <div className="w-full flex justify-between items-center mb-6">
              <span className="text-[10px] font-mono tracking-widest font-bold text-muted-fg uppercase">
                Movement Sensor
              </span>
              <span
                className="px-2 py-0.5 rounded shadow-recessed text-[10px] font-mono font-bold tracking-widest"
                style={{ color: config.color, backgroundColor: config.bg }}
              >
                {tracker.isTracking ? "ACTIVE" : "OFF_LINE"}
              </span>
            </div>

            {/* Big status ring */}
            <div className="relative mb-8">
              {/* Outer glow */}
              <div
                className="absolute inset-0 rounded-full transition-all duration-1000"
                style={{
                  boxShadow: tracker.isTracking
                    ? `0 0 40px 10px ${config.glow}, 0 0 80px 20px ${config.glow}`
                    : "none",
                }}
              />
              {/* Ring */}
              <div
                className="relative w-40 h-40 rounded-full bg-background shadow-recessed flex items-center justify-center transition-all duration-500"
                style={{
                  boxShadow: tracker.isTracking
                    ? `inset 4px 4px 8px #babecc, inset -4px -4px 8px #ffffff, 0 0 20px 4px ${config.glow}`
                    : undefined,
                }}
              >
                <div className="flex flex-col items-center gap-1">
                  <span className="text-5xl">{config.icon}</span>
                  <span
                    className="text-xs font-mono font-bold tracking-[0.2em] uppercase"
                    style={{ color: config.color }}
                  >
                    {config.label}
                  </span>
                  {tracker.speed !== null && tracker.isTracking && (
                    <span className="text-[10px] font-mono text-muted-fg">
                      {(tracker.speed * 3.6).toFixed(1)} km/h
                    </span>
                  )}
                </div>
              </div>
              {/* Pulse rings when tracking */}
              {tracker.isTracking && tracker.status !== "Idle" && (
                <>
                  <div
                    className="absolute inset-0 rounded-full animate-health-ping"
                    style={{ borderColor: config.color, border: "2px solid" }}
                  />
                  <div
                    className="absolute inset-0 rounded-full animate-health-ping-delay"
                    style={{ borderColor: config.color, border: "1px solid" }}
                  />
                </>
              )}
            </div>

            {/* Start / Stop button */}
            {tracker.gpsAvailable && !tracker.permissionDenied ? (
              <PhysicalButton
                variant={tracker.isTracking ? "secondary" : "primary"}
                className="w-full text-xs"
                onClick={tracker.isTracking ? tracker.stopTracking : tracker.startTracking}
              >
                {tracker.isTracking ? (
                  <>
                    <Square className="w-4 h-4" /> STOP TRACKING
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" /> START TRACKING
                  </>
                )}
              </PhysicalButton>
            ) : (
              <div className="text-xs font-mono text-muted-fg text-center px-4 py-3 rounded-lg shadow-recessed bg-background">
                GPS unavailable — use manual input below
              </div>
            )}

            {/* GPS Coordinates */}
            {tracker.lat !== null && tracker.lng !== null && (
              <div className="w-full mt-6 p-4 rounded-xl bg-background shadow-recessed">
                <div className="flex items-center gap-2 mb-3">
                  <Crosshair className="w-3.5 h-3.5 text-accent" />
                  <span className="text-[10px] font-mono font-bold text-muted-fg tracking-widest uppercase">
                    GPS Lock
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-[10px] font-mono text-muted-fg block">LAT</span>
                    <span className="text-sm font-mono font-bold text-foreground">
                      {tracker.lat.toFixed(6)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-mono text-muted-fg block">LNG</span>
                    <span className="text-sm font-mono font-bold text-foreground">
                      {tracker.lng.toFixed(6)}
                    </span>
                  </div>
                </div>
                {tracker.accuracy !== null && (
                  <div className="mt-2 flex items-center gap-2">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{
                        backgroundColor:
                          tracker.accuracy < 10
                            ? "#10b981"
                            : tracker.accuracy < 30
                            ? "#f59e0b"
                            : "#ff4757",
                      }}
                    />
                    <span className="text-[10px] font-mono text-muted-fg">
                      ±{Math.round(tracker.accuracy)}m accuracy
                    </span>
                  </div>
                )}
              </div>
            )}
          </MechanicalCard>
        </div>

        {/* ─── Right Column: Stats + Insights ─────────────────────── */}
        <div className="lg:col-span-7 space-y-8">
          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
            {/* Distance */}
            <MechanicalCard className="p-5" withScrews={false}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-background shadow-recessed flex items-center justify-center">
                  <Route className="w-4 h-4 text-accent" />
                </div>
              </div>
              <span className="text-2xl font-extrabold text-foreground font-mono drop-shadow-[0_1px_0_#ffffff]">
                {tracker.distance.toFixed(2)}
              </span>
              <span className="text-[10px] font-mono font-bold text-muted-fg tracking-widest ml-1">
                KM
              </span>
              <p className="text-[10px] font-mono font-bold text-muted-fg tracking-widest mt-2 uppercase">
                Distance
              </p>
            </MechanicalCard>

            {/* Active Time */}
            <MechanicalCard className="p-5" withScrews={false}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-background shadow-recessed flex items-center justify-center">
                  <Timer className="w-4 h-4 text-emerald-500" />
                </div>
              </div>
              <span className="text-2xl font-extrabold text-foreground font-mono drop-shadow-[0_1px_0_#ffffff]">
                {formatTime(tracker.activeTime)}
              </span>
              <p className="text-[10px] font-mono font-bold text-muted-fg tracking-widest mt-2 uppercase">
                Active Time
              </p>
            </MechanicalCard>

            {/* Sedentary Time */}
            <MechanicalCard className="p-5" withScrews={false}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-background shadow-recessed flex items-center justify-center">
                  <Armchair className="w-4 h-4 text-amber-500" />
                </div>
              </div>
              <span className="text-2xl font-extrabold text-foreground font-mono drop-shadow-[0_1px_0_#ffffff]">
                {formatTime(tracker.sedentaryTime)}
              </span>
              <p className="text-[10px] font-mono font-bold text-muted-fg tracking-widest mt-2 uppercase">
                Sedentary
              </p>
            </MechanicalCard>

            {/* Steps */}
            <MechanicalCard className="p-5" withScrews={false}>
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg bg-background shadow-recessed flex items-center justify-center">
                  <Footprints className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <span className="text-2xl font-extrabold text-foreground font-mono drop-shadow-[0_1px_0_#ffffff]">
                {tracker.estimatedSteps.toLocaleString()}
              </span>
              <p className="text-[10px] font-mono font-bold text-muted-fg tracking-widest mt-2 uppercase">
                Est. Steps
              </p>
            </MechanicalCard>
          </div>

          {/* Active Ratio Bar */}
          <MechanicalCard className="p-6" withScrews={false}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-accent" />
                <span className="text-[10px] font-mono font-bold text-muted-fg tracking-widest uppercase">
                  Active vs Sedentary
                </span>
              </div>
              <span className="text-[10px] font-mono font-bold text-foreground">
                {tracker.activeTime + tracker.sedentaryTime > 0
                  ? Math.round(
                      (tracker.activeTime / (tracker.activeTime + tracker.sedentaryTime)) * 100
                    )
                  : 0}
                % ACTIVE
              </span>
            </div>
            <div className="h-4 rounded-full bg-background shadow-recessed overflow-hidden p-0.5 flex">
              <div
                className="h-full rounded-full bg-emerald-500 transition-all duration-1000 shadow-card"
                style={{
                  width: `${
                    tracker.activeTime + tracker.sedentaryTime > 0
                      ? (tracker.activeTime / (tracker.activeTime + tracker.sedentaryTime)) * 100
                      : 0
                  }%`,
                  minWidth: tracker.activeTime > 0 ? "8px" : "0",
                }}
              />
              <div
                className="h-full rounded-full bg-amber-400/60 transition-all duration-1000 flex-1"
                style={{ minWidth: tracker.sedentaryTime > 0 ? "8px" : "0" }}
              />
            </div>
            <div className="flex justify-between mt-2">
              <span className="text-[10px] font-mono text-emerald-600 font-bold">
                ● Active {formatTime(tracker.activeTime)}
              </span>
              <span className="text-[10px] font-mono text-amber-600 font-bold">
                ● Idle {formatTime(tracker.sedentaryTime)}
              </span>
            </div>
          </MechanicalCard>

          {/* Smart Insights */}
          {tracker.insights.length > 0 && (
            <MechanicalCard className="p-6" withVents>
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-accent" />
                  <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">
                    Smart Insights
                  </h3>
                </div>
                <span className="text-[10px] text-muted-fg font-mono font-bold px-2 py-0.5 rounded shadow-recessed">
                  {tracker.insights.length} ALERTS
                </span>
              </div>
              <div className="space-y-3">
                {tracker.insights.map((insight) => (
                  <div
                    key={insight.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-background shadow-recessed hover:shadow-card transition-all"
                  >
                    <div className="w-8 h-8 rounded-lg bg-background shadow-floating flex items-center justify-center shrink-0 mt-0.5">
                      <InsightIcon type={insight.type} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-foreground">{insight.title}</p>
                      <p className="text-xs text-muted-fg mt-1">{insight.description}</p>
                    </div>
                    <span className="text-lg">{insight.icon}</span>
                  </div>
                ))}
              </div>
            </MechanicalCard>
          )}
        </div>
      </div>

      {/* ─── Bottom Row: Manual Input + Timeline ──────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        {/* Manual Input */}
        <MechanicalCard className="p-6" withScrews>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
            <div className="flex items-center gap-2">
              <PlusCircle className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">
                Manual Input
              </h3>
            </div>
            <span className="text-[10px] text-muted-fg font-mono font-bold tracking-widest">Override</span>
          </div>

          {/* Type toggle */}
          <div className="flex gap-3 mb-5">
            <button
              onClick={() => setManualType("steps")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold font-mono uppercase tracking-widest transition-all ${
                manualType === "steps"
                  ? "bg-background shadow-recessed text-accent"
                  : "bg-background shadow-card text-muted-fg hover:text-foreground"
              }`}
            >
              <Footprints className="w-4 h-4" />
              Steps
            </button>
            <button
              onClick={() => setManualType("workout")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold font-mono uppercase tracking-widest transition-all ${
                manualType === "workout"
                  ? "bg-background shadow-recessed text-accent"
                  : "bg-background shadow-card text-muted-fg hover:text-foreground"
              }`}
            >
              <Dumbbell className="w-4 h-4" />
              Workout
            </button>
          </div>

          {/* Input fields */}
          <div className="space-y-4">
            <div>
              <label className="text-[10px] font-mono font-bold text-muted-fg tracking-widest uppercase block mb-2">
                {manualType === "steps" ? "Step Count" : "Duration (minutes)"}
              </label>
              <RecessedInput
                type="number"
                placeholder={manualType === "steps" ? "e.g. 2500" : "e.g. 30"}
                value={manualValue}
                onChange={(e) => setManualValue(e.target.value)}
                min="0"
              />
            </div>
            <div>
              <label className="text-[10px] font-mono font-bold text-muted-fg tracking-widest uppercase block mb-2">
                Label (optional)
              </label>
              <RecessedInput
                type="text"
                placeholder={manualType === "steps" ? "Morning walk" : "Gym session"}
                value={manualLabel}
                onChange={(e) => setManualLabel(e.target.value)}
              />
            </div>
            <PhysicalButton variant="primary" className="w-full text-xs" onClick={handleManualSubmit}>
              <PlusCircle className="w-4 h-4" />
              LOG {manualType === "steps" ? "STEPS" : "WORKOUT"}
            </PhysicalButton>
          </div>

          {/* Manual entries list */}
          {tracker.manualEntries.length > 0 && (
            <div className="mt-5 space-y-2">
              <span className="text-[10px] font-mono font-bold text-muted-fg tracking-widest uppercase">
                Manual Entries
              </span>
              {tracker.manualEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-background shadow-recessed"
                >
                  <span className="text-lg">{entry.type === "steps" ? "👟" : "🏋️"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{entry.label}</p>
                    <span className="text-[10px] font-mono text-accent font-bold">
                      {entry.type === "steps"
                        ? `${entry.value.toLocaleString()} steps`
                        : `${entry.value} min`}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-muted-fg font-bold">{entry.time}</span>
                </div>
              ))}
            </div>
          )}
        </MechanicalCard>

        {/* Movement Timeline */}
        <MechanicalCard className="p-6" withScrews>
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-accent" />
              <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">
                Movement Log
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-fg font-mono font-bold px-2 py-0.5 rounded shadow-recessed">
                {tracker.timeline.length} EVENTS
              </span>
              {(tracker.timeline.length > 0 || tracker.manualEntries.length > 0) && (
                <button
                  onClick={tracker.resetToday}
                  className="p-1.5 rounded-lg bg-background shadow-card hover:shadow-floating text-muted-fg hover:text-accent transition-all"
                  title="Reset today's data"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {tracker.timeline.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 rounded-full bg-background shadow-recessed flex items-center justify-center mb-4">
                  <MapPin className="w-6 h-6 text-muted-fg/40" />
                </div>
                <p className="text-sm font-bold text-muted-fg">No movement recorded</p>
                <p className="text-xs text-muted-fg/60 mt-1 max-w-[200px]">
                  Start tracking to see your movement timeline
                </p>
              </div>
            ) : (
              tracker.timeline.map((entry, i) => {
                const entryConfig = statusConfig[entry.status];
                return (
                  <div
                    key={entry.id}
                    className="group flex items-center gap-3 p-3 rounded-lg bg-background shadow-recessed hover:shadow-card transition-all"
                    style={{
                      animationDelay: `${i * 50}ms`,
                    }}
                  >
                    {/* Status dot */}
                    <div className="flex flex-col items-center gap-1">
                      <div
                        className="w-3 h-3 rounded-full shadow-card"
                        style={{ backgroundColor: entryConfig.color }}
                      />
                      {i < tracker.timeline.length - 1 && (
                        <div className="w-px h-6 bg-muted-bg" />
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{entry.status}</span>
                        <span
                          className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded shadow-recessed tracking-widest"
                          style={{ color: entryConfig.color }}
                        >
                          +{(entry.distanceDelta * 1000).toFixed(0)}m
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-muted-fg">
                        {entry.lat.toFixed(4)}, {entry.lng.toFixed(4)}
                      </span>
                    </div>

                    {/* Time */}
                    <span className="text-[10px] font-mono font-bold text-muted-fg tracking-widest shrink-0">
                      {entry.time}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </MechanicalCard>
      </div>
    </>
  );
}
