// ─── Scoring ────────────────────────────────────────────────────
export const CURRENT_RULE_VERSION = "v1.0";

export const SCORE_WEIGHTS = {
  focus: 0.30,
  stress: 0.25,
  fatigue: 0.20,
  balance: 0.25,
} as const;

// Thresholds for insight generation
export const SCORE_THRESHOLDS = {
  critical: 80,  // scores above this trigger warnings
  high: 60,
  moderate: 40,
  low: 20,
} as const;

// ─── Interventions ──────────────────────────────────────────────
export const INTERVENTION_RULES = {
  break: {
    triggerAfterMinutes: 50,
    durationSeconds: 300, // 5 min
    xpReward: 10,
  },
  breathing: {
    triggerStressAbove: 70,
    durationSeconds: 180, // 3 min
    xpReward: 15,
  },
  stretch: {
    triggerAfterMinutes: 120,
    durationSeconds: 300,
    xpReward: 10,
  },
  hydration: {
    triggerIntervalMinutes: 90,
    durationSeconds: 60,
    xpReward: 5,
  },
  movement: {
    triggerAfterIdleMinutes: 60,
    durationSeconds: 600, // 10 min
    xpReward: 20,
  },
  eye_rest: {
    triggerAfterMinutes: 20, // 20-20-20 rule
    durationSeconds: 20,
    xpReward: 5,
  },
} as const;

// ─── Gamification ───────────────────────────────────────────────
export const XP_THRESHOLDS: Record<number, number> = {
  1: 0,
  2: 100,
  3: 300,
  4: 600,
  5: 1000,
  6: 1500,
  7: 2200,
  8: 3000,
  9: 4000,
  10: 5200,
  11: 6600,
  12: 8200,
  13: 10000,
  14: 12000,
  15: 14500,
};

export const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100, 365];
export const STREAK_XP_BONUS: Record<number, number> = {
  3: 25,
  7: 50,
  14: 100,
  30: 250,
  60: 500,
  100: 1000,
  365: 5000,
};

export const DAILY_LOGIN_XP = 5;
export const INTERVENTION_COMPLETION_MILESTONE = 10;

// ─── Data Retention ─────────────────────────────────────────────
export const DEFAULT_EVENT_RETENTION_DAYS = 30;
export const DEFAULT_SCORE_RETENTION_DAYS = 365;

// ─── Rate Limits ────────────────────────────────────────────────
export const MAX_EVENTS_PER_BATCH = 100;
export const MAX_BATCHES_PER_MINUTE = 10;

// ─── Geolocation ────────────────────────────────────────────────
export const MOVEMENT_SPEED_THRESHOLD_MPS = 0.5; // above this = moving
export const WALKING_SPEED_MPS = 1.4; // average walking speed
export const RUNNING_SPEED_MPS = 3.0;
export const STEPS_PER_METER = 1.3; // rough estimate

// ─── Reward Catalog ─────────────────────────────────────────────
export const REWARD_CATALOG = {
  FIRST_LOGIN: {
    name: "First Steps",
    description: "Welcome to Mindrift! Your wellness journey begins.",
    xpValue: 50,
    category: "milestone" as const,
  },
  FIRST_INSIGHT_READ: {
    name: "Self Awareness",
    description: "You read your first behavioral insight.",
    xpValue: 25,
    category: "milestone" as const,
  },
  WEEK_STREAK: {
    name: "Consistent Week",
    description: "7-day activity streak achieved!",
    xpValue: 50,
    category: "streak" as const,
  },
  MONTH_STREAK: {
    name: "Monthly Warrior",
    description: "30-day activity streak — incredible dedication!",
    xpValue: 250,
    category: "streak" as const,
  },
  SCORE_IMPROVEMENT_10: {
    name: "Rising Star",
    description: "Your overall wellness score improved by 10+ points.",
    xpValue: 75,
    category: "score" as const,
  },
  INTERVENTIONS_10: {
    name: "Wellness Practitioner",
    description: "Completed 10 micro-interventions.",
    xpValue: 100,
    category: "intervention" as const,
  },
  INTERVENTIONS_50: {
    name: "Wellness Master",
    description: "Completed 50 micro-interventions.",
    xpValue: 300,
    category: "intervention" as const,
  },
  LOW_STRESS_WEEK: {
    name: "Zen Mode",
    description: "Maintained stress below 30 for an entire week.",
    xpValue: 150,
    category: "score" as const,
  },
  PERFECT_BALANCE: {
    name: "Balanced Life",
    description: "Achieved a balance score of 90+ for 3 consecutive days.",
    xpValue: 200,
    category: "score" as const,
  },
  MOVEMENT_CHAMPION: {
    name: "Movement Champion",
    description: "Detected consistent movement for 5 consecutive days.",
    xpValue: 125,
    category: "milestone" as const,
  },
} as const;
