import { v } from "convex/values";
import { mutation, internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  STREAK_MILESTONES,
  STREAK_XP_BONUS,
  DAILY_LOGIN_XP,
} from "../lib/constants";

// ─── Update streak on daily activity ────────────────────────────
export const updateStreak = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const today = new Date().toISOString().split("T")[0]!;

    // Already active today
    if (user.lastActiveDate === today) {
      return {
        currentStreak: user.currentStreak,
        updated: false,
      };
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0]!;

    let newStreak: number;
    let streakBroken = false;

    if (user.lastActiveDate === yesterdayStr) {
      // Consecutive day — extend streak
      newStreak = user.currentStreak + 1;
    } else {
      // Streak broken — reset to 1
      newStreak = 1;
      streakBroken = user.currentStreak > 0;
    }

    const newLongest = Math.max(user.longestStreak, newStreak);

    // Update user
    await ctx.db.patch(user._id, {
      currentStreak: newStreak,
      longestStreak: newLongest,
      lastActiveDate: today,
      xp: user.xp + DAILY_LOGIN_XP,
    });

    // Log daily XP
    await ctx.db.insert("xpLedger", {
      userId: user._id,
      amount: DAILY_LOGIN_XP,
      reason: "Daily activity",
      source: "daily_login",
    });

    // Check for streak milestone rewards
    if (STREAK_MILESTONES.includes(newStreak)) {
      const bonusXp = STREAK_XP_BONUS[newStreak] ?? 0;

      // Check if reward already earned
      const existingReward = await ctx.db
        .query("rewards")
        .withIndex("by_userId_and_rewardId", (q) =>
          q
            .eq("userId", user._id)
            .eq("rewardId", `STREAK_${newStreak}`)
        )
        .unique();

      if (!existingReward && bonusXp > 0) {
        await ctx.db.insert("rewards", {
          userId: user._id,
          rewardId: `STREAK_${newStreak}`,
          name: `${newStreak}-Day Streak!`,
          description: `Maintained a ${newStreak}-day activity streak. Incredible!`,
          xpValue: bonusXp,
          category: "streak",
          earnedAt: Date.now(),
        });

        // Award bonus XP
        const currentUser = await ctx.db.get(user._id);
        if (currentUser) {
          await ctx.db.patch(user._id, {
            xp: currentUser.xp + bonusXp,
          });
        }

        await ctx.db.insert("xpLedger", {
          userId: user._id,
          amount: bonusXp,
          reason: `${newStreak}-day streak milestone`,
          source: "streak",
        });
      }
    }

    return {
      currentStreak: newStreak,
      longestStreak: newLongest,
      streakBroken,
      updated: true,
    };
  },
});
