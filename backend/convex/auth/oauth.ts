import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { getJwtIssuer } from "../lib/jwt";

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
} as const;

function buildTokenIdentifier(subject: string): string {
  return `${getJwtIssuer()}|${subject}`;
}

export const loginWithOAuth = internalMutation({
  args: {
    provider: v.string(),
    providerAccountId: v.string(),
    email: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user exists by email (to link accounts if they registered via password earlier)
    const existingUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .unique();

    const subject = `usr_${args.providerAccountId}`;
    const tokenIdentifier = buildTokenIdentifier(subject);

    if (existingUser) {
      // Update the user's avatar if they didn't have one, or just update their token identifier and clerkId
      // Because OAuth replaces or adds to their identity
      await ctx.db.patch(existingUser._id, {
        clerkId: subject, // Storing providerAccountId as clerkId 
        tokenIdentifier,
        avatarUrl: existingUser.avatarUrl || args.avatarUrl,
      });

      return {
        userId: existingUser._id,
        subject,
        email: existingUser.email,
        displayName: existingUser.displayName,
        avatarUrl: existingUser.avatarUrl || args.avatarUrl,
        tokenIdentifier,
        created: false,
      };
    }

    // New user
    const userId = await ctx.db.insert("users", {
      clerkId: subject,
      tokenIdentifier,
      email: args.email,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      level: 1,
      xp: 0,
      currentStreak: 0,
      longestStreak: 0,
      settings: DEFAULT_SETTINGS,
    });

    await ctx.runMutation(internal.gamification.rewards.checkAndAward, {
      userId,
    });

    return {
      userId,
      subject,
      email: args.email,
      displayName: args.displayName,
      avatarUrl: args.avatarUrl,
      tokenIdentifier,
      created: true,
    };
  },
});
