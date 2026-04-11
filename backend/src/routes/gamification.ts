import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/clerk.js";

export const gamificationRouter = Router();

// GET /gamification - Get user's gamification stats
gamificationRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const gamification = await prisma.gamification.findUnique({
      where: { userId: user.id },
    });

    if (!gamification) {
      // Create default gamification
      const newGamification = await prisma.gamification.create({
        data: {
          userId: user.id,
          xp: 0,
          level: 1,
          streak: 0,
        },
      });
      return res.json(newGamification);
    }

    res.json(gamification);
  } catch (error) {
    console.error("Error fetching gamification stats:", error);
    res.status(500).json({ error: "Failed to fetch gamification stats" });
  }
});

// GET /gamification/leaderboard - Get top users by XP
gamificationRouter.get("/leaderboard", async (_req: Request, res: Response) => {
  try {
    const topUsers = await prisma.gamification.findMany({
      take: 10,
      orderBy: { xp: "desc" },
      include: {
        user: {
          select: {
            displayName: true,
          },
        },
      },
    });

    res.json({ leaderboard: topUsers });
  } catch (error) {
    console.error("Error fetching leaderboard:", error);
    res.status(500).json({ error: "Failed to fetch leaderboard" });
  }
});
