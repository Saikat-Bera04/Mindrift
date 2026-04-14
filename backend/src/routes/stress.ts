import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/clerk.js";

export const stressRouter = Router();

// Interface for stress analysis result
interface StressAnalysisResult {
  stressLevel: number; // 0-10
  confidence: number; // 0-100
  factors: {
    sleep: { score: number; impact: "high" | "medium" | "low"; details: string };
    physical: { score: number; impact: "high" | "medium" | "low"; details: string };
    digital: { score: number; impact: "high" | "medium" | "low"; details: string };
    emotional: { score: number; impact: "high" | "medium" | "low"; details: string };
  };
  recommendations: string[];
  motivationalTip: string;
  trend: "improving" | "stable" | "declining" | "unknown";
}

/**
 * Gather all user data from the last 30 days
 */
async function gatherUserData(userId: string) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  // Get user profile
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      sleepHours: true,
      workingHours: true,
      currentStatus: true,
      jobStudyDescription: true,
      relationshipStatus: true,
    },
  });

  // Get mood data (last 30 days)
  const moods = await prisma.mood.findMany({
    where: { 
      userId, 
      timestamp: { gte: thirtyDaysAgo } 
    },
    orderBy: { timestamp: "desc" },
  });

  // Get health metrics (sleep, exercise, etc.)
  const healthMetrics = await prisma.healthMetric.findMany({
    where: { 
      userId, 
      timestamp: { gte: thirtyDaysAgo } 
    },
    orderBy: { timestamp: "desc" },
  });

  // Get physical activities
  const activities = await prisma.activityEntry.findMany({
    where: { 
      userId, 
      timestamp: { gte: thirtyDaysAgo } 
    },
    orderBy: { timestamp: "desc" },
  });

  // Get browser/digital activity from extension
  const browserEvents = await prisma.browserEvent.findMany({
    where: { 
      userId, 
      occurredAt: { gte: thirtyDaysAgo } 
    },
    orderBy: { occurredAt: "desc" },
    take: 100, // Limit to recent 100 events
  });

  // Get gamification/streak data
  const gamification = await prisma.gamification.findUnique({
    where: { userId },
  });

  return {
    user,
    moods,
    healthMetrics,
    activities,
    browserEvents,
    gamification,
  };
}

/**
 * Analyze data and calculate stress metrics
 */
function calculateMetrics(data: Awaited<ReturnType<typeof gatherUserData>>) {
  const { moods, healthMetrics, activities, browserEvents, gamification, user } = data;

  // 1. Manual sleep metrics
  const sleepMetrics = healthMetrics.filter(m => m.metricType === "sleep");
  const manualAvgSleep = sleepMetrics.length > 0 
    ? sleepMetrics.reduce((sum, m) => sum + m.value, 0) / sleepMetrics.length 
    : user?.sleepHours || 7;

  // 2. Automated sleep estimation from browser gaps (idle time)
  // Identify gaps of > 5 hours between 10 PM and 10 AM
  const gaps: number[] = [];
  const nightEvents = browserEvents.filter(e => {
    const hour = new Date(e.occurredAt).getHours();
    return hour >= 22 || hour <= 10;
  }).sort((a, b) => new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime());

  for (let i = 0; i < nightEvents.length - 1; i++) {
    const start = new Date(nightEvents[i].occurredAt).getTime();
    const end = new Date(nightEvents[i+1].occurredAt).getTime();
    const diffHours = (end - start) / (1000 * 60 * 60);
    if (diffHours >= 5 && diffHours <= 12) {
      gaps.push(diffHours);
    }
  }

  const estimatedAvgSleep = gaps.length > 0 
    ? gaps.reduce((a, b) => a + b, 0) / gaps.length 
    : manualAvgSleep;

  // Combine manual and estimated (weighted towards manual if available)
  const avgSleep = sleepMetrics.length > 0 ? manualAvgSleep : estimatedAvgSleep;

  const sleepConsistency = sleepMetrics.length > 1
    ? Math.sqrt(sleepMetrics.reduce((sum, m) => sum + Math.pow(m.value - avgSleep, 2), 0) / sleepMetrics.length)
    : 1;

  // Physical activity analysis
  const exerciseMetrics = healthMetrics.filter(m => m.metricType === "exercise");
  const totalExercise = exerciseMetrics.reduce((sum, m) => sum + m.value, 0);
  const weeklyExerciseAvg = totalExercise / 4.3; // Convert to weekly average

  // Mood analysis
  const avgMood = moods.length > 0
    ? moods.reduce((sum, m) => sum + m.moodValue, 0) / moods.length
    : 3;
  const moodVariance = moods.length > 1
    ? moods.reduce((sum, m) => sum + Math.pow(m.moodValue - avgMood, 2), 0) / moods.length
    : 0;

  // Digital wellness analysis (Emotional Segregation)
  const socialEvents = browserEvents.filter(e => e.type === "social" || (e.payload as any)?.category === "social");
  const stressEvents = browserEvents.filter(e => e.type === "stress" || (e.payload as any)?.category === "stress");
  const sadEvents = browserEvents.filter(e => e.type === "sad" || (e.payload as any)?.category === "sad");
  const studyEvents = browserEvents.filter(e => e.type === "education" || (e.payload as any)?.category === "education");

  // Screen time estimation (from browser events)
  const screenTimeEstimate = browserEvents.length * 5; // Rough estimate: 5 mins per event

  return {
    sleep: {
      average: avgSleep,
      estimated: gaps.length > 0,
      consistency: sleepConsistency,
      entries: sleepMetrics.length,
      quality: avgSleep >= 7 && sleepConsistency < 1 ? "good" : avgSleep >= 6 ? "fair" : "poor",
    },
    physical: {
      weeklyExerciseMinutes: weeklyExerciseAvg,
      totalActivities: activities.length,
      consistency: activities.length / 30, // Daily activity rate
    },
    emotional: {
      averageMood: avgMood,
      moodStability: Math.sqrt(moodVariance),
      totalEntries: moods.length,
      signals: {
        stress: stressEvents.length,
        sadness: sadEvents.length,
        study: studyEvents.length,
      }
    },
    digital: {
      socialMediaSessions: socialEvents.length,
      highStressSessions: stressEvents.length,
      estimatedScreenTime: screenTimeEstimate,
      digitalBalance: studyEvents.length > socialEvents.length ? "good" : "distracted",
    },
    engagement: {
      streak: gamification?.streak || 0,
      level: gamification?.level || 1,
      xp: gamification?.xp || 0,
    },
    profile: {
      workingHours: user?.workingHours || 8,
      sleepHours: user?.sleepHours || 7,
      status: user?.currentStatus || "unknown",
    },
  };
}

