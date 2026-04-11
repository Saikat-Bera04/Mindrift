import { v } from "convex/values";
import { query } from "../_generated/server";

// ─── Get active (pending) interventions ─────────────────────────
export const getActive = query({
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
      .query("interventions")
      .withIndex("by_userId_and_status", (q) =>
        q.eq("userId", user._id).eq("status", "pending")
      )
      .order("desc")
      .take(10);
  },
});

// ─── Get intervention history ────────────────────────────────────
export const getHistory = query({
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
      .query("interventions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// ─── Get intervention stats ─────────────────────────────────────
export const getStats = query({
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

    const all = await ctx.db
      .query("interventions")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(500);

    const completed = all.filter((i) => i.status === "completed");
    const dismissed = all.filter((i) => i.status === "dismissed");
    const pending = all.filter((i) => i.status === "pending");

    const completionRate =
      completed.length + dismissed.length > 0
        ? completed.length /
          (completed.length + dismissed.length)
        : 0;

    const byType: Record<string, { completed: number; dismissed: number }> =
      {};
    for (const intervention of all) {
      if (!byType[intervention.type]) {
        byType[intervention.type] = { completed: 0, dismissed: 0 };
      }
      if (intervention.status === "completed") {
        byType[intervention.type]!.completed++;
      } else if (intervention.status === "dismissed") {
        byType[intervention.type]!.dismissed++;
      }
    }

    return {
      total: all.length,
      completed: completed.length,
      dismissed: dismissed.length,
      pending: pending.length,
      completionRate: Math.round(completionRate * 100),
      totalXpEarned: completed.reduce((sum, i) => sum + i.xpAwarded, 0),
      byType,
    };
  },
});
