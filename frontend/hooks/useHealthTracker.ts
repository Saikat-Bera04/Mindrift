"use client";

import { useEffect, useState, useRef, useCallback } from "react";

// ─── Types ──────────────────────────────────────────────────────────────
export type MovementStatus = "Idle" | "Walking" | "Running";

export interface HealthEntry {
  id: string;
  time: string;
  status: MovementStatus;
  distanceDelta: number; // km
  lat: number;
  lng: number;
}

export interface ManualEntry {
  id: string;
  type: "steps" | "workout";
  value: number;
  label: string;
  time: string;
}

export interface HealthState {
  status: MovementStatus;
  distance: number; // km
  activeTime: number; // seconds
  sedentaryTime: number; // seconds
  estimatedSteps: number;
  lat: number | null;
  lng: number | null;
  accuracy: number | null;
  speed: number | null;
  timeline: HealthEntry[];
  manualEntries: ManualEntry[];
  isTracking: boolean;
  gpsAvailable: boolean;
  permissionDenied: boolean;
  lastUpdated: number;
}

// ─── Haversine Distance ─────────────────────────────────────────────────
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

// ─── Time Formatting ────────────────────────────────────────────────────
export function formatTime(totalSeconds: number): string {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

// ─── Storage Key ────────────────────────────────────────────────────────
function todayKey(): string {
  return `mindrift_health_${new Date().toISOString().slice(0, 10)}`;
}

function loadFromStorage(): Partial<HealthState> | null {
  try {
    const raw = localStorage.getItem(todayKey());
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function saveToStorage(state: Partial<HealthState>) {
  try {
    localStorage.setItem(todayKey(), JSON.stringify(state));
  } catch {}
}

// ─── Smart Insights ─────────────────────────────────────────────────────
export interface HealthInsight {
  id: string;
  type: "warning" | "info" | "success";
  icon: string;
  title: string;
  description: string;
}

export function generateInsights(state: HealthState): HealthInsight[] {
  const insights: HealthInsight[] = [];

  // Sedentary warning
  if (state.sedentaryTime > 7200) {
    insights.push({
      id: "sed-2h",
      type: "warning",
      icon: "⚠️",
      title: "Extended Inactivity",
      description: `You've been idle for ${formatTime(state.sedentaryTime)}. Take a short walk to refresh.`,
    });
  } else if (state.sedentaryTime > 3600) {
    insights.push({
      id: "sed-1h",
      type: "warning",
      icon: "🪑",
      title: "Prolonged Sitting",
      description: "Over an hour of inactivity. Stand up and stretch!",
    });
  }

  // Distance milestones
  if (state.distance >= 5) {
    insights.push({
      id: "dist-5k",
      type: "success",
      icon: "🏆",
      title: "5K Milestone!",
      description: "Outstanding — you've covered over 5 kilometers today.",
    });
  } else if (state.distance >= 2) {
    insights.push({
      id: "dist-2k",
      type: "success",
      icon: "🎯",
      title: "Great Progress",
      description: `${state.distance.toFixed(1)} km covered. Keep it up!`,
    });
  }

  // Active time achievements
  if (state.activeTime >= 1800) {
    insights.push({
      id: "active-30m",
      type: "success",
      icon: "💪",
      title: "30 Min Active",
      description: "You've hit the daily recommended active minutes!",
    });
  }

  // Step suggestions
  if (state.estimatedSteps < 500 && state.sedentaryTime > 1800) {
    insights.push({
      id: "low-steps",
      type: "info",
      icon: "👟",
      title: "Low Step Count",
      description: "Try a quick 10-minute walk to boost energy.",
    });
  }

  // Running detection
  if (state.status === "Running") {
    insights.push({
      id: "running",
      type: "info",
      icon: "🏃",
      title: "Running Detected",
      description: "Great workout pace! Stay hydrated.",
    });
  }

  // Balance insight
  if (state.activeTime > 0 && state.sedentaryTime > 0) {
    const ratio = state.activeTime / (state.activeTime + state.sedentaryTime);
    if (ratio > 0.4) {
      insights.push({
        id: "balance-good",
        type: "success",
        icon: "⚖️",
        title: "Healthy Balance",
        description: `${Math.round(ratio * 100)}% active ratio — excellent balance today.`,
      });
    }
  }

  return insights;
}

// ─── HOOK ───────────────────────────────────────────────────────────────
export function useHealthTracker() {
  const [state, setState] = useState<HealthState>(() => {
    const saved = typeof window !== "undefined" ? loadFromStorage() : null;
    return {
      status: "Idle" as MovementStatus,
      distance: saved?.distance ?? 0,
      activeTime: saved?.activeTime ?? 0,
      sedentaryTime: saved?.sedentaryTime ?? 0,
      estimatedSteps: saved?.estimatedSteps ?? 0,
      lat: null,
      lng: null,
      accuracy: null,
      speed: null,
      timeline: saved?.timeline ?? [],
      manualEntries: saved?.manualEntries ?? [],
      isTracking: false,
      gpsAvailable: typeof navigator !== "undefined" && "geolocation" in navigator,
      permissionDenied: false,
      lastUpdated: Date.now(),
    };
  });

  const lastPosRef = useRef<{ lat: number; lng: number } | null>(null);
  const watchIdRef = useRef<number | null>(null);
  const activeTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sedentaryTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  // ── Persist to localStorage ──
  useEffect(() => {
    const save = setTimeout(() => {
      saveToStorage({
        distance: state.distance,
        activeTime: state.activeTime,
        sedentaryTime: state.sedentaryTime,
        estimatedSteps: state.estimatedSteps,
        timeline: state.timeline,
        manualEntries: state.manualEntries,
      });
    }, 500);
    return () => clearTimeout(save);
  }, [state.distance, state.activeTime, state.sedentaryTime, state.estimatedSteps, state.timeline, state.manualEntries]);

  // ── Timer management ──
  useEffect(() => {
    // Clear existing timers
    if (activeTimerRef.current) clearInterval(activeTimerRef.current);
    if (sedentaryTimerRef.current) clearInterval(sedentaryTimerRef.current);

    if (!state.isTracking) return;

    if (state.status === "Walking" || state.status === "Running") {
      activeTimerRef.current = setInterval(() => {
        setState((prev) => ({ ...prev, activeTime: prev.activeTime + 1 }));
      }, 1000);
    } else {
      sedentaryTimerRef.current = setInterval(() => {
        setState((prev) => ({ ...prev, sedentaryTime: prev.sedentaryTime + 1 }));
      }, 1000);
    }

    return () => {
      if (activeTimerRef.current) clearInterval(activeTimerRef.current);
      if (sedentaryTimerRef.current) clearInterval(sedentaryTimerRef.current);
    };
  }, [state.status, state.isTracking]);

  // ── GPS Tracking ──
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setState((prev) => ({ ...prev, gpsAvailable: false }));
      return;
    }

    setState((prev) => ({ ...prev, isTracking: true }));

    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude, longitude, speed, accuracy } = pos.coords;
        const now = new Date();
        const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

        let newStatus: MovementStatus = "Idle";
        if (speed !== null) {
          if (speed > 2.5) newStatus = "Running";
          else if (speed > 0.5) newStatus = "Walking";
        }

        let distDelta = 0;
        if (lastPosRef.current) {
          distDelta = getDistance(
            lastPosRef.current.lat,
            lastPosRef.current.lng,
            latitude,
            longitude
          );
          // Filter out GPS jitter (ignore jumps < 2m or > 500m)
          if (distDelta < 0.002 || distDelta > 0.5) {
            distDelta = 0;
          }
        }

        lastPosRef.current = { lat: latitude, lng: longitude };

        // Estimate steps: ~1300 steps per km walking, ~1000 running
        const stepRate = newStatus === "Running" ? 1000 : 1300;
        const newSteps = Math.round(distDelta * stepRate);

        setState((prev) => {
          const newTimeline = distDelta > 0
            ? [
                {
                  id: `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                  time: timeStr,
                  status: newStatus,
                  distanceDelta: distDelta,
                  lat: latitude,
                  lng: longitude,
                },
                ...prev.timeline,
              ].slice(0, 50) // Keep last 50 entries
            : prev.timeline;

          return {
            ...prev,
            status: newStatus,
            distance: prev.distance + distDelta,
            estimatedSteps: prev.estimatedSteps + newSteps,
            lat: latitude,
            lng: longitude,
            accuracy: accuracy,
            speed: speed,
            timeline: newTimeline,
            lastUpdated: Date.now(),
          };
        });
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setState((prev) => ({ ...prev, permissionDenied: true, isTracking: false }));
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 3000,
      }
    );
  }, []);

  const stopTracking = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    lastPosRef.current = null;
    setState((prev) => ({ ...prev, isTracking: false, status: "Idle" }));
  }, []);

  // ── Manual Entry ──
  const addManualEntry = useCallback((type: "steps" | "workout", value: number, label: string) => {
    const now = new Date();
    const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });

    const entry: ManualEntry = {
      id: `manual-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      type,
      value,
      label,
      time: timeStr,
    };

    setState((prev) => ({
      ...prev,
      manualEntries: [entry, ...prev.manualEntries].slice(0, 20),
      estimatedSteps: type === "steps" ? prev.estimatedSteps + value : prev.estimatedSteps,
      activeTime: type === "workout" ? prev.activeTime + value * 60 : prev.activeTime,
    }));
  }, []);

  // ── Reset ──
  const resetToday = useCallback(() => {
    localStorage.removeItem(todayKey());
    lastPosRef.current = null;
    setState((prev) => ({
      ...prev,
      distance: 0,
      activeTime: 0,
      sedentaryTime: 0,
      estimatedSteps: 0,
      timeline: [],
      manualEntries: [],
    }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  const insights = generateInsights(state);

  return {
    ...state,
    insights,
    startTracking,
    stopTracking,
    addManualEntry,
    resetToday,
  };
}
