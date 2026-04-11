// ─── Wellness Score ──────────────────────────────────────────────
export const wellnessScore = 74;

export const miniCards = [
  { label: "Stress", value: 38, unit: "%", trend: "down" as const, color: "#ff4757" },
  { label: "Focus", value: 82, unit: "%", trend: "up" as const, color: "#2ed573" },
  { label: "Balance", value: 65, unit: "%", trend: "stable" as const, color: "#ffa502" },
];

// ─── Screen Time vs Activity (7 days) ──────────────────────────
export const dailyChartData = [
  { day: "Mon", screenTime: 6.2, activity: 1.8 },
  { day: "Tue", screenTime: 7.1, activity: 1.2 },
  { day: "Wed", screenTime: 5.5, activity: 2.4 },
  { day: "Thu", screenTime: 8.0, activity: 0.9 },
  { day: "Fri", screenTime: 6.8, activity: 1.5 },
  { day: "Sat", screenTime: 3.2, activity: 3.8 },
  { day: "Sun", screenTime: 4.1, activity: 3.2 },
];

// ─── Today's Summary ───────────────────────────────────────────
export const todaySummary = {
  screenTime: "5h 42m",
  movementStatus: "Moderate",
  stepsToday: 6842,
  caloriesBurned: 342,
  activeMinutes: 47,
  standHours: 8,
};

// ─── Insights ──────────────────────────────────────────────────
export const behaviorInsights = [
  {
    id: 1,
    type: "warning" as const,
    title: "High Screen Time Detected",
    description: "Your screen time has been above 7 hours for 3 consecutive days. Consider taking more frequent breaks.",
    timestamp: "2h ago",
    impact: "high" as const,
  },
  {
    id: 2,
    type: "info" as const,
    title: "Focus Peak Identified",
    description: "Your focus levels are highest between 9 AM and 11 AM. Schedule your most important tasks during this window.",
    timestamp: "5h ago",
    impact: "medium" as const,
  },
  {
    id: 3,
    type: "success" as const,
    title: "Movement Goal Achieved",
    description: "You've met your daily movement target for the past 5 days. Great consistency!",
    timestamp: "1d ago",
    impact: "low" as const,
  },
  {
    id: 4,
    type: "warning" as const,
    title: "Late Night Usage Spike",
    description: "Screen usage after 10 PM increased by 40% this week. This may affect your sleep quality.",
    timestamp: "1d ago",
    impact: "high" as const,
  },
  {
    id: 5,
    type: "info" as const,
    title: "Posture Reminder Pattern",
    description: "You tend to slouch more after 3 PM. Setting a posture reminder for this time could help.",
    timestamp: "2d ago",
    impact: "medium" as const,
  },
];

export const correlationCards = [
  {
    cause: "Low Movement",
    effect: "Higher Stress (+23%)",
    description: "Days with less than 30 minutes of activity show elevated stress markers.",
    strength: 87,
  },
  {
    cause: "High Screen Time",
    effect: "Reduced Focus (-18%)",
    description: "Screen sessions longer than 2 hours without breaks correlate with focus decline.",
    strength: 72,
  },
  {
    cause: "Morning Exercise",
    effect: "Better Balance (+31%)",
    description: "Morning physical activity is linked to improved emotional balance throughout the day.",
    strength: 91,
  },
  {
    cause: "Sleep Consistency",
    effect: "Lower Stress (-27%)",
    description: "Stable sleep-wake cycles predict lower baseline stress levels.",
    strength: 84,
  },
];

// ─── Activity ──────────────────────────────────────────────────
export const movementStatus = {
  current: "Walking" as const,
  duration: "12 min",
  pace: "Moderate",
};

export const activityStats = {
  estimatedDistance: "4.2 km",
  activeTime: "1h 23m",
  calories: 342,
  steps: 6842,
  floors: 4,
  heartRate: 78,
};

export const activityTimeline = [
  { time: "06:00", status: "idle" as const, duration: "2h" },
  { time: "08:00", status: "walking" as const, duration: "45m" },
  { time: "08:45", status: "idle" as const, duration: "3h 15m" },
  { time: "12:00", status: "walking" as const, duration: "20m" },
  { time: "12:20", status: "idle" as const, duration: "2h 40m" },
  { time: "15:00", status: "running" as const, duration: "30m" },
  { time: "15:30", status: "walking" as const, duration: "15m" },
  { time: "15:45", status: "idle" as const, duration: "1h 15m" },
  { time: "17:00", status: "walking" as const, duration: "25m" },
];

// ─── Reports ───────────────────────────────────────────────────
export const weeklyReportData = [
  { week: "W1", wellness: 68, stress: 42, focus: 75, activity: 1.5 },
  { week: "W2", wellness: 71, stress: 38, focus: 78, activity: 1.8 },
  { week: "W3", wellness: 65, stress: 48, focus: 70, activity: 1.2 },
  { week: "W4", wellness: 74, stress: 35, focus: 82, activity: 2.1 },
];

export const trendSuggestions = [
  {
    title: "Increase Morning Activity",
    description: "Your data shows a 31% improvement in balance on days with morning exercise. Try adding a 15-minute walk before work.",
    priority: "high" as const,
  },
  {
    title: "Implement Screen Breaks",
    description: "Taking a 5-minute break every 50 minutes could reduce your focus decline by 18% based on your patterns.",
    priority: "medium" as const,
  },
  {
    title: "Consistent Sleep Schedule",
    description: "Maintaining a regular sleep-wake cycle could help reduce your stress levels by up to 27%.",
    priority: "high" as const,
  },
  {
    title: "Evening Screen Reduction",
    description: "Limiting screen time after 9 PM may improve your sleep onset time by approximately 20 minutes.",
    priority: "low" as const,
  },
];

// ─── Settings ──────────────────────────────────────────────────
export const settingsData = {
  notifications: {
    dailyReport: true,
    movementReminders: true,
    focusAlerts: false,
    weeklyDigest: true,
    stressWarnings: true,
  },
  privacy: {
    shareAnonymousData: false,
    locationTracking: true,
    healthKitSync: true,
    dataRetentionDays: 90,
  },
};
