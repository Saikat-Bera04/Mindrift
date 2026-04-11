import { v } from "convex/values";
import { mutation, internalMutation, query } from "../_generated/server";
import { internal } from "../_generated/api";
import { settingsValidator } from "../lib/validators";
import { requireUser, getOptionalUser } from "./helpers";

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
    const user = await requireUser(ctx);

    await ctx.db.patch(user._id, {
      settings: args.settings,
    });

    return { success: true };
  },
});

// ─── Save onboarding profile data ────────────────────────────────
export const saveOnboardingProfile = mutation({
  args: {
    type: v.union(v.literal("personal"), v.literal("professional")),
    age: v.number(),
    height: v.number(),
    weight: v.number(),
    bmi: v.number(),
    bloodPressure: v.optional(v.string()),
    status: v.optional(v.string()),
    jobDescription: v.optional(v.string()),
    likes: v.optional(v.string()),
    dislikes: v.optional(v.string()),
    relationshipStatus: v.optional(v.string()),
    workingHours: v.optional(v.number()),
    sleepHours: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const user = await getOptionalUser(ctx);
    if (!user) {
      return { success: false, error: "UNAUTHENTICATED" as const };
    }

    // Check if profile already exists
    const existing = await ctx.db
      .query("onboardingProfiles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args });
    } else {
      await ctx.db.insert("onboardingProfiles", {
        userId: user._id,
        ...args,
      });
    }

    return { success: true };
  },
});

// ─── Delete all user data (GDPR) ─────────────────────────────────
export const deleteAllData = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx);

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
    const user = await getOptionalUser(ctx);
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
// ─── Generate extension pairing code ─────────────────────────────
export const generatePairingCode = mutation({
  args: {
    deviceName: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx);

    // Generate a 6-digit code
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Expire in 10 minutes
    const expiresAt = Date.now() + 10 * 60 * 1000;

    await ctx.db.insert("devicePairings", {
      pairingCode,
      clerkUserId: user.clerkId,
      deviceName: args.deviceName || "Chrome Extension",
      status: "pending",
      expiresAt,
    });

    return { pairingCode, expiresAt };
  },
});

// ─── Complete pairing from extension ─────────────────────────────
export const pairDevice = internalMutation({
  args: {
    pairingCode: v.string(),
  },
  handler: async (ctx, args) => {
    const pairing = await ctx.db
      .query("devicePairings")
      .withIndex("by_pairingCode", (q) => q.eq("pairingCode", args.pairingCode))
      .unique();

    if (!pairing || pairing.status !== "pending" || pairing.expiresAt < Date.now()) {
      throw new Error("Invalid or expired pairing code");
    }

    // Update status
    await ctx.db.patch(pairing._id, {
      status: "paired",
    });

    // In a real app, we'd return a long-lived token here.
    // For this prototype, we'll return the Clerk User ID as the 'token'
    // and modify batchIngest to check it if no JWT is present.
    return { 
      success: true, 
      token: pairing.clerkUserId,
      deviceName: pairing.deviceName 
    };
  },
});