/**
 * Generate stress analysis using Gemini AI
 */
async function generateStressAnalysisWithGemini(
  metrics: ReturnType<typeof calculateMetrics>
): Promise<StressAnalysisResult> {
  const geminiKey = process.env.GEMINI_API_KEY;
  
  if (!geminiKey) {
    // Fallback to rule-based calculation if Gemini is not configured
    return generateRuleBasedAnalysis(metrics);
  }

  const prompt = `
You are a mental health AI assistant. Analyze the following user's wellness data from the last 30 days and calculate their stress level.

USER DATA SUMMARY:
- Sleep: ${metrics.sleep.average.toFixed(1)} hours/night (${metrics.sleep.estimated ? 'ESTIMATED from screen-off time' : 'MANUAL entry'}, quality: ${metrics.sleep.quality})
- Physical Activity: ${metrics.physical.weeklyExerciseMinutes.toFixed(0)} minutes/week, ${metrics.physical.totalActivities} activities total
- Mood: Average ${metrics.emotional.averageMood.toFixed(1)}/5, signals: ${metrics.emotional.signals.stress} stress-related browsing, ${metrics.emotional.signals.sadness} sadness-related browsing, ${metrics.emotional.signals.study} study sessions.
- Digital Habits: ${metrics.digital.socialMediaSessions} social media sessions, ~${metrics.digital.estimatedScreenTime} min total estimated screen time.
- Engagement: ${metrics.engagement.streak} day streak, Level ${metrics.engagement.level}

STRESS FACTORS TO CONSIDER:
1. Sleep patterns: ${metrics.sleep.average < 7 ? 'DEPRIVED' : 'ADEQUATE'}. ${metrics.sleep.estimated ? 'Based on screen activity.' : ''}
2. Physical activity: ${metrics.physical.weeklyExerciseMinutes < 150 ? 'INSUFFICIENT' : 'GOOD'}.
3. Browser behavioral segregation:
   - Study focus: ${metrics.emotional.signals.study} sessions.
   - Stress/Anxiety signals: ${metrics.emotional.signals.stress} sessions.
   - Sadness signals: ${metrics.emotional.signals.sadness} sessions.
4. Social media vs Productivity balance.

Calculate a combined stress score from 0-10.
Respond ONLY in this JSON format:
{
  "stressLevel": number,
  "confidence": number,
  "factors": {
    "sleep": { "score": 0-10, "impact": "high|medium|low", "details": "specific explanation" },
    "physical": { "score": 0-10, "impact": "high|medium|low", "details": "specific explanation" },
    "digital": { "score": 0-10, "impact": "high|medium|low", "details": "specific explanation of browser history segregation (study vs stress vs sad)" },
    "emotional": { "score": 0-10, "impact": "high|medium|low", "details": "mood and behavioral signals" }
  },
  "recommendations": ["3-4 specific actionable tips"],
  "motivationalTip": "Empathetic message",
  "trend": "improving|stable|declining|unknown"
}
`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ 
              text: "You are a compassionate mental wellness AI. Provide accurate stress assessments and genuinely helpful, personalized advice." 
            }],
          },
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 1024,
            temperature: 0.4,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    // Parse the JSON response
    let result: StressAnalysisResult;
    try {
      // Extract JSON from the response (it might be wrapped in markdown code blocks)
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      result = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", text);
      return generateRuleBasedAnalysis(metrics);
    }

    // Validate and clamp values
    result.stressLevel = Math.max(0, Math.min(10, result.stressLevel));
    result.confidence = Math.max(0, Math.min(100, result.confidence));
    
    return result;
  } catch (error) {
    console.error("Gemini analysis failed:", error);
    return generateRuleBasedAnalysis(metrics);
  }
}

