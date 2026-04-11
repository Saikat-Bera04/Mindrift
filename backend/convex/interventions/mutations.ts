import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { internal } from "../_generated/api";

// ─── Complete an intervention (user action) ─────────────────────
export const complete = mutation({
  args: {
    interventionId: v.id("interventions"),
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

    const intervention = await ctx.db.get(args.interventionId);
    if (!intervention) throw new Error("Intervention not found");
    if (intervention.userId !== user._id) throw new Error("Unauthorized");
    if (intervention.status !== "pending") {
      throw new Error("Intervention already resolved");
    }

    const now = Date.now();

    // Mark as completed
    await ctx.db.patch(args.interventionId, {
      status: "completed",
      completedAt: now,
    });

    // Award XP
    await ctx.db.patch(user._id, {
      xp: user.xp + intervention.xpAwarded,
    });

    // Log XP
    await ctx.db.insert("xpLedger", {
      userId: user._id,
      amount: intervention.xpAwarded,
      reason: `Completed ${intervention.type} intervention`,
      source: "intervention",
    });

    return {
      success: true,
      xpAwarded: intervention.xpAwarded,
      newXp: user.xp + intervention.xpAwarded,
    };
  },
});

// ─── Dismiss an intervention ────────────────────────────────────
export const dismiss = mutation({
  args: {
    interventionId: v.id("interventions"),
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

    const intervention = await ctx.db.get(args.interventionId);
    if (!intervention) throw new Error("Intervention not found");
    if (intervention.userId !== user._id) throw new Error("Unauthorized");
    if (intervention.status !== "pending") {
      throw new Error("Intervention already resolved");
    }

    await ctx.db.patch(args.interventionId, {
      status: "dismissed",
      dismissedAt: Date.now(),
    });

    return { success: true };
  },
});
