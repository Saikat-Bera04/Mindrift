import { v } from "convex/values";
import { query } from "../_generated/server";

// ─── Get latest scores for current user ─────────────────────────
export const getLatestScores = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    const latestScore = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(1);

    return latestScore[0] ?? null;
  },
});

// ─── Get score history for trend charts ─────────────────────────
export const getScoreHistory = query({
  args: {
    days: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return [];

    const days = args.days ?? 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0]!;

    return await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", user._id).gte("date", startDateStr)
      )
      .order("asc")
      .take(days);
  },
});

// ─── Get detailed score breakdown (explainability) ───────────────
export const getScoreBreakdown = query({
  args: {
    date: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    const score = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", user._id).eq("date", args.date)
      )
      .unique();

    if (!score) return null;

    // Build human-readable explanations
    const explanations: string[] = [];

    if (score.breakdown.stress.nightUsageScore > 40) {
      explanations.push(
        "Significant late-night screen usage detected, contributing to elevated stress."
      );
    }
    if (score.breakdown.stress.lowBreakFrequency > 60) {
      explanations.push(
        "You're not taking enough breaks. The recommended frequency is one every 50 minutes."
      );
    }
    if (score.breakdown.focus.tabSwitchRate < 50) {
      explanations.push(
        "Frequent tab switching is reducing your focus score. Try closing unneeded tabs."
      );
    }
    if (score.breakdown.balance.movementScore < 40) {
      explanations.push(
        "Low physical movement today. Even a short walk can improve your balance score."
      );
    }
    if (score.breakdown.fatigue.sessionLengthScore > 50) {
      explanations.push(
        "Very long uninterrupted sessions are contributing to fatigue. Set a timer for breaks."
      );
    }
    if (score.focus > 75) {
      explanations.push("Excellent focus today — keep up the good work!");
    }

    return {
      ...score,
      explanations,
      ruleVersion: score.ruleVersion,
    };
  },
});
