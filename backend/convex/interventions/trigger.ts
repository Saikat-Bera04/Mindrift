import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";
import { INTERVENTION_RULES } from "../lib/constants";

// ─── Check and trigger interventions for a user ─────────────────
export const checkAndTrigger = internalMutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const triggered: string[] = [];

    // Check for pending interventions — don't spam
    const pending = await ctx.db
      .query("interventions")
      .withIndex("by_userId_and_status", (q) =>
        q.eq("userId", args.userId).eq("status", "pending")
      )
      .take(5);

    const pendingTypes = new Set(pending.map((p) => p.type));

    // Get active sessions
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_userId_and_isActive", (q) =>
        q.eq("userId", args.userId).eq("isActive", true)
      )
      .take(5);

    // Get today's latest score
    const today = new Date().toISOString().split("T")[0]!;
    const latestScore = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) =>
        q.eq("userId", args.userId).eq("date", today)
      )
      .unique();

    // Get recent interventions to check last trigger times
    const recentInterventions = await ctx.db
      .query("interventions")
      .withIndex("by_userId", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(20);

    const lastTriggerByType: Record<string, number> = {};
    for (const intervention of recentInterventions) {
      if (!lastTriggerByType[intervention.type]) {
        lastTriggerByType[intervention.type] = intervention.triggeredAt;
      }
    }

    // ── Break Intervention ──────────────────────────────────────
    if (!pendingTypes.has("break")) {
      for (const session of activeSessions) {
        const sessionMinutes = (now - session.startedAt) / 60000;
        if (
          sessionMinutes >= INTERVENTION_RULES.break.triggerAfterMinutes
        ) {
          await ctx.db.insert("interventions", {
            userId: args.userId,
            type: "break",
            title: "Time for a Break!",
            description:
              "You've been working for over 50 minutes. Take a 5-minute break to refresh your mind.",
            durationSeconds: INTERVENTION_RULES.break.durationSeconds,
            status: "pending",
            triggeredAt: now,
            xpAwarded: INTERVENTION_RULES.break.xpReward,
          });
          triggered.push("break");
          break;
        }
      }
    }

    // ── Breathing Intervention (stress-based) ───────────────────
    if (
      !pendingTypes.has("breathing") &&
      latestScore &&
      latestScore.stress > INTERVENTION_RULES.breathing.triggerStressAbove
    ) {
      const lastBreathing = lastTriggerByType["breathing"] ?? 0;
      if (now - lastBreathing > 30 * 60 * 1000) {
        // at most every 30 min
        await ctx.db.insert("interventions", {
          userId: args.userId,
          type: "breathing",
          title: "Breathing Exercise",
          description:
            "Your stress levels are elevated. Try a 3-minute box breathing exercise: inhale 4s, hold 4s, exhale 4s, hold 4s.",
          durationSeconds:
            INTERVENTION_RULES.breathing.durationSeconds,
          status: "pending",
          triggeredAt: now,
          xpAwarded: INTERVENTION_RULES.breathing.xpReward,
        });
        triggered.push("breathing");
      }
    }

    // ── Stretch Intervention ────────────────────────────────────
    if (!pendingTypes.has("stretch")) {
      for (const session of activeSessions) {
        const sessionMinutes = (now - session.startedAt) / 60000;
        if (
          sessionMinutes >=
          INTERVENTION_RULES.stretch.triggerAfterMinutes
        ) {
          await ctx.db.insert("interventions", {
            userId: args.userId,
            type: "stretch",
            title: "Stretch Break",
            description:
              "You've been sitting for over 2 hours. Stand up and do some stretches for your neck, shoulders, and back.",
            durationSeconds:
              INTERVENTION_RULES.stretch.durationSeconds,
            status: "pending",
            triggeredAt: now,
            xpAwarded: INTERVENTION_RULES.stretch.xpReward,
          });
          triggered.push("stretch");
          break;
        }
      }
    }

    // ── Hydration Reminder ──────────────────────────────────────
    if (!pendingTypes.has("hydration")) {
      const lastHydration = lastTriggerByType["hydration"] ?? 0;
      if (
        now - lastHydration >
        INTERVENTION_RULES.hydration.triggerIntervalMinutes * 60 * 1000
      ) {
        await ctx.db.insert("interventions", {
          userId: args.userId,
          type: "hydration",
          title: "Stay Hydrated 💧",
          description:
            "It's been a while since your last water break. Drink a glass of water to stay hydrated and maintain focus.",
          durationSeconds:
            INTERVENTION_RULES.hydration.durationSeconds,
          status: "pending",
          triggeredAt: now,
          xpAwarded: INTERVENTION_RULES.hydration.xpReward,
        });
        triggered.push("hydration");
      }
    }

    // ── Movement Intervention ───────────────────────────────────
    if (!pendingTypes.has("movement")) {
      const lastMovement = lastTriggerByType["movement"] ?? 0;
      if (
        now - lastMovement >
        INTERVENTION_RULES.movement.triggerAfterIdleMinutes * 60 * 1000
      ) {
        // Check if there's been recent movement from geolocation
        const recentMovement = await ctx.db
          .query("events")
          .withIndex("by_userId_and_timestamp", (q) =>
            q
              .eq("userId", args.userId)
              .gte("timestamp", now - 60 * 60 * 1000)
          )
          .take(50);

        const hasRecentMovement = recentMovement.some(
          (e) =>
            e.type === "movement_detected" &&
            e.payload.isMoving === true
        );

        if (!hasRecentMovement) {
          await ctx.db.insert("interventions", {
            userId: args.userId,
            type: "movement",
            title: "Get Moving! 🏃",
            description:
              "You've been stationary for over an hour. A short walk can boost your energy and creativity.",
            durationSeconds:
              INTERVENTION_RULES.movement.durationSeconds,
            status: "pending",
            triggeredAt: now,
            xpAwarded: INTERVENTION_RULES.movement.xpReward,
          });
          triggered.push("movement");
        }
      }
    }

    // ── Eye Rest (20-20-20 rule) ────────────────────────────────
    if (!pendingTypes.has("eye_rest")) {
      const lastEyeRest = lastTriggerByType["eye_rest"] ?? 0;
      if (
        now - lastEyeRest >
        INTERVENTION_RULES.eye_rest.triggerAfterMinutes * 60 * 1000
      ) {
        for (const session of activeSessions) {
          const sessionMinutes = (now - session.startedAt) / 60000;
          if (sessionMinutes >= 20) {
            await ctx.db.insert("interventions", {
              userId: args.userId,
              type: "eye_rest",
              title: "20-20-20 Eye Break 👁️",
              description:
                "Look at something 20 feet away for 20 seconds. This reduces eye strain from prolonged screen use.",
              durationSeconds:
                INTERVENTION_RULES.eye_rest.durationSeconds,
              status: "pending",
              triggeredAt: now,
              xpAwarded: INTERVENTION_RULES.eye_rest.xpReward,
            });
            triggered.push("eye_rest");
            break;
          }
        }
      }
    }

    return { triggered };
  },
});

// ─── Check interventions for all users (cron) ───────────────────
export const checkAllUsers = internalMutation({
  args: {},
  handler: async (ctx) => {
    // Find users with active sessions
    const activeSessions = await ctx.db
      .query("sessions")
      .withIndex("by_isActive", (q) =>
        q.eq("isActive", true)
      )
      .take(100);

    // Deduplicate by userId
    const userIds = [...new Set(activeSessions.map((s) => s.userId))];

    let checked = 0;
    for (const userId of userIds) {
      await ctx.runMutation(
        internal.interventions.trigger.checkAndTrigger,
        { userId }
      );
      checked++;
    }

    return { checked };
  },
});
