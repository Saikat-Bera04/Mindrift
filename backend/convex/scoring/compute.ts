import { v } from "convex/values";
import { internalMutation, internalAction } from "../_generated/server";
import { internal } from "../_generated/api";
import { computeScoresV1, summarizeEvents } from "./rules";

// ─── Compute daily scores for a single user ─────────────────────
export const computeForUser = internalMutation({
  args: {
    userId: v.id("users"),
    date: v.string(), // "YYYY-MM-DD"
  },
  handler: async (ctx, args) => {
    // Get date boundaries
    const dayStart = new Date(args.date + "T00:00:00Z").getTime();
    const dayEnd = new Date(args.date + "T23:59:59.999Z").getTime();

    // Fetch events for the day
    const events = await ctx.db
      .query("events")
      .withIndex("by_userId_and_timestamp", (q) =>
        q
          .eq("userId", args.userId)
          .gte("timestamp", dayStart)
          .lte("timestamp", dayEnd)
      )
      .take(2000);

    if (events.length === 0) {
      return null; // no activity, no score
    }

    // Summarize and score
    const summary = summarizeEvents(
      events.map((e) => ({
        type: e.type,
        source: e.source,
        category: e.category,
        payload: e.payload as Record<string, unknown>,
        timestamp: e.timestamp,
      }))
    );
    const scores = computeScoresV1(summary);

    // Check if score already exists for this date
    const existing = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", args.date)
      )
      .unique();

    if (existing) {
      // Update existing score
      await ctx.db.patch(existing._id, {
        focus: scores.focus,
        stress: scores.stress,
        fatigue: scores.fatigue,
        balance: scores.balance,
        overall: scores.overall,
        ruleVersion: scores.ruleVersion,
        breakdown: scores.breakdown,
      });
      return existing._id;
    }

    // Insert new score
    const scoreId = await ctx.db.insert("scores", {
      userId: args.userId,
      date: args.date,
      focus: scores.focus,
      stress: scores.stress,
      fatigue: scores.fatigue,
      balance: scores.balance,
      overall: scores.overall,
      ruleVersion: scores.ruleVersion,
      breakdown: scores.breakdown,
    });

    return scoreId;
  },
});

// ─── Compute daily scores for ALL active users ──────────────────
// Called by cron at end of day
export const computeAllDaily = internalMutation({
  args: {
    date: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const date =
      args.date ?? new Date().toISOString().split("T")[0]!;

    // Get all users — process in batches
    const users = await ctx.db.query("users").take(100);

    let computed = 0;
    for (const user of users) {
      await ctx.runMutation(internal.scoring.compute.computeForUser, {
        userId: user._id,
        date,
      });
      computed++;
    }

    return { computed, date };
  },
});
