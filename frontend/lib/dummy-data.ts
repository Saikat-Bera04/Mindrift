export const wellnessScore = 78;

export const quickStats = [
  { id: 'mood-streak', label: 'Mood Streak', value: '12', unit: 'days', trend: '+3', positive: true },
  { id: 'sleep-quality', label: 'Sleep Quality', value: '7.2', unit: 'hrs', trend: '+0.5', positive: true },
  { id: 'stress-level', label: 'Stress Level', value: '34', unit: '%', trend: '-8', positive: true },
  { id: 'mindfulness', label: 'Mindfulness', value: '45', unit: 'min', trend: '+12', positive: true },
];

export const weeklyMoodData = [
  { day: 'Mon', score: 4 },
  { day: 'Tue', score: 3 },
  { day: 'Wed', score: 5 },
  { day: 'Thu', score: 4 },
  { day: 'Fri', score: 2 },
  { day: 'Sat', score: 4 },
  { day: 'Sun', score: 5 },
];

export const recentActivities = [
  { id: 1, type: 'meditation', title: 'Morning Meditation', duration: '15 min', time: '8:30 AM', icon: '🧘' },
  { id: 2, type: 'journal', title: 'Gratitude Journal', duration: '10 min', time: '9:00 AM', icon: '📝' },
  { id: 3, type: 'exercise', title: 'Yoga Session', duration: '30 min', time: '10:15 AM', icon: '🏃' },
  { id: 4, type: 'breathing', title: 'Deep Breathing', duration: '5 min', time: '2:00 PM', icon: '🌬️' },
  { id: 5, type: 'sleep', title: 'Sleep Logged', duration: '7.5 hrs', time: '7:00 AM', icon: '😴' },
];

export const moodOptions = [
  { value: 1, label: 'Awful', emoji: '😣', color: '#ef4444' },
  { value: 2, label: 'Bad', emoji: '😕', color: '#f97316' },
  { value: 3, label: 'Okay', emoji: '😐', color: '#eab308' },
  { value: 4, label: 'Good', emoji: '🙂', color: '#22c55e' },
  { value: 5, label: 'Great', emoji: '😊', color: '#06b6d4' },
];

export const insights = [
  { id: 1, title: 'Sleep Pattern Improvement', description: 'Your sleep consistency improved by 23% this week. Maintaining a regular schedule correlates with better mood scores.', category: 'sleep', impact: 'high', trend: 'positive' },
  { id: 2, title: 'Stress Spike Detected', description: 'Wednesday showed elevated stress. This coincided with reduced meditation time. Consider a brief mindfulness session on busy days.', category: 'stress', impact: 'medium', trend: 'warning' },
  { id: 3, title: 'Meditation Streak', description: "You've maintained a 12-day meditation streak! Consistent practice for 21+ days significantly reduces anxiety.", category: 'mindfulness', impact: 'high', trend: 'positive' },
  { id: 4, title: 'Social Connection', description: 'Mood scores are 40% higher on days with social activities. Schedule at least one social interaction daily.', category: 'social', impact: 'medium', trend: 'positive' },
];

export const trendData = [
  { week: 'W1', mood: 3.2, sleep: 6.8, stress: 45, mindfulness: 20 },
  { week: 'W2', mood: 3.5, sleep: 7.0, stress: 42, mindfulness: 25 },
  { week: 'W3', mood: 3.8, sleep: 7.2, stress: 38, mindfulness: 30 },
  { week: 'W4', mood: 4.1, sleep: 7.5, stress: 34, mindfulness: 45 },
];

export const activityLog = [
  { id: 1, date: '2026-04-11', type: 'meditation', title: 'Morning Meditation', duration: 15, notes: 'Focused on breathing' },
  { id: 2, date: '2026-04-11', type: 'journal', title: 'Gratitude Journal', duration: 10, notes: '3 things grateful for' },
  { id: 3, date: '2026-04-10', type: 'exercise', title: 'Evening Walk', duration: 30, notes: 'Park trail' },
  { id: 4, date: '2026-04-10', type: 'meditation', title: 'Guided Relaxation', duration: 20, notes: 'Body scan' },
  { id: 5, date: '2026-04-09', type: 'breathing', title: 'Box Breathing', duration: 5, notes: '4-4-4-4 pattern' },
  { id: 6, date: '2026-04-09', type: 'journal', title: 'Mood Journal', duration: 15, notes: 'Reflected on anxiety triggers' },
  { id: 7, date: '2026-04-08', type: 'exercise', title: 'Yoga Flow', duration: 45, notes: 'Vinyasa flow' },
  { id: 8, date: '2026-04-08', type: 'meditation', title: 'Loving-Kindness', duration: 10, notes: 'Metta meditation' },
];

