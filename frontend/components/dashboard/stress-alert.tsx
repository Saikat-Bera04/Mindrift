"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Phone, Mail, MapPin, Star, Clock, DollarSign, AlertCircle } from "lucide-react";
import { motion } from "framer-motion";
import { getBackendOrigin } from "@/lib/backend-url";

interface StressData {
  stressLevel: number;
  status: string;
  suggestions: {
    immediate: string;
    medium_term: string;
    long_term: string;
    when_to_seek_help: string;
  };
  recommendedTherapists: any[];
}

interface Therapist {
  id: string;
  name: string;
  specialization: string;
  phone: string;
  email: string;
  experience: number;
  rating: number;
  sessionFee: number;
  type: string;
  description: string;
  city: string;
}

export function StressAlertWidget() {
  const [stressData, setStressData] = useState<StressData | null>(null);
  const [showTherapists, setShowTherapists] = useState(false);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStressData();
  }, []);

  const fetchStressData = async () => {
    try {
      const token = await fetch(`${getBackendOrigin()}/api/users/current`, {
        headers: { "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}` }
      }).then(r => r.json());

      const response = await fetch(`${getBackendOrigin()}/stress-management/current`, {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token") || ""}`
        }
      });
      const data = await response.json();

      if (response.ok) {
        setStressData(data);
        if (data.recommendedTherapists) {
          setTherapists(data.recommendedTherapists);
        }
      }
    } catch (error) {
      console.error("Failed to fetch stress data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-sm text-slate-500">Loading...</div>;

  if (!stressData || stressData.stressLevel < 6) {
    return null; // Don't show widget if stress is low
  }

  const isHighStress = stressData.stressLevel >= 8;
  const isCritical = stressData.stressLevel >= 9;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border-2 p-4 mb-6 ${
        isCritical
          ? "bg-red-50 border-red-300"
          : isHighStress
            ? "bg-orange-50 border-orange-300"
            : "bg-yellow-50 border-yellow-300"
      }`}
    >
      <div className="flex items-start gap-3 mb-3">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
          isCritical ? "text-red-600" : isHighStress ? "text-orange-600" : "text-yellow-600"
        }`} />
        <div className="flex-1">
          <h3 className={`font-bold text-sm ${
            isCritical ? "text-red-900" : isHighStress ? "text-orange-900" : "text-yellow-900"
          }`}>
            Stress Alert: {stressData.status}
          </h3>
          <p className={`text-xs mt-1 ${
            isCritical ? "text-red-800" : isHighStress ? "text-orange-800" : "text-yellow-800"
          }`}>
            Your stress level is {stressData.stressLevel.toFixed(1)}/10
            {isCritical && " - Please consider reaching out to a professional"}
          </p>
        </div>
      </div>

      {stressData.suggestions && (
        <div className="mt-3 space-y-2 text-xs">
          <div>
            <p className="font-semibold mb-1">💡 Immediate (Next 30 mins):</p>
            <p className={isHighStress ? "text-orange-700" : "text-yellow-700"}>
              {stressData.suggestions.immediate}
            </p>
          </div>
          <div>
            <p className="font-semibold mb-1">📅 This Week:</p>
            <p className={isHighStress ? "text-orange-700" : "text-yellow-700"}>
              {stressData.suggestions.medium_term}
            </p>
          </div>
        </div>
      )}

      {therapists.length > 0 && isHighStress && (
        <>
          <button
            onClick={() => setShowTherapists(!showTherapists)}
            className={`mt-4 w-full py-2 px-3 rounded-lg font-semibold text-sm transition ${
              isCritical
                ? "bg-red-600 text-white hover:bg-red-700"
                : "bg-orange-600 text-white hover:bg-orange-700"
            }`}
          >
            {showTherapists ? "Hide" : "View"} Recommended Therapists
          </button>

          {showTherapists && (
            <div className="mt-3 space-y-2 max-h-96 overflow-y-auto">
              {therapists.map((therapist) => (
                <TherapistCard key={therapist.id} therapist={therapist} />
              ))}
            </div>
          )}
        </>
      )}

      {isHighStress && (
        <p className={`text-xs mt-3 font-semibold ${
          isCritical ? "text-red-700" : "text-orange-700"
        }`}>
          Mental Wellness Resources: Call 9152987479 (24/7) | Crisis Chat: mindrift.onrender.com/crisis
        </p>
      )}
    </motion.div>
  );
}

function TherapistCard({ therapist }: { therapist: Therapist }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="bg-white p-3 rounded-lg border border-slate-200 text-xs"
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-bold text-slate-900">{therapist.name}</p>
          <p className="text-slate-600">{therapist.specialization}</p>
        </div>
        <div className="flex items-center gap-1 bg-yellow-100 px-2 py-1 rounded">
          <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
          <span className="font-semibold">{therapist.rating}</span>
        </div>
      </div>

      <div className="space-y-1 text-slate-700 mb-2">
        <div className="flex items-center gap-2">
          <Phone className="w-3 h-3 text-blue-600" />
          <span>{therapist.phone}</span>
        </div>
        <div className="flex items-center gap-2">
          <Mail className="w-3 h-3 text-blue-600" />
          <span>{therapist.email}</span>
        </div>
        <div className="flex items-center gap-2">
          <MapPin className="w-3 h-3 text-blue-600" />
          <span>{therapist.city}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-blue-600" />
          <span>{therapist.experience} years experience</span>
        </div>
        <div className="flex items-center gap-2">
          <DollarSign className="w-3 h-3 text-green-600" />
          <span>₹{therapist.sessionFee} per session</span>
        </div>
      </div>

      <div className="flex gap-2 pt-2 border-t">
        <button className="flex-1 text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700 transition">
          Call
        </button>
        <button className="flex-1 text-xs bg-green-600 text-white py-1 rounded hover:bg-green-700 transition">
          Email
        </button>
      </div>
    </motion.div>
  );
}

