import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// ─── Daily: Compute scores + generate insights + cleanup ────────
// Runs every day at midnight UTC
crons.cron(
  "compute daily scores",
  "0 0 * * *", // midnight UTC
  internal.scoring.compute.computeAllDaily,
  {}
);

crons.cron(
  "generate daily insights",
  "5 0 * * *", // 00:05 UTC (after scoring)
  internal.insights.generate.generateAllDaily,
  {}
);

crons.cron(
  "cleanup old events",
  "30 0 * * *", // 00:30 UTC
  internal.events.cleanup.cleanupOldEvents,
  {}
);

// ─── Weekly: Generate reports ───────────────────────────────────
// Runs every Sunday at 01:00 UTC
crons.cron(
  "generate weekly reports",
  "0 1 * * 0", // Sunday 01:00 UTC
  internal.reports.generate.generateAllWeekly,
  {}
);

// ─── Hourly: Check intervention triggers ─────────────────────────
crons.interval(
  "check intervention triggers",
  { hours: 1 },
  internal.interventions.trigger.checkAllUsers,
  {}
);

export default crons;
