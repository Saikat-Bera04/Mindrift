import { v } from "convex/values";
import { query, mutation } from "../_generated/server";

// ─── Get unread insights (notification badge) ───────────────────
export const getUnreadInsights = query({
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
      .query("insights")
      .withIndex("by_userId_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .order("desc")
      .take(20);
  },
});

// ─── Get insight history (paginated) ─────────────────────────────
export const getInsightHistory = query({
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
      .query("insights")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// ─── Get unread count ────────────────────────────────────────────
export const getUnreadCount = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return 0;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return 0;

    const unread = await ctx.db
      .query("insights")
      .withIndex("by_userId_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .take(100);

    return unread.length;
  },
});

// ─── Mark insight as read ────────────────────────────────────────
export const markAsRead = mutation({
  args: {
    insightId: v.id("insights"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthorized");

    const insight = await ctx.db.get(args.insightId);
    if (!insight) throw new Error("Insight not found");

    // Verify ownership
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user || insight.userId !== user._id) {
      throw new Error("Unauthorized");
    }

    await ctx.db.patch(args.insightId, { read: true });
    return { success: true };
  },
});

// ─── Mark all insights as read ───────────────────────────────────
export const markAllAsRead = mutation({
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

    const unread = await ctx.db
      .query("insights")
      .withIndex("by_userId_and_read", (q) =>
        q.eq("userId", user._id).eq("read", false)
      )
      .take(100);

    for (const insight of unread) {
      await ctx.db.patch(insight._id, { read: true });
    }

    return { marked: unread.length };
  },
});