export const habits = [
  { id: 'meditation', name: 'Meditation', target: 15, unit: 'min', streak: 12, completionRate: 85, color: '#f59e0b' },
  { id: 'journal', name: 'Journaling', target: 1, unit: 'entry', streak: 8, completionRate: 72, color: '#06b6d4' },
  { id: 'exercise', name: 'Exercise', target: 30, unit: 'min', streak: 5, completionRate: 65, color: '#10b981' },
  { id: 'sleep', name: 'Sleep 7+ hrs', target: 7, unit: 'hrs', streak: 10, completionRate: 80, color: '#8b5cf6' },
  { id: 'hydration', name: 'Hydration', target: 8, unit: 'glasses', streak: 3, completionRate: 55, color: '#3b82f6' },
];

export const habitGridData = [
  [1,1,0.5,1,0],[1,1,1,1,0.5],[0.5,1,0,1,1],[1,0.5,1,1,0],[1,1,1,0.5,1],
  [1,0,0.5,1,1],[0.5,1,1,1,0],[1,1,0,0.5,1],[1,1,1,1,1],[0,0.5,1,1,0.5],
  [1,1,1,0,1],[1,0.5,0.5,1,1],[1,1,1,1,0],[0.5,1,0,1,1],[1,1,1,0.5,1],
  [1,0,1,1,0.5],[1,1,0.5,1,1],[0,1,1,0.5,0],[1,1,1,1,1],[1,0.5,0,1,1],
  [0.5,1,1,1,0],[1,1,1,0,1],[1,0,0.5,1,1],[1,1,1,1,0.5],[0,1,1,1,1],
  [1,1,0,0.5,1],[1,0.5,1,1,1],[0.5,1,1,1,0],[1,1,1,0,1],[1,1,0.5,1,1],
];

export const monthlyMoodData = [
  { date: 'Apr 1', score: 3.5 },{ date: 'Apr 2', score: 4.0 },{ date: 'Apr 3', score: 3.8 },
  { date: 'Apr 4', score: 4.2 },{ date: 'Apr 5', score: 3.0 },{ date: 'Apr 6', score: 4.5 },
  { date: 'Apr 7', score: 4.8 },{ date: 'Apr 8', score: 4.0 },{ date: 'Apr 9', score: 3.5 },
  { date: 'Apr 10', score: 4.2 },{ date: 'Apr 11', score: 4.5 },
];

export const sleepData = [
  { date: 'Apr 1', hours: 6.5, quality: 65 },{ date: 'Apr 2', hours: 7.0, quality: 72 },
  { date: 'Apr 3', hours: 7.2, quality: 78 },{ date: 'Apr 4', hours: 6.8, quality: 70 },
  { date: 'Apr 5', hours: 7.5, quality: 82 },{ date: 'Apr 6', hours: 8.0, quality: 88 },
  { date: 'Apr 7', hours: 7.3, quality: 75 },{ date: 'Apr 8', hours: 7.0, quality: 72 },
  { date: 'Apr 9', hours: 7.8, quality: 85 },{ date: 'Apr 10', hours: 7.2, quality: 78 },
  { date: 'Apr 11', hours: 7.5, quality: 80 },
];

export const moodDistribution = [
  { mood: 'Great', count: 8, percentage: 28, color: '#06b6d4' },
  { mood: 'Good', count: 12, percentage: 40, color: '#22c55e' },
  { mood: 'Okay', count: 5, percentage: 17, color: '#eab308' },
  { mood: 'Bad', count: 3, percentage: 10, color: '#f97316' },
  { mood: 'Awful', count: 2, percentage: 5, color: '#ef4444' },
];

export const weeklyComparison = [
  { metric: 'Avg Mood', thisWeek: '4.1', lastWeek: '3.6', change: '+14%', positive: true },
  { metric: 'Sleep Hours', thisWeek: '7.4', lastWeek: '6.9', change: '+7%', positive: true },
  { metric: 'Meditation', thisWeek: '45m', lastWeek: '30m', change: '+50%', positive: true },
  { metric: 'Stress Level', thisWeek: '34%', lastWeek: '42%', change: '-19%', positive: true },
  { metric: 'Activities', thisWeek: '18', lastWeek: '14', change: '+29%', positive: true },
];

export const userProfile = {
  name: 'Alex Rivera',
  email: 'alex.rivera@example.com',
  joinedDate: 'March 2026',
  plan: 'Premium',
  timezone: 'IST (UTC+5:30)',
};
