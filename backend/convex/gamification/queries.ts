import { v } from "convex/values";
import { query } from "../_generated/server";
import { getXpForNextLevel } from "./levels";

// ─── Get full gamification profile ──────────────────────────────
export const getProfile = query({
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

    const levelInfo = getXpForNextLevel(user.xp);

    // Get recent rewards
    const recentRewards = await ctx.db
      .query("rewards")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(10);

    // Get XP history
    const xpHistory = await ctx.db
      .query("xpLedger")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(20);

    return {
      level: user.level,
      xp: user.xp,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate,
      ...levelInfo,
      recentRewards,
      xpHistory,
    };
  },
});

// ─── Get all earned rewards ──────────────────────────────────────
export const getRewards = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return [];

    return await ctx.db
      .query("rewards")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(100);
  },
});

// ─── Get opt-in anonymous leaderboard ────────────────────────────
export const getLeaderboard = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 10;

    // Get all users who opt-in to anonymous data sharing
    // For now, return top users by XP (anonymized)
    const users = await ctx.db.query("users").take(100);

    const leaderboard = users
      .filter((u) => u.settings.privacy.shareAnonymousData)
      .map((u) => ({
        displayName: u.displayName.charAt(0) + "***",
        level: u.level,
        xp: u.xp,
        currentStreak: u.currentStreak,
      }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, limit);

    return leaderboard;
  },
});

// ─── Get XP ledger (audit trail) ────────────────────────────────
export const getXpHistory = query({
  args: {
    limit: v.optional(v.number()),
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

    return await ctx.db
      .query("xpLedger")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 50);
  },
});
