import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/clerk.js";

export const moodsRouter = Router();

// POST /moods - Log a mood
moodsRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const { moodValue, notes } = req.body;
    const clerkUserId = req.clerkUserId!;

    if (!moodValue || moodValue < 1 || moodValue > 5) {
      return res.status(400).json({ error: "moodValue must be between 1-5" });
    }

    // Get or create user by Clerk ID
    let user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      // Should have been created on signup, but handle it just in case
      return res.status(404).json({ error: "User not found" });
    }

    const now = Date.now();
    const today = new Date(now).toISOString().split("T")[0];

    const mood = await prisma.mood.create({
      data: {
        userId: user.id,
        moodValue,
        notes: notes || undefined,
        timestamp: new Date(now),
        date: today,
      },
    });

    // Update gamification XP
    await prisma.gamification.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        xp: 10,
        lastActivityDate: today,
      },
      update: {
        xp: { increment: 10 },
        lastActivityDate: today,
      },
    });

    res.json({ success: true, mood });
  } catch (error) {
    console.error("Error logging mood:", error);
    res.status(500).json({ error: "Failed to log mood" });
  }
});

// GET /moods - Get user's moods
moodsRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { days = 30 } = req.query;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const since = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

    const moods = await prisma.mood.findMany({
      where: {
        userId: user.id,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: "desc" },
    });

    res.json({ moods });
  } catch (error) {
    console.error("Error fetching moods:", error);
    res.status(500).json({ error: "Failed to fetch moods" });
  }
});

// GET /moods/stats - Get mood statistics
moodsRouter.get("/stats", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const today = new Date().toISOString().split("T")[0];

    const moods = await prisma.mood.findMany({
      where: {
        userId: user.id,
        date: today,
      },
    });

    const average = moods.length > 0 ? moods.reduce((sum, m) => sum + m.moodValue, 0) / moods.length : 0;

    res.json({
      totalToday: moods.length,
      average,
      moods,
    });
  } catch (error) {
    console.error("Error fetching mood stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});
