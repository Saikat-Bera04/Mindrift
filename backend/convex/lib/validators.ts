import { v } from "convex/values";

// ─── Shared validators for reuse across functions ────────────────

export const sourceValidator = v.union(
  v.literal("chrome"),
  v.literal("vscode"),
  v.literal("pwa"),
  v.literal("geolocation")
);

export const eventTypeValidator = v.union(
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
);

export const categoryValidator = v.optional(
  v.union(
    v.literal("social"),
    v.literal("productivity"),
    v.literal("entertainment"),
    v.literal("education"),
    v.literal("other")
  )
);

export const impactValidator = v.union(
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

export const insightTypeValidator = v.union(
  v.literal("warning"),
  v.literal("info"),
  v.literal("success")
);

export const interventionTypeValidator = v.union(
  v.literal("break"),
  v.literal("breathing"),
  v.literal("stretch"),
  v.literal("hydration"),
  v.literal("movement"),
  v.literal("eye_rest")
);

export const interventionStatusValidator = v.union(
  v.literal("pending"),
  v.literal("completed"),
  v.literal("dismissed")
);

export const rewardCategoryValidator = v.union(
  v.literal("streak"),
  v.literal("score"),
  v.literal("intervention"),
  v.literal("milestone"),
  v.literal("exploration")
);

export const priorityValidator = v.union(
  v.literal("high"),
  v.literal("medium"),
  v.literal("low")
);

export const eventPayloadValidator = v.object({
  durationMinutes: v.optional(v.number()),
  tabCount: v.optional(v.number()),
  language: v.optional(v.string()),
  buildSuccess: v.optional(v.boolean()),
  hourBucket: v.optional(v.number()),
  domainCategory: v.optional(v.string()),
  latitude: v.optional(v.number()),
  longitude: v.optional(v.number()),
  distanceMeters: v.optional(v.number()),
  speedMps: v.optional(v.number()),
  stepsEstimated: v.optional(v.number()),
  isMoving: v.optional(v.boolean()),
});

export const notificationSettingsValidator = v.object({
  dailyReport: v.boolean(),
  movementReminders: v.boolean(),
  focusAlerts: v.boolean(),
  weeklyDigest: v.boolean(),
  stressWarnings: v.boolean(),
});

export const privacySettingsValidator = v.object({
  shareAnonymousData: v.boolean(),
  locationTracking: v.boolean(),
  dataRetentionDays: v.number(),
});

export const settingsValidator = v.object({
  notifications: notificationSettingsValidator,
  privacy: privacySettingsValidator,
});