/**
 * Fallback rule-based stress calculation
 */
function generateRuleBasedAnalysis(
  metrics: ReturnType<typeof calculateMetrics>
): StressAnalysisResult {
  // Calculate individual factor scores (0-10, higher = more stressful)
  const sleepScore = Math.max(0, Math.min(10, 
    (7 - metrics.sleep.average) * 2 + metrics.sleep.consistency * 2
  ));
  
  const physicalScore = Math.max(0, Math.min(10, 
    10 - (metrics.physical.weeklyExerciseMinutes / 150) * 10
  ));
  
  const emotionalScore = Math.max(0, Math.min(10, 
    (5 - metrics.emotional.averageMood) * 2 + metrics.emotional.moodStability
  ));
  
  const digitalScore = Math.max(0, Math.min(10, 
    (metrics.digital.socialMediaSessions / 50) * 5 + 
    (metrics.digital.estimatedScreenTime / 300) * 5
  ));

  // Weighted average for overall stress
  const stressLevel = Math.round(
    (sleepScore * 0.3 + physicalScore * 0.25 + emotionalScore * 0.35 + digitalScore * 0.1) * 10
  ) / 10;

  const recommendations: string[] = [];
  
  if (metrics.sleep.average < 7) {
    recommendations.push("Aim for 7-9 hours of sleep. Try a consistent bedtime routine.");
  }
  if (metrics.physical.weeklyExerciseMinutes < 150) {
    recommendations.push("Add 30 minutes of moderate exercise 5 days a week.");
  }
  if (metrics.emotional.averageMood < 3) {
    recommendations.push("Consider journaling or talking to someone about your feelings.");
  }
  if (metrics.digital.socialMediaSessions > 30) {
    recommendations.push("Try limiting social media to specific times of day.");
  }

  const motivationalTips = [
    "You're taking steps to understand yourself better - that's a sign of strength.",
    "Small changes add up to big improvements. You've got this!",
    "Remember: progress, not perfection. Every day is a new opportunity.",
    "Self-care isn't selfish - it's necessary. Prioritize your well-being.",
  ];

  return {
    stressLevel,
    confidence: 70,
    factors: {
      sleep: { 
        score: sleepScore, 
        impact: sleepScore > 6 ? "high" : sleepScore > 4 ? "medium" : "low",
        details: `Sleeping ${metrics.sleep.average.toFixed(1)}h on average` 
      },
      physical: { 
        score: physicalScore, 
        impact: physicalScore > 6 ? "high" : physicalScore > 4 ? "medium" : "low",
        details: `${metrics.physical.weeklyExerciseMinutes.toFixed(0)} min exercise/week` 
      },
      digital: { 
        score: digitalScore, 
        impact: digitalScore > 6 ? "high" : digitalScore > 4 ? "medium" : "low",
        details: `${metrics.digital.socialMediaSessions} social sessions` 
      },
      emotional: { 
        score: emotionalScore, 
        impact: emotionalScore > 6 ? "high" : emotionalScore > 4 ? "medium" : "low",
        details: `Mood avg ${metrics.emotional.averageMood.toFixed(1)}/5` 
      },
    },
    recommendations: recommendations.length > 0 ? recommendations : ["Keep up the great work! Maintain your healthy habits."],
    motivationalTip: motivationalTips[Math.floor(Math.random() * motivationalTips.length)],
    trend: "unknown",
  };
}

