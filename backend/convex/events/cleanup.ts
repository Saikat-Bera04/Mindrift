import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { DEFAULT_EVENT_RETENTION_DAYS } from "../lib/constants";

// ─── Cleanup: Delete old raw events ─────────────────────────────
// Runs daily via cron. Deletes raw events older than retention period.
export const cleanupOldEvents = internalMutation({
  args: {},
  handler: async (ctx) => {
    const cutoff =
      Date.now() - DEFAULT_EVENT_RETENTION_DAYS * 24 * 60 * 60 * 1000;

    // Process in batches to stay within transaction limits
    const oldEvents = await ctx.db
      .query("events")
      .withIndex("by_timestamp", (q) => q.lt("timestamp", cutoff))
      .take(500);

    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
    }

    // If there are more, schedule another run
    if (oldEvents.length === 500) {
      await ctx.scheduler.runAfter(
        0,
        internal.events.cleanup.cleanupOldEvents,
        {}
      );
    }

    return { deleted: oldEvents.length };
  },
});
