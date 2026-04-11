import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { internal } from "../_generated/api";

// ─── Generate weekly report for a user ──────────────────────────
export const generateForUser = internalMutation({
  args: {
    userId: v.id("users"),
    weekStart: v.string(), // ISO date
    weekEnd: v.string(),
  },
  handler: async (ctx, args) => {
    // Get scores for the week
    const scores = await ctx.db
      .query("scores")
      .withIndex("by_userId_and_date", (q) =>
        q
          .eq("userId", args.userId)
          .gte("date", args.weekStart)
          .lte("date", args.weekEnd)
      )
      .take(7);

    if (scores.length === 0) return null;

    // Calculate averages
    const avgScores = {
      focus: Math.round(
        scores.reduce((s, sc) => s + sc.focus, 0) / scores.length
      ),
      stress: Math.round(
        scores.reduce((s, sc) => s + sc.stress, 0) / scores.length
      ),
      fatigue: Math.round(
        scores.reduce((s, sc) => s + sc.fatigue, 0) / scores.length
      ),
      balance: Math.round(
        scores.reduce((s, sc) => s + sc.balance, 0) / scores.length
      ),
      overall: Math.round(
        scores.reduce((s, sc) => s + sc.overall, 0) / scores.length
      ),
    };

    // Get previous week's report for comparison
    const prevWeekStart = new Date(args.weekStart);
    prevWeekStart.setDate(prevWeekStart.getDate() - 7);
    const prevReport = await ctx.db
      .query("weeklyReports")
      .withIndex("by_userId_and_weekStart", (q) =>
        q
          .eq("userId", args.userId)
          .eq("weekStart", prevWeekStart.toISOString().split("T")[0]!)
      )
      .unique();

    // Count events
    const weekStartTimestamp = new Date(
      args.weekStart + "T00:00:00Z"
    ).getTime();
    const weekEndTimestamp = new Date(
      args.weekEnd + "T23:59:59.999Z"
    ).getTime();

    const events = await ctx.db
      .query("events")
      .withIndex("by_userId_and_timestamp", (q) =>
        q
          .eq("userId", args.userId)
          .gte("timestamp", weekStartTimestamp)
          .lte("timestamp", weekEndTimestamp)
      )
      .take(5000);

    // Count completed interventions
    const interventions = await ctx.db
      .query("interventions")
      .withIndex("by_userId_and_status", (q) =>
        q.eq("userId", args.userId).eq("status", "completed")
      )
      .take(100);

    const weekInterventions = interventions.filter(
      (i) =>
        i.completedAt &&
        i.completedAt >= weekStartTimestamp &&
        i.completedAt <= weekEndTimestamp
    );

    // Generate highlights
    const highlights: string[] = [];
    const bestDay = scores.reduce((best, s) =>
      s.overall > best.overall ? s : best
    );
    highlights.push(
      `Best day was ${bestDay.date} with an overall score of ${bestDay.overall}.`
    );

    if (avgScores.focus > 70) {
      highlights.push(
        `Strong focus this week with an average of ${avgScores.focus}%.`
      );
    }
    if (avgScores.stress < 40) {
      highlights.push(
        `Great stress management — averaged only ${avgScores.stress}%.`
      );
    }
    if (weekInterventions.length > 0) {
      highlights.push(
        `Completed ${weekInterventions.length} wellness interventions.`
      );
    }

    if (prevReport) {
      const overallChange =
        avgScores.overall - prevReport.avgScores.overall;
      if (overallChange > 0) {
        highlights.push(
          `Overall wellness improved by ${overallChange} points vs. last week!`
        );
      } else if (overallChange < -5) {
        highlights.push(
          `Overall wellness dipped ${Math.abs(overallChange)} points — review suggestions below.`
        );
      }
    }

    // Generate suggestions
    const suggestions: Array<{
      title: string;
      description: string;
      priority: "high" | "medium" | "low";
    }> = [];

    if (avgScores.stress > 50) {
      suggestions.push({
        title: "Stress Reduction",
        description:
          "Your average stress was elevated. Try adding 10-minute breathing sessions and reducing late-night screen time.",
        priority: "high",
      });
    }
    if (avgScores.focus < 60) {
      suggestions.push({
        title: "Focus Enhancement",
        description:
          "Lower focus detected. Consider using website blockers during work hours and the Pomodoro technique.",
        priority: "medium",
      });
    }
    if (avgScores.balance < 50) {
      suggestions.push({
        title: "Work-Life Balance",
        description:
          "Balance could improve. Aim for at least 30 minutes of movement daily and set screen time boundaries.",
        priority: "high",
      });
    }
    if (weekInterventions.length < 3) {
      suggestions.push({
        title: "Engage with Interventions",
        description:
          "Try completing more wellness interventions when prompted — they're designed to help based on your patterns.",
        priority: "low",
      });
    }

    // Store report
    const existing = await ctx.db
      .query("weeklyReports")
      .withIndex("by_userId_and_weekStart", (q) =>
        q
          .eq("userId", args.userId)
          .eq("weekStart", args.weekStart)
      )
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        avgScores,
        prevWeekAvgScores: prevReport?.avgScores,
        totalEvents: events.length,
        totalInterventionsCompleted: weekInterventions.length,
        highlights,
        suggestions,
      });
      return existing._id;
    }

    return await ctx.db.insert("weeklyReports", {
      userId: args.userId,
      weekStart: args.weekStart,
      weekEnd: args.weekEnd,
      avgScores,
      prevWeekAvgScores: prevReport?.avgScores,
      totalEvents: events.length,
      totalInterventionsCompleted: weekInterventions.length,
      highlights,
      suggestions,
    });
  },
});

// ─── Generate weekly reports for all users (cron) ────────────────
export const generateAllWeekly = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() - weekEnd.getDay()); // last Sunday
    const weekStart = new Date(weekEnd);
    weekStart.setDate(weekStart.getDate() - 6);

    const weekStartStr = weekStart.toISOString().split("T")[0]!;
    const weekEndStr = weekEnd.toISOString().split("T")[0]!;

    const users = await ctx.db.query("users").take(100);

    let generated = 0;
    for (const user of users) {
      await ctx.runMutation(
        internal.reports.generate.generateForUser,
        {
          userId: user._id,
          weekStart: weekStartStr,
          weekEnd: weekEndStr,
        }
      );
      generated++;
    }

    return { generated, weekStart: weekStartStr, weekEnd: weekEndStr };
  },
});
