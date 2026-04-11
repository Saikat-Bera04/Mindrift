import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { REWARD_CATALOG, INTERVENTION_COMPLETION_MILESTONE } from "../lib/constants";

// ─── Check and award rewards after score / streak updates ───────
export const checkAndAward = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return { awarded: [] };

    const awarded: string[] = [];

    // Helper: check if reward already earned
    async function hasReward(rewardId: string): Promise<boolean> {
      const existing = await ctx.db
        .query("rewards")
        .withIndex("by_userId_and_rewardId", (q) =>
          q.eq("userId", args.userId).eq("rewardId", rewardId)
        )
        .unique();
      return existing !== null;
    }

    // Helper: award a reward
    async function awardReward(
      rewardId: string,
      catalog: {
        name: string;
        description: string;
        xpValue: number;
        category: "streak" | "score" | "intervention" | "milestone" | "exploration";
      }
    ) {
      if (await hasReward(rewardId)) return;

      await ctx.db.insert("rewards", {
        userId: args.userId,
        rewardId,
        name: catalog.name,
        description: catalog.description,
        xpValue: catalog.xpValue,
        category: catalog.category,
        earnedAt: Date.now(),
      });

      // Award XP
      const currentUser = await ctx.db.get(args.userId);
      if (currentUser) {
        await ctx.db.patch(args.userId, {
          xp: currentUser.xp + catalog.xpValue,
        });
      }

      await ctx.db.insert("xpLedger", {
        userId: args.userId,
        amount: catalog.xpValue,
        reason: `Reward: ${catalog.name}`,
        source: "reward",
      });

      awarded.push(rewardId);
    }

    // ── Check: First Login ────────────────────────────────────
    await awardReward("FIRST_LOGIN", REWARD_CATALOG.FIRST_LOGIN);

    // ── Check: Score Improvement ──────────────────────────────
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(2);

    if (scores.length >= 2) {
      const latest = scores[0]!;
      const previous = scores[1]!;
      if (latest.overall - previous.overall >= 10) {
        await awardReward(
          "SCORE_IMPROVEMENT_10",
          REWARD_CATALOG.SCORE_IMPROVEMENT_10
        );
      }
    }

    // ── Check: Intervention milestones ────────────────────────
    const completedInterventions = await ctx.db
      .query("interventions")
      .withIndex("by_userId_and_status", (q) =>
        q.eq("userId", args.userId).eq("status", "completed")
      )
      .take(100);

    if (completedInterventions.length >= 10) {
      await awardReward(
        "INTERVENTIONS_10",
        REWARD_CATALOG.INTERVENTIONS_10
      );
    }
    if (completedInterventions.length >= 50) {
      await awardReward(
        "INTERVENTIONS_50",
        REWARD_CATALOG.INTERVENTIONS_50
      );
    }

    // ── Check: Low Stress Week ────────────────────────────────
    const weekScores = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(7);

    if (
      weekScores.length >= 7 &&
      weekScores.every((s) => s.stress < 30)
    ) {
      await awardReward("LOW_STRESS_WEEK", REWARD_CATALOG.LOW_STRESS_WEEK);
    }

    // ── Check: Perfect Balance (3 consecutive days >90) ───────
    const recentBalanceScores = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(3);

    if (
      recentBalanceScores.length >= 3 &&
      recentBalanceScores.every((s) => s.balance >= 90)
    ) {
      await awardReward(
        "PERFECT_BALANCE",
        REWARD_CATALOG.PERFECT_BALANCE
      );
    }

    // ── Check: Movement Champion (5 days with movement) ───────
    if (weekScores.length >= 5) {
      const movementDays = weekScores.filter(
        (s) => s.breakdown.balance.movementScore >= 50
      );
      if (movementDays.length >= 5) {
        await awardReward(
          "MOVEMENT_CHAMPION",
          REWARD_CATALOG.MOVEMENT_CHAMPION
        );
      }
    }

    return { awarded };
  },
});
