"use client";

import { useState, useCallback, useEffect } from "react";
import { getBackendOrigin } from "@/lib/backend-url";
import { useAuth } from "@clerk/nextjs";

const API_BASE = `${getBackendOrigin()}/stress`;

export interface StressFactor {
  score: number;
  impact: "high" | "medium" | "low";
  details: string;
}

export interface StressAnalysis {
  stressLevel: number;
  confidence: number;
  factors: {
    sleep: StressFactor;
    physical: StressFactor;
    digital: StressFactor;
    emotional: StressFactor;
  };
  recommendations: string[];
  motivationalTip: string;
  trend: "improving" | "stable" | "declining" | "unknown";
}

export interface StressHistoryEntry {
  id: string;
  date: string;
  stressLevel: number;
  factors: StressAnalysis["factors"];
  recommendations: string[];
  motivationalTip: string;
}

export interface QuickCheckResult {
  estimatedStress: number;
  message: string;
  tip: string;
}

export interface UseStressReturn {
  analysis: StressAnalysis | null;
  history: StressHistoryEntry[];
  trend: "improving" | "stable" | "declining" | "unknown";
  isLoading: boolean;
  error: Error | null;
  dataPoints: {
    moods: number;
    healthMetrics: number;
    activities: number;
    browserEvents: number;
  } | null;
  fetchAnalysis: () => Promise<void>;
  fetchHistory: (days?: number) => Promise<void>;
  quickCheck: (data: { currentMood: number; sleepLastNight: number; stressFeel: number }) => Promise<QuickCheckResult | null>;
}

export function useStress(): UseStressReturn {
  const [analysis, setAnalysis] = useState<StressAnalysis | null>(null);
  const [history, setHistory] = useState<StressHistoryEntry[]>([]);
  const [trend, setTrend] = useState<"improving" | "stable" | "declining" | "unknown">("unknown");
  const [dataPoints, setDataPoints] = useState<UseStressReturn["dataPoints"]>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const { getToken } = useAuth();

  const fetchAnalysis = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/analysis`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      const data = await response.json();
      
      if (data.success) {
        setAnalysis(data.analysis);
        setDataPoints(data.metrics.dataPoints);
      }
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Failed to fetch stress analysis");
      setError(error);
      console.error("Stress analysis error:", error);
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  const fetchHistory = useCallback(async (days = 30) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/history?days=${days}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (!response.ok) {
        throw new Error("Failed to fetch stress history");
      }

      const data = await response.json();
      setHistory(data.history);
      setTrend(data.trend);
    } catch (err) {
      console.error("Stress history error:", err);
    }
  }, [getToken]);

  const quickCheck = useCallback(async (checkData: { currentMood: number; sleepLastNight: number; stressFeel: number }) => {
    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE}/quick-check`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(checkData),
      });

      if (!response.ok) {
        throw new Error("Quick check failed");
      }

      const data = await response.json();
      return data.quickAssessment as QuickCheckResult;
    } catch (err) {
      console.error("Quick check error:", err);
      return null;
    }
  }, [getToken]);

  // Auto-fetch on mount
  useEffect(() => {
    fetchAnalysis();
    fetchHistory();
  }, [fetchAnalysis, fetchHistory]);

  return {
    analysis,
    history,
    trend,
    isLoading,
    error,
    dataPoints,
    fetchAnalysis,
    fetchHistory,
    quickCheck,
  };
}
