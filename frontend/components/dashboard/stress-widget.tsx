"use client";

import { motion } from "framer-motion";
import { 
  Brain, 
  TrendingDown,
  TrendingUp,
  Minus,
  Sparkles,
  RefreshCw,
  Moon,
  Activity,
  Smartphone,
  Heart,
  MessageCircle,
  Phone,
  AlertTriangle,
  Users
} from "lucide-react";
import Link from "next/link";
import { useStress } from "@/hooks/use-stress";
import { Button } from "@/components/ui/button";
import { MechanicalCard } from "@/components/ui/mechanics";

function getStressColor(level: number): string {
  if (level <= 3) return "text-emerald-500";
  if (level <= 5) return "text-yellow-500";
  if (level <= 7) return "text-orange-500";
  return "text-red-500";
}

function getStressBg(level: number): string {
  if (level <= 3) return "bg-emerald-500";
  if (level <= 5) return "bg-yellow-500";
  if (level <= 7) return "bg-orange-500";
  return "bg-red-500";
}

function getStressLabel(level: number): string {
  if (level <= 3) return "Low";
  if (level <= 5) return "Moderate";
  if (level <= 7) return "High";
  return "Critical";
}

const factorIcons = {
  sleep: Moon,
  physical: Activity,
  digital: Smartphone,
  emotional: Heart,
};

export function StressWidget() {
  const { analysis, trend, isLoading, fetchAnalysis } = useStress();

  if (isLoading && !analysis) {
    return (
      <MechanicalCard className="p-4">
        <div className="flex items-center justify-center h-16">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-accent"></div>
        </div>
      </MechanicalCard>
    );
  }

  if (!analysis) {
    return (
      <MechanicalCard className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent" />
            <span className="text-xs font-bold font-mono uppercase tracking-widest">AI Analysis</span>
          </div>
          <Button onClick={fetchAnalysis} variant="outline" size="sm" className="h-7 text-xs">
            Analyze
          </Button>
        </div>
      </MechanicalCard>
    );
  }

  return (
    <MechanicalCard className="p-4" withScrews>
      {/* Header */}
      <div className="flex items-center justify-between mb-3 pb-3 border-b border-muted-bg shadow-[0_1px_0_#ffffff]">
        <div className="flex items-center gap-2">
          <Brain className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-bold text-foreground font-mono uppercase tracking-widest">AI Stress Factors</h3>
        </div>
        <div className="flex items-center gap-2">
          {/* Trend */}
          {trend === "improving" && (
            <span className="text-[10px] font-mono font-bold text-emerald-600 flex items-center gap-1">
              <TrendingDown className="w-3 h-3" />
              Improving
            </span>
          )}
          {trend === "declining" && (
            <span className="text-[10px] font-mono font-bold text-red-500 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              Rising
            </span>
          )}
          {trend === "stable" && (
            <span className="text-[10px] font-mono font-bold text-yellow-600 flex items-center gap-1">
              <Minus className="w-3 h-3" />
              Stable
            </span>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-6 w-6" 
            onClick={fetchAnalysis}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3 h-3 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Factor Breakdown - Compact */}
      <div className="grid grid-cols-4 gap-2 mb-3">
        {Object.entries(analysis.factors).map(([key, factor]) => {
          const Icon = factorIcons[key as keyof typeof factorIcons];
          return (
            <div key={key} className="text-center">
              <div className={`w-7 h-7 rounded-lg bg-background shadow-recessed flex items-center justify-center mx-auto mb-1 ${getStressColor(factor.score)}`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className={`text-xs font-bold ${getStressColor(factor.score)}`}>
                {factor.score.toFixed(1)}
              </div>
              <p className="text-[9px] text-muted-fg uppercase">{key.slice(0, 4)}</p>
            </div>
          );
        })}
      </div>

      {/* AI Recommendation */}
      <div className="bg-background shadow-recessed rounded-lg p-2.5">
        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-accent flex-shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed">{analysis.recommendations[0]}</p>
        </div>
      </div>

      {/* Stress Intervention Alert */}
      <StressInterventionAlert level={analysis.stressLevel} />
    </MechanicalCard>
  );
}

function StressInterventionAlert({ level }: { level: number }) {
  // Critical stress: 8-10 - Immediate therapist connection
  if (level > 7) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30"
      >
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-red-600 uppercase tracking-wider mb-1">
              Critical Stress Level Detected
            </p>
            <p className="text-[10px] text-red-600/80 mb-2">
              Your stress level is {level.toFixed(1)}/10. Please connect with a professional therapist immediately.
            </p>
            <div className="flex gap-2">
              <a 
                href="tel:988" 
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-red-500 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-red-600 transition-colors"
              >
                <Phone className="w-3 h-3" />
                Crisis Line
              </a>
              <Link 
                href="/chat"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-background shadow-card text-red-600 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:shadow-floating transition-all"
              >
                <MessageCircle className="w-3 h-3" />
                AI Support
              </Link>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  // Elevated stress: 6-7 - Suggest friend or AI chatbot
  if (level > 5) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30"
      >
        <div className="flex items-start gap-2">
          <Users className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
              Elevated Stress Detected
            </p>
            <p className="text-[10px] text-amber-700/80 mb-2">
              Your stress level is {level.toFixed(1)}/10. Consider talking to a friend or our AI companion.
            </p>
            <div className="flex gap-2">
              <Link 
                href="/chat"
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-accent text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:bg-accent/90 transition-colors"
              >
                <MessageCircle className="w-3 h-3" />
                Talk to Diva
              </Link>
              <button 
                onClick={() => alert("Consider calling a trusted friend or family member!")}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-background shadow-card text-amber-700 rounded-lg text-[10px] font-bold uppercase tracking-wider hover:shadow-floating transition-all"
              >
                <Users className="w-3 h-3" />
                Call a Friend
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
}
