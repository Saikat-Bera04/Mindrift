import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { XP_THRESHOLDS } from "../lib/constants";

// ─── Calculate level from XP (pure function) ────────────────────
export function calculateLevel(xp: number): number {
  let level = 1;
  for (const [lvl, threshold] of Object.entries(XP_THRESHOLDS)) {
    if (xp >= threshold) {
      level = parseInt(lvl);
    }
  }
  return level;
}

// ─── Get XP needed for next level ────────────────────────────────
export function getXpForNextLevel(currentXp: number): {
  currentLevel: number;
  nextLevel: number;
  xpNeeded: number;
  xpProgress: number;
  progressPercent: number;
} {
  const currentLevel = calculateLevel(currentXp);
  const nextLevel = currentLevel + 1;
  const currentThreshold = XP_THRESHOLDS[currentLevel] ?? 0;
  const nextThreshold = XP_THRESHOLDS[nextLevel];

  if (!nextThreshold) {
    // Max level
    return {
      currentLevel,
      nextLevel: currentLevel,
      xpNeeded: 0,
      xpProgress: 0,
      progressPercent: 100,
    };
  }

  const levelRange = nextThreshold - currentThreshold;
  const xpInLevel = currentXp - currentThreshold;
  const xpNeeded = nextThreshold - currentXp;

  return {
    currentLevel,
    nextLevel,
    xpNeeded,
    xpProgress: xpInLevel,
    progressPercent: Math.round((xpInLevel / levelRange) * 100),
  };
}

// ─── Add XP to user (internal) ──────────────────────────────────
export const addXP = internalMutation({
  args: {
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    source: v.union(
      v.literal("intervention"),
      v.literal("streak"),
      v.literal("reward"),
      v.literal("daily_login"),
      v.literal("score_improvement")
    ),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const newXp = user.xp + args.amount;
    const newLevel = calculateLevel(newXp);
    const leveledUp = newLevel > user.level;

    await ctx.db.patch(user._id, {
      xp: newXp,
      level: newLevel,
    });

    await ctx.db.insert("xpLedger", {
      userId: user._id,
      amount: args.amount,
      reason: args.reason,
      source: args.source,
    });

    return {
      newXp,
      newLevel,
      leveledUp,
    };
  },
});

// ─── Sync level from XP (call after any XP change) ──────────────
export const syncLevel = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const correctLevel = calculateLevel(user.xp);
    if (correctLevel !== user.level) {
      await ctx.db.patch(user._id, { level: correctLevel });
    }

    return { level: correctLevel, xp: user.xp };
  },
});
