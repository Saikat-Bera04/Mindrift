import { v } from "convex/values";
import { query } from "../_generated/server";

// ─── Get recent events for a user (debug/admin) ─────────────────
export const getRecentEvents = query({
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

    const limit = args.limit ?? 50;
    return await ctx.db
      .query("events")
      .withIndex("by_userId_and_timestamp", (q) => q.eq("userId", user._id))
      .order("desc")
      .take(limit);
  },
});

// ─── Get event stats aggregated by source and type ───────────────
export const getEventStats = query({
  args: {
    startTimestamp: v.number(),
    endTimestamp: v.number(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return null;

    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", identity.tokenIdentifier)
      )
      .unique();

    if (!user) return null;

    const events = await ctx.db
      .query("events")
      .withIndex("by_userId_and_timestamp", (q) =>
        q
          .eq("userId", user._id)
          .gte("timestamp", args.startTimestamp)
          .lte("timestamp", args.endTimestamp)
      )
      .take(1000);

    // Aggregate by source
    const bySource: Record<string, number> = {};
    const byType: Record<string, number> = {};
    const byCategory: Record<string, number> = {};

    for (const event of events) {
      bySource[event.source] = (bySource[event.source] ?? 0) + 1;
      byType[event.type] = (byType[event.type] ?? 0) + 1;
      if (event.category) {
        byCategory[event.category] =
          (byCategory[event.category] ?? 0) + 1;
      }
    }

    return {
      total: events.length,
      bySource,
      byType,
      byCategory,
      timeRange: {
        start: args.startTimestamp,
        end: args.endTimestamp,
      },
    };
  },
});

// ─── Get today's event summary ──────────────────────────────────
export const getTodaySummary = query({
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

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const events = await ctx.db
      .query("events")
      .withIndex("by_userId_and_timestamp", (q) =>
        q
          .eq("userId", user._id)
          .gte("timestamp", todayStart.getTime())
      )
      .take(500);

    // Calculate summary metrics
    let totalScreenMinutes = 0;
    let tabSwitches = 0;
    let breaksTaken = 0;
    let movementMinutes = 0;
    let distanceTraveled = 0;
    let stepsEstimated = 0;

    for (const event of events) {
      if (event.payload.durationMinutes) {
        if (
          event.source === "chrome" ||
          event.source === "vscode"
        ) {
          totalScreenMinutes += event.payload.durationMinutes;
        }
        if (event.type === "movement_detected") {
          movementMinutes += event.payload.durationMinutes;
        }
      }
      if (event.type === "tab_switch") tabSwitches++;
      if (event.type === "break_taken") breaksTaken++;
      if (event.payload.distanceMeters) {
        distanceTraveled += event.payload.distanceMeters;
      }
      if (event.payload.stepsEstimated) {
        stepsEstimated += event.payload.stepsEstimated;
      }
    }

    const hours = Math.floor(totalScreenMinutes / 60);
    const mins = Math.round(totalScreenMinutes % 60);

    return {
      screenTime: `${hours}h ${mins}m`,
      screenTimeMinutes: totalScreenMinutes,
      tabSwitches,
      breaksTaken,
      movementMinutes,
      distanceKm: Math.round(distanceTraveled / 100) / 10,
      stepsEstimated,
      totalEvents: events.length,
    };
  },
});
