import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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

type StoreUserResult =
  | { skipped: true; created: false }
  | { skipped: false; created: boolean; userId: Id<"users"> };

/**
 * Backward-compatible bootstrap mutation used by some clients as `users:storeUser`.
 * If called before auth is ready, we no-op instead of throwing an uncaught error.
 */
export const storeUser = mutation({
  args: {},
  handler: async (ctx): Promise<StoreUserResult> => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { skipped: true, created: false };
    }

    const clerkId =
      identity.subject ??
      identity.tokenIdentifier.split("|").pop() ??
      identity.tokenIdentifier;

    const email = identity.email ?? "";
    const displayName = identity.name ?? identity.email?.split("@")[0] ?? "User";
    const avatarUrl = identity.pictureUrl ?? undefined;

    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", clerkId))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        tokenIdentifier: identity.tokenIdentifier,
        email,
        displayName,
        avatarUrl,
      });
      return { skipped: false, created: false, userId: existing._id };
    }

    const userId = await ctx.db.insert("users", {
      clerkId,
      tokenIdentifier: identity.tokenIdentifier,
      email,
      displayName,
      avatarUrl,
      level: 1,
      xp: 0,
      currentStreak: 0,
      longestStreak: 0,
      settings: DEFAULT_SETTINGS,
    });

    return { skipped: false, created: true, userId };
  },
});