// Demo data display component for judge/demo
export function DemoDataDisplay() {
  const [demoData, setDemoData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDemoData();
  }, []);

  const fetchDemoData = async () => {
    try {
      const response = await fetch(`${getBackendOrigin()}/stress-management/demo-data`);
      const data = await response.json();
      setDemoData(data);
    } catch (error) {
      console.error("Failed to fetch demo data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading demo data...</div>;
  if (!demoData) return null;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* User Profile */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow">
        <h2 className="text-2xl font-bold mb-4">👤 User Profile</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-slate-600">Name</p>
            <p className="font-bold">{demoData.user.name}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Age</p>
            <p className="font-bold">{demoData.user.age}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Status</p>
            <p className="font-bold">{demoData.user.currentStatus}</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Sleep Hours</p>
            <p className="font-bold">{demoData.user.sleepHours}h/day</p>
          </div>
        </div>
      </div>

      {/* Stress Assessment */}
      <div className={`rounded-lg border-2 p-6 shadow ${
        demoData.stressData.currentLevel >= 8
          ? "bg-red-50 border-red-300"
          : "bg-orange-50 border-orange-300"
      }`}>
        <h2 className="text-2xl font-bold mb-4">📊 Stress Assessment</h2>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <p className="text-sm text-slate-600">Current Level</p>
            <p className="text-4xl font-bold text-red-600">{demoData.stressData.currentLevel}</p>
            <p className="text-sm text-slate-600">/10</p>
          </div>
          <div>
            <p className="text-sm text-slate-600">Status</p>
            <p className="text-2xl font-bold text-red-600">{demoData.stressData.status}</p>
            <p className="text-sm mt-2">Trend: ↗️ Increasing</p>
          </div>
        </div>

        <h3 className="font-bold mb-2">Stress Factors</h3>
        <div className="space-y-2">
          {Object.entries(demoData.stressData.factors).map(([key, factor]: any) => (
            <div key={key} className="bg-white p-3 rounded">
              <div className="flex items-center justify-between">
                <span className="font-semibold capitalize">{key}</span>
                <span className={`px-2 py-1 rounded text-xs font-bold ${
                  factor.impact === "high" ? "bg-red-200 text-red-800" :
                  factor.impact === "medium" ? "bg-yellow-200 text-yellow-800" :
                  "bg-green-200 text-green-800"
                }`}>
                  {factor.impact.toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-slate-700">{factor.details}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="bg-blue-50 rounded-lg border border-blue-300 p-6 shadow">
        <h2 className="text-2xl font-bold mb-4">💡 AI-Powered Suggestions</h2>
        <div className="space-y-3">
          <div>
            <p className="font-semibold text-blue-900 mb-1">⚡ Immediate (Next 30 mins)</p>
            <p>{demoData.suggestions.immediate}</p>
          </div>
          <div>
            <p className="font-semibold text-blue-900 mb-1">📅 Medium Term (This Week)</p>
            <p>{demoData.suggestions.medium_term}</p>
          </div>
          <div>
            <p className="font-semibold text-blue-900 mb-1">🎯 Long Term</p>
            <p>{demoData.suggestions.long_term}</p>
          </div>
        </div>
      </div>

      {/* Recommended Therapists */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow">
        <h2 className="text-2xl font-bold mb-4">👨‍⚕️ Recommended Therapists</h2>
        <div className="space-y-3">
          {demoData.recommendedTherapists.map((therapist: Therapist) => (
            <motion.div
              key={therapist.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-slate-50 p-4 rounded-lg border border-slate-200"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-bold text-lg">{therapist.name}</p>
                  <p className="text-sm text-slate-600">{therapist.specialization}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span className="font-bold">{therapist.rating}</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                <div>
                  <p className="text-slate-600">📞 {therapist.phone}</p>
                  <p className="text-slate-600">📧 {therapist.email}</p>
                </div>
                <div>
                  <p className="text-slate-600">💰 ₹{therapist.sessionFee}/session</p>
                  <p className="text-slate-600">📍 {therapist.city}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Insights */}
      <div className="bg-white rounded-lg border border-slate-200 p-6 shadow">
        <h2 className="text-2xl font-bold mb-4">🔍 AI Insights</h2>
        <div className="space-y-3">
          {demoData.insights.map((insight: any, index: number) => (
            <div key={index} className="bg-slate-50 p-4 rounded-lg border-l-4 border-blue-500">
              <p className="text-sm text-slate-600 mb-1">{insight.date}</p>
              <p className="font-semibold mb-2">{insight.insight}</p>
              <p className="text-sm text-blue-600">✓ {insight.recommendation}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wellness Score */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-300">
          <p className="text-sm text-slate-600 mb-1">Wellness Score</p>
          <p className="text-4xl font-bold text-blue-600">{demoData.wellnessScore}%</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-300">
          <p className="text-sm text-slate-600 mb-1">Improvement Potential</p>
          <p className="text-4xl font-bold text-green-600">{demoData.improvementPotential}%</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-300">
          <p className="text-sm text-slate-600 mb-1">Recovery Time</p>
          <p className="text-sm font-bold text-purple-600">{demoData.estimatedRecoveryTime}</p>
        </div>
      </div>
    </div>
  );
}
