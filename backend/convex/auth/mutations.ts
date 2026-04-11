import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { getJwtIssuer } from "../lib/jwt";
import { hashPassword, verifyPassword } from "../lib/password";

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

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function assertValidPassword(password: string) {
  if (password.length < 8) {
    throw new Error("Password must be at least 8 characters long");
  }
}

function buildTokenIdentifier(subject: string): string {
  return `${getJwtIssuer()}|${subject}`;
}

export const registerWithPassword = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const displayName = args.displayName.trim() || "User";
    assertValidPassword(args.password);

    const existingAccount = await ctx.db
      .query("authAccounts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (existingAccount) {
      throw new Error("Email already registered");
    }

    const subject = `usr_${crypto.randomUUID().replace(/-/g, "")}`;
    const tokenIdentifier = buildTokenIdentifier(subject);
    const { passwordHash, passwordSalt } = await hashPassword(args.password);
    const now = Date.now();

    const userId = await ctx.db.insert("users", {
      clerkId: subject,
      tokenIdentifier,
      email,
      displayName,
      avatarUrl: undefined,
      level: 1,
      xp: 0,
      currentStreak: 0,
      longestStreak: 0,
      settings: DEFAULT_SETTINGS,
    });

    await ctx.db.insert("authAccounts", {
      userId,
      subject,
      email,
      passwordHash,
      passwordSalt,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.runMutation(internal.gamification.rewards.checkAndAward, {
      userId,
    });

    return {
      userId,
      subject,
      email,
      displayName,
      avatarUrl: undefined as string | undefined,
      tokenIdentifier,
      created: true,
    };
  },
});

export const loginWithPassword = internalMutation({
  args: {
    email: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    const email = normalizeEmail(args.email);
    const account = await ctx.db
      .query("authAccounts")
      .withIndex("by_email", (q) => q.eq("email", email))
      .unique();

    if (!account) {
      throw new Error("Invalid email or password");
    }

    const isPasswordValid = await verifyPassword(
      args.password,
      account.passwordSalt,
      account.passwordHash,
    );
    if (!isPasswordValid) {
      throw new Error("Invalid email or password");
    }

    const user = await ctx.db.get(account.userId);
    if (!user) {
      throw new Error("User record missing");
    }

    const tokenIdentifier = buildTokenIdentifier(account.subject);
    if (user.tokenIdentifier !== tokenIdentifier || user.email !== email) {
      await ctx.db.patch(user._id, {
        tokenIdentifier,
        email,
      });
    }

    await ctx.db.patch(account._id, {
      updatedAt: Date.now(),
    });

    return {
      userId: user._id,
      subject: account.subject,
      email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      tokenIdentifier,
      created: false,
    };
  },
});
