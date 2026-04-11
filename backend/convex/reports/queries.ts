import { v } from "convex/values";
import { query } from "../_generated/server";

// ─── Get latest weekly report ────────────────────────────────────
export const getLatestReport = query({
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

    const reports = await ctx.db
      .query("weeklyReports")
      .withIndex("by_userId_and_weekStart", (q) =>
        q.eq("userId", user._id)
      )
      .order("desc")
      .take(1);

    return reports[0] ?? null;
  },
});

// ─── Get report history ──────────────────────────────────────────
export const getReportHistory = query({
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
      .query("weeklyReports")
      .withIndex("by_userId_and_weekStart", (q) =>
        q.eq("userId", user._id)
      )
      .order("desc")
      .take(args.limit ?? 12);
  },
});
