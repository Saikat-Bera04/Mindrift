import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { upsertInsightVector } from "../lib/pinecone.js";
import { requireAuth } from "../middleware/clerk.js";

export const insightsRouter = Router();

// GET /insights - Get user's insights
insightsRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const insights = await prisma.insight.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json({ insights });
  } catch (error) {
    console.error("Error fetching insights:", error);
    res.status(500).json({ error: "Failed to fetch insights" });
  }
});

// POST /insights/mood-analysis - Analyze moods and generate insights
insightsRouter.post("/mood-analysis", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch recent moods
    const recentMoods = await prisma.mood.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: "desc" },
      take: 30,
    });

    if (recentMoods.length === 0) {
      return res.json({ message: "No moods to analyze yet" });
    }

    // Calculate mood trends
    const averageMood = recentMoods.reduce((sum, m) => sum + m.moodValue, 0) / recentMoods.length;
    const moodTrend = recentMoods.slice(0, 7).reduce((sum, m) => sum + m.moodValue, 0) / Math.min(7, recentMoods.length);

    // Generate insight
    let insightContent = "";
    let insightType = "mood_pattern";

    if (moodTrend > 4) {
      insightContent = "Your mood has been excellent lately! Keep up the great habits.";
    } else if (moodTrend > 3) {
      insightContent = "Your mood is generally positive. Consider engaging in activities that boost your well-being.";
    } else if (moodTrend >= 2.5) {
      insightContent = "Your mood seems neutral. Try some wellness activities to improve your emotional state.";
    } else {
      insightContent = "Your mood has been lower recently. Consider reaching out to someone or practicing self-care.";
    }

    // Store insight in database
    const insight = await prisma.insight.create({
      data: {
        userId: user.id,
        type: insightType,
        title: "Mood Analysis",
        content: insightContent,
      },
    });

    // Store the insight as a searchable vector in Pinecone.
    try {
      await upsertInsightVector({
        id: insight.id,
        userId: user.id,
        type: insight.type,
        title: insight.title,
        content: insight.content,
        createdAt: insight.createdAt,
      });

      await prisma.insight.update({
        where: { id: insight.id },
        data: { embedding: insight.id },
      });
    } catch (pineconeError) {
      console.error("Pinecone error (non-critical):", pineconeError);
    }

    res.json({
      insight,
      analysis: {
        averageMood,
        moodTrend,
        totalMoods: recentMoods.length,
      },
    });
  } catch (error) {
    console.error("Error analyzing moods:", error);
    res.status(500).json({ error: "Failed to analyze moods" });
  }
});

// POST /insights/health-goals - Generate health goals based on metrics
insightsRouter.post("/health-goals", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Fetch recent health metrics
    const recentMetrics = await prisma.healthMetric.findMany({
      where: { userId: user.id },
      orderBy: { timestamp: "desc" },
      take: 30,
    });

    const insights = [];

    // Analyze sleep
    const sleepMetrics = recentMetrics.filter((m) => m.metricType === "sleep");
    if (sleepMetrics.length > 0) {
      const avgSleep = sleepMetrics.reduce((sum, m) => sum + m.value, 0) / sleepMetrics.length;
      const sleepGoal = avgSleep < 7 ? "Try to get at least 7 hours of sleep" : "Great job maintaining healthy sleep!";

      const insight = await prisma.insight.create({
          data: {
            userId: user.id,
            type: "health_recommendation",
            title: "Sleep Goal",
            content: sleepGoal,
          },
        });

      insights.push(insight);
    }

    // Analyze exercise
    const exerciseMetrics = recentMetrics.filter((m) => m.metricType === "exercise");
    if (exerciseMetrics.length > 0) {
      const totalExercise = exerciseMetrics.reduce((sum, m) => sum + m.value, 0);
      const exerciseGoal = totalExercise < 150 ? "Aim for at least 150 minutes of exercise this week" : "Excellent exercise routine!";

      const insight = await prisma.insight.create({
          data: {
            userId: user.id,
            type: "health_recommendation",
            title: "Exercise Goal",
            content: exerciseGoal,
          },
        });

      insights.push(insight);
    }

    for (const insight of insights) {
      try {
        await upsertInsightVector({
          id: insight.id,
          userId: user.id,
          type: insight.type,
          title: insight.title,
          content: insight.content,
          createdAt: insight.createdAt,
        });

        await prisma.insight.update({
          where: { id: insight.id },
          data: { embedding: insight.id },
        });
      } catch (pineconeError) {
        console.error("Pinecone error (non-critical):", pineconeError);
      }
    }

    res.json({ insights });
  } catch (error) {
    console.error("Error generating health goals:", error);
    res.status(500).json({ error: "Failed to generate health goals" });
  }
});