// GET /stress/analysis - Get current stress analysis
stressRouter.get("/analysis", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Gather all data
    const userData = await gatherUserData(user.id);
    
    // Calculate metrics
    const metrics = calculateMetrics(userData);
    
    // Generate AI analysis
    const analysis = await generateStressAnalysisWithGemini(metrics);

    // Store the analysis in database (optional - for tracking over time)
    await prisma.insight.create({
      data: {
        userId: user.id,
        type: "stress_analysis",
        title: `Stress Level: ${analysis.stressLevel}/10`,
        content: JSON.stringify({
          stressLevel: analysis.stressLevel,
          factors: analysis.factors,
          recommendations: analysis.recommendations,
          motivationalTip: analysis.motivationalTip,
        }),
      },
    });

    res.json({
      success: true,
      analysis,
      metrics: {
        dataPoints: {
          moods: userData.moods.length,
          healthMetrics: userData.healthMetrics.length,
          activities: userData.activities.length,
          browserEvents: userData.browserEvents.length,
        },
        summary: metrics,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error generating stress analysis:", error);
    res.status(500).json({ 
      error: "Failed to generate stress analysis",
      details: error instanceof Error ? error.message : "Unknown error"
    });
  }
});

// GET /stress/history - Get stress analysis history
stressRouter.get("/history", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const days = parseInt(req.query.days as string) || 30;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const history = await prisma.insight.findMany({
      where: {
        userId: user.id,
        type: "stress_analysis",
        createdAt: { gte: since },
      },
      orderBy: { createdAt: "desc" },
    });

    // Parse the stored JSON content
    const parsedHistory = history.map(h => {
      try {
        const content = JSON.parse(h.content);
        return {
          id: h.id,
          date: h.createdAt,
          stressLevel: content.stressLevel,
          factors: content.factors,
          recommendations: content.recommendations,
          motivationalTip: content.motivationalTip,
        };
      } catch {
        return null;
      }
    }).filter(Boolean);

    res.json({
      history: parsedHistory,
      trend: calculateTrend(parsedHistory.map(h => h?.stressLevel).filter(Boolean) as number[]),
    });
  } catch (error) {
    console.error("Error fetching stress history:", error);
    res.status(500).json({ error: "Failed to fetch stress history" });
  }
});

function calculateTrend(levels: number[]): "improving" | "declining" | "stable" | "unknown" {
  if (levels.length < 2) return "unknown";
  
  const recent = levels.slice(0, Math.ceil(levels.length / 3));
  const older = levels.slice(-Math.ceil(levels.length / 3));
  
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;
  
  const diff = olderAvg - recentAvg; // Positive = improving (stress going down)
  
  if (diff > 0.5) return "improving";
  if (diff < -0.5) return "declining";
  return "stable";
}

// POST /stress/quick-check - Quick stress check with minimal data
stressRouter.post("/quick-check", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { currentMood, sleepLastNight, stressFeel } = req.body;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const geminiKey = process.env.GEMINI_API_KEY;
    
    if (!geminiKey) {
      // Simple fallback calculation
      const stressEstimate = Math.round(
        ((5 - currentMood) * 1.5 + (8 - sleepLastNight) * 1 + stressFeel) / 3 * 10
      ) / 10;
      
      return res.json({
        success: true,
        quickAssessment: {
          estimatedStress: Math.max(0, Math.min(10, stressEstimate)),
          message: stressEstimate > 6 
            ? "Your responses suggest you might be experiencing higher stress. Consider taking a break."
            : "Your stress levels seem manageable. Keep practicing self-care!",
        },
      });
    }

    const prompt = `
Based on this quick wellness check:
- Current mood: ${currentMood}/5
- Sleep last night: ${sleepLastNight} hours
- Self-reported stress: ${stressFeel}/10

Provide a brief stress assessment and one personalized tip.
Respond in JSON format:
{
  "estimatedStress": number,
  "message": "empathetic response (1 sentence)",
  "tip": "specific actionable advice"
}
`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: 256,
            temperature: 0.5,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
    
    let result;
    try {
      const jsonMatch = text.match(/```json\n?([\s\S]*?)\n?```/) || text.match(/\{[\s\S]*\}/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      result = JSON.parse(jsonStr);
    } catch {
      result = { 
        estimatedStress: Math.round((currentMood + sleepLastNight + (10 - stressFeel)) / 3),
        message: "Thanks for checking in with yourself!",
        tip: "Take a few deep breaths and drink some water."
      };
    }

    res.json({
      success: true,
      quickAssessment: result,
    });
  } catch (error) {
    console.error("Error in quick stress check:", error);
    res.status(500).json({ error: "Failed to process quick check" });
  }
});
