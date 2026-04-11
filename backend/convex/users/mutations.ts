import { v } from "convex/values";
import { mutation, internalMutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { settingsValidator } from "../lib/validators";

// ─── Default settings for new users ─────────────────────────────
const DEFAULT_SETTINGS = {
  notifications: {
    dailyReport: true,
    movementReminders: true,
    focusAlerts: false,
    weeklyDigest: true,
    stressWarnings: true,
  },
  privacy: {
    shareAnonymousData: false,
    locationTracking: true,
    dataRetentionDays: 90,
  },
};

// ─── Create or update user from Clerk webhook ───────────────────
export const createOrUpdate = internalMutation({
  args: {
    clerkId: v.string(),
    tokenIdentifier: v.string(),
    email: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (existing) {
      // Update existing user
      await ctx.db.patch(existing._id, {
        email: args.email,
        displayName: args.displayName,
        tokenIdentifier: args.tokenIdentifier,
        avatarUrl: args.avatarUrl,
      });
      return { userId: existing._id, created: false };
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      tokenIdentifier: args.tokenIdentifier,
      email: args.email,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      level: 1,
      xp: 0,
      currentStreak: 0,
      longestStreak: 0,
      settings: DEFAULT_SETTINGS,
    });

    // Award first login reward
    await ctx.runMutation(internal.gamification.rewards.checkAndAward, {
      userId,
    });

    return { userId, created: true };
  },
});

// ─── Update user settings ────────────────────────────────────────
export const updateSettings = mutation({
  args: {
    settings: settingsValidator,
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    await ctx.db.patch(user._id, {
      settings: args.settings,
    });

    return { success: true };
  },
});

// ─── Delete all user data (GDPR) ─────────────────────────────────
export const deleteAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) throw new Error("User not found");

    // Delete all related data in batches
    const tables = [
      "events",
      "scores",
      "insights",
      "interventions",
      "rewards",
      "weeklyReports",
      "sessions",
      "xpLedger",
    ] as const;

    for (const table of tables) {
      let batch = await ctx.db
        .query(table)
        .withIndex("by_userId", (q) => q.eq("userId", user._id))
        .take(500);

      while (batch.length > 0) {
        for (const doc of batch) {
          await ctx.db.delete(doc._id);
        }
        batch = await ctx.db
          .query(table)
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(500);
      }
    }

    // Delete user
    await ctx.db.delete(user._id);

    return { success: true, deleted: true };
  },
});

// ─── Delete user from Clerk webhook (internal) ──────────────────
export const deleteByClerkId = internalMutation({
  args: {
    clerkId: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.clerkId))
      .unique();

    if (!user) return { deleted: false };

    // Schedule cascading delete
    // For now, delete the user record. Related data cleanup via cron.
    await ctx.db.delete(user._id);

    return { deleted: true };
  },
});

// ─── Export all user data (GDPR) ─────────────────────────────────
export const exportData = query({
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

    const [events, scores, insights, interventions, rewards, reports, sessions, xpLedger] =
      await Promise.all([
        ctx.db
          .query("events")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(5000),
        ctx.db
          .query("scores")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(1000),
        ctx.db
          .query("insights")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(1000),
        ctx.db
          .query("interventions")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(1000),
        ctx.db
          .query("rewards")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(500),
        ctx.db
          .query("weeklyReports")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(200),
        ctx.db
          .query("sessions")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(1000),
        ctx.db
          .query("xpLedger")
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(2000),
      ]);

    return {
      user: {
        email: user.email,
        displayName: user.displayName,
        level: user.level,
        xp: user.xp,
        currentStreak: user.currentStreak,
        longestStreak: user.longestStreak,
        settings: user.settings,
      },
      events,
      scores,
      insights,
      interventions,
      rewards,
      weeklyReports: reports,
      sessions,
      xpLedger,
      exportedAt: new Date().toISOString(),
    };
  },
});
