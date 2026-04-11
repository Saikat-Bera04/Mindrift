import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { SCORE_THRESHOLDS } from "../lib/constants";

// ─── Generate insights after daily scoring ──────────────────────
// Detects patterns and creates human-readable behavioral insights
export const generateForUser = internalMutation({
  args: {
    userId: v.id("users"),
    date: v.string(),
  },
  handler: async (ctx, args) => {
    // Get today's score
    const todayScore = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .unique();

    if (!todayScore) return { generated: 0 };

    // Get recent scores for trend analysis (last 7 days)
    const weekAgo = new Date(args.date);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentScores = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) =>
        q
          .eq("userId", args.userId)
          .gte("date", weekAgo.toISOString().split("T")[0]!)
      )
      .take(7);

    const insights: Array<{
      type: "warning" | "info" | "success";
      title: string;
      description: string;
      impact: "high" | "medium" | "low";
      relatedScoreField?: string;
    }> = [];

    // ── Stress Alerts ─────────────────────────────────────────
    if (todayScore.stress > SCORE_THRESHOLDS.critical) {
      insights.push({
        type: "warning",
        title: "High Stress Level Detected",
        description: `Your stress score reached ${todayScore.stress}. Consider taking a breathing break or stepping away from screens for a few minutes.`,
        impact: "high",
        relatedScoreField: "stress",
      });
    }

    // ── Focus Insights ────────────────────────────────────────
    if (todayScore.focus > 80) {
      insights.push({
        type: "success",
        title: "Excellent Focus Today!",
        description: `Your focus score hit ${todayScore.focus} — that's outstanding. You maintained deep concentration with minimal distractions.`,
        impact: "low",
        relatedScoreField: "focus",
      });
    } else if (todayScore.focus < SCORE_THRESHOLDS.moderate) {
      insights.push({
        type: "warning",
        title: "Focus Could Use a Boost",
        description:
          "Frequent context switching may be reducing your focus. Try closing unnecessary tabs and silencing notifications during deep work.",
        impact: "medium",
        relatedScoreField: "focus",
      });
    }

    // ── Fatigue Warnings ──────────────────────────────────────
    if (todayScore.fatigue > SCORE_THRESHOLDS.high) {
      insights.push({
        type: "warning",
        title: "Fatigue Building Up",
        description:
          "Long sessions without breaks are contributing to mental fatigue. The 50/10 rule (50 min work, 10 min rest) can help.",
        impact: "high",
        relatedScoreField: "fatigue",
      });
    }

    // ── Balance Insights ──────────────────────────────────────
    if (todayScore.balance > 75) {
      insights.push({
        type: "success",
        title: "Well-Balanced Day",
        description:
          "Great mix of productive work and physical movement today. This balance supports long-term wellbeing.",
        impact: "low",
        relatedScoreField: "balance",
      });
    } else if (
      todayScore.breakdown.balance.movementScore < 30
    ) {
      insights.push({
        type: "info",
        title: "Movement Reminder",
        description:
          "You've been mostly stationary today. Even a 10-minute walk can significantly improve your balance and reduce stress.",
        impact: "medium",
        relatedScoreField: "balance",
      });
    }

    // ── Trend-based Insights (need 3+ days) ───────────────────
    if (recentScores.length >= 3) {
      // Stress trend
      const recentStress = recentScores.slice(-3);
      const stressRising = recentStress.every(
        (s, i) =>
          i === 0 ||
          s.stress >= (recentStress[i - 1]?.stress ?? 0)
      );
      if (stressRising && todayScore.stress > SCORE_THRESHOLDS.moderate) {
        insights.push({
          type: "warning",
          title: "Rising Stress Trend",
          description: `Your stress has been increasing for ${recentStress.length} consecutive days. Consider reviewing your schedule and adding more breaks.`,
          impact: "high",
          relatedScoreField: "stress",
        });
      }

      // Focus improving
      const recentFocus = recentScores.slice(-3);
      const focusImproving = recentFocus.every(
        (s, i) =>
          i === 0 ||
          s.focus >= (recentFocus[i - 1]?.focus ?? 0)
      );
      if (focusImproving && todayScore.focus > 60) {
        insights.push({
          type: "success",
          title: "Focus on the Rise!",
          description:
            "Your focus has improved consistently over the last few days. Keep up whatever you're doing!",
          impact: "low",
          relatedScoreField: "focus",
        });
      }

      // Night usage correlation
      const avgNightUsage =
        recentScores.reduce(
          (sum, s) => sum + s.breakdown.stress.nightUsageScore,
          0
        ) / recentScores.length;
      if (avgNightUsage > 40) {
        insights.push({
          type: "info",
          title: "Late Night Usage Pattern",
          description:
            "Regular late-night screen usage is correlated with higher stress and lower focus the next day. Consider a digital sunset routine.",
          impact: "medium",
          relatedScoreField: "stress",
        });
      }
    }

    // Store insights
    let generated = 0;
    for (const insight of insights) {
      await ctx.db.insert("insights", {
        userId: args.userId,
        date: args.date,
        type: insight.type,
        title: insight.title,
        description: insight.description,
        impact: insight.impact,
        read: false,
        relatedScoreField: insight.relatedScoreField,
      });
      generated++;
    }

    return { generated };
  },
});

// ─── Generate insights for all users (cron) ─────────────────────
export const generateAllDaily = internalMutation({
  args: {
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date = args.date ?? new Date().toISOString().split("T")[0]!;
    const users = await ctx.db.query("users").take(100);

    let total = 0;
    for (const user of users) {
      const result: { generated: number } = await ctx.runMutation(
        internal.insights.generate.generateForUser,
        {
          userId: user._id,
          date,
        }
      );
      total += result.generated;
    }

    return { total, date };
  },
});
