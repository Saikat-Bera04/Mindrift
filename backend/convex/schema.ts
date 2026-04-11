import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // ─── Users ──────────────────────────────────────────────────────
  users: defineTable({
    clerkId: v.string(),
    tokenIdentifier: v.string(),
    email: v.string(),
    displayName: v.string(),
    avatarUrl: v.optional(v.string()),
    level: v.number(),
    xp: v.number(),
    currentStreak: v.number(),
    longestStreak: v.number(),
    lastActiveDate: v.optional(v.string()), // ISO date "YYYY-MM-DD"
    settings: v.object({
      notifications: v.object({
        dailyReport: v.boolean(),
        movementReminders: v.boolean(),
        focusAlerts: v.boolean(),
        weeklyDigest: v.boolean(),
        stressWarnings: v.boolean(),
      }),
      privacy: v.object({
        shareAnonymousData: v.boolean(),
        locationTracking: v.boolean(),
        dataRetentionDays: v.number(),
      }),
    }),
  })
    .index("by_clerkId", ["clerkId"])
    .index("by_tokenIdentifier", ["tokenIdentifier"])
    .index("by_email", ["email"]),

  // ─── Behavioral Events ─────────────────────────────────────────
  // Raw events ingested from Chrome ext, VS Code ext, PWA, geolocation
  events: defineTable({
    userId: v.id("users"),
    source: v.union(
      v.literal("chrome"),
      v.literal("vscode"),
      v.literal("pwa"),
      v.literal("geolocation")
    ),
    type: v.union(
      v.literal("tab_switch"),
      v.literal("session_start"),
      v.literal("session_end"),
      v.literal("break_taken"),
      v.literal("night_usage"),
      v.literal("coding_session"),
      v.literal("build_result"),
      v.literal("location_update"),
      v.literal("movement_detected"),
      v.literal("idle_detected")
    ),
    category: v.optional(
      v.union(
        v.literal("social"),
        v.literal("productivity"),
        v.literal("entertainment"),
        v.literal("education"),
        v.literal("other")
      )
    ),
    payload: v.object({
      durationMinutes: v.optional(v.number()),
      tabCount: v.optional(v.number()),
      language: v.optional(v.string()),
      buildSuccess: v.optional(v.boolean()),
      hourBucket: v.optional(v.number()), // 0-23
      domainCategory: v.optional(v.string()),
      latitude: v.optional(v.number()),
      longitude: v.optional(v.number()),
      distanceMeters: v.optional(v.number()),
      speedMps: v.optional(v.number()), // meters per second
      stepsEstimated: v.optional(v.number()),
      isMoving: v.optional(v.boolean()),
    }),
    timestamp: v.number(), // Unix ms, rounded to nearest minute
    batchId: v.string(), // client-generated UUID for idempotency
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_timestamp", ["userId", "timestamp"])
    .index("by_userId_and_source", ["userId", "source"])
    .index("by_batchId", ["batchId"])
    .index("by_timestamp", ["timestamp"]),

  // ─── Daily Scores ──────────────────────────────────────────────
  scores: defineTable({
    userId: v.id("users"),
    date: v.string(), // ISO date "YYYY-MM-DD"
    focus: v.number(), // 0-100
    stress: v.number(), // 0-100
    fatigue: v.number(), // 0-100
    balance: v.number(), // 0-100
    overall: v.number(), // 0-100 weighted composite
    ruleVersion: v.string(), // e.g. "v1.0"
    breakdown: v.object({
      focus: v.object({
        tabSwitchRate: v.number(),
        longSessionRatio: v.number(),
        productiveRatio: v.number(),
      }),
      stress: v.object({
        nightUsageScore: v.number(),
        highScreenTime: v.number(),
        lowBreakFrequency: v.number(),
      }),
      fatigue: v.object({
        sessionLengthScore: v.number(),
        timeOfDayWeight: v.number(),
        breakDeficit: v.number(),
      }),
      balance: v.object({
        productiveVsLeisure: v.number(),
        movementScore: v.number(),
        screenTimeVariance: v.number(),
      }),
    }),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_date", ["userId", "date"]),

  // ─── Insights ──────────────────────────────────────────────────
  insights: defineTable({
    userId: v.id("users"),
    date: v.string(),
    type: v.union(
      v.literal("warning"),
      v.literal("info"),
      v.literal("success")
    ),
    title: v.string(),
    description: v.string(),
    impact: v.union(
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    read: v.boolean(),
    relatedScoreField: v.optional(v.string()), // "focus", "stress", etc.
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_date", ["userId", "date"])
    .index("by_userId_and_read", ["userId", "read"]),

  // ─── Interventions ─────────────────────────────────────────────
  interventions: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("break"),
      v.literal("breathing"),
      v.literal("stretch"),
      v.literal("hydration"),
      v.literal("movement"),
      v.literal("eye_rest")
    ),
    title: v.string(),
    description: v.string(),
    durationSeconds: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("completed"),
      v.literal("dismissed")
    ),
    triggeredAt: v.number(), // Unix ms
    completedAt: v.optional(v.number()),
    dismissedAt: v.optional(v.number()),
    xpAwarded: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_status", ["userId", "status"]),

  // ─── Rewards ───────────────────────────────────────────────────
  rewards: defineTable({
    userId: v.id("users"),
    rewardId: v.string(), // unique reward type key
    name: v.string(),
    description: v.string(),
    xpValue: v.number(),
    category: v.union(
      v.literal("streak"),
      v.literal("score"),
      v.literal("intervention"),
      v.literal("milestone"),
      v.literal("exploration")
    ),
    earnedAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_rewardId", ["userId", "rewardId"]),

  // ─── Weekly Reports ────────────────────────────────────────────
  weeklyReports: defineTable({
    userId: v.id("users"),
    weekStart: v.string(), // ISO date
    weekEnd: v.string(),
    avgScores: v.object({
      focus: v.number(),
      stress: v.number(),
      fatigue: v.number(),
      balance: v.number(),
      overall: v.number(),
    }),
    prevWeekAvgScores: v.optional(
      v.object({
        focus: v.number(),
        stress: v.number(),
        fatigue: v.number(),
        balance: v.number(),
        overall: v.number(),
      })
    ),
    totalEvents: v.number(),
    totalInterventionsCompleted: v.number(),
    highlights: v.array(v.string()),
    suggestions: v.array(
      v.object({
        title: v.string(),
        description: v.string(),
        priority: v.union(
          v.literal("high"),
          v.literal("medium"),
          v.literal("low")
        ),
      })
    ),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_weekStart", ["userId", "weekStart"]),

  // ─── Sessions (active tracking) ────────────────────────────────
  sessions: defineTable({
    userId: v.id("users"),
    source: v.union(
      v.literal("chrome"),
      v.literal("vscode"),
      v.literal("pwa")
    ),
    startedAt: v.number(),
    endedAt: v.optional(v.number()),
    durationMinutes: v.optional(v.number()),
    isActive: v.boolean(),
    metadata: v.object({
      tabCount: v.optional(v.number()),
      primaryCategory: v.optional(v.string()),
      language: v.optional(v.string()),
    }),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_isActive", ["userId", "isActive"]),

  // ─── XP Ledger (audit trail) ───────────────────────────────────
  xpLedger: defineTable({
    userId: v.id("users"),
    amount: v.number(),
    reason: v.string(),
    source: v.union(
      v.literal("intervention"),
      v.literal("streak"),
      v.literal("reward"),
      v.literal("daily_login"),
      v.literal("score_improvement")
    ),
  })
    .index("by_userId", ["userId"]),

  // ─── Device Pairing (extension auth) ───────────────────────────
  devicePairings: defineTable({
    pairingCode: v.string(),
    clerkUserId: v.optional(v.string()),
    deviceName: v.optional(v.string()),
    status: v.union(
      v.literal("pending"),
      v.literal("paired"),
      v.literal("expired")
    ),
    expiresAt: v.number(),
  })
    .index("by_pairingCode", ["pairingCode"])
    .index("by_status", ["status"]),
});
