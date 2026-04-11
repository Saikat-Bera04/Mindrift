import { v } from "convex/values";
import { query } from "../_generated/server";

// ─── Get current user profile ────────────────────────────────────
export const getMe = query({
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

    return {
      _id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      level: user.level,
      xp: user.xp,
      currentStreak: user.currentStreak,
      longestStreak: user.longestStreak,
      lastActiveDate: user.lastActiveDate,
      settings: user.settings,
    };
  },
});

// ─── Get full dashboard data (aggregated view) ───────────────────
export const getDashboard = query({
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

    // Latest score
    const latestScore = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(1);

    // Score history (7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const scoreHistory = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) =>
        q
          .eq("userId", user._id)
          .gte("date", sevenDaysAgo.toISOString().split("T")[0]!)
      )
      .take(7);

    // Unread insights
    const unreadInsights = await ctx.db
      .query("insights")
      .withIndex("by_userId_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .order("desc")
      .take(5);

    // Active interventions
    const activeInterventions = await ctx.db
      .query("interventions")
      .withIndex("by_userId_and_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending")
      )
      .take(5);

    // Recent rewards
    const recentRewards = await ctx.db
      .query("rewards")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(3);

    // Latest weekly report
    const latestReport = await ctx.db
      .query("weeklyReports")
      .withIndex("by_userId_and_weekStart", (q) =>
        q.eq("userId", user._id)
      )
      .order("desc")
      .take(1);

    return {
      user: {
        displayName: user.displayName,
        level: user.level,
        xp: user.xp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
      },
      latestScore: latestScore[0] ?? null,
      scoreHistory,
      unreadInsights,
      activeInterventions,
      recentRewards,
      latestReport: latestReport[0] ?? null,
    };
  },
});
