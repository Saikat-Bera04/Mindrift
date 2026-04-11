import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/clerk.js";

const router = Router();

// Basic health check
router.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    environment: process.env.NODE_ENV ?? "development",
  });
});

// POST /health/metric - Log a health metric
router.post("/metric", requireAuth, async (req: Request, res: Response) => {
  try {
    const { metricType, value, unit, notes } = req.body;
    const clerkUserId = req.clerkUserId!;

    if (!metricType || !value) {
      return res.status(400).json({ error: "metricType and value are required" });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const now = Date.now();
    const today = new Date(now).toISOString().split("T")[0];

    const metric = await prisma.healthMetric.create({
      data: {
        userId: user.id,
        metricType,
        value,
        unit: unit || undefined,
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
        xp: 5,
        lastActivityDate: today,
      },
      update: {
        xp: { increment: 5 },
        lastActivityDate: today,
      },
    });

    res.json({ success: true, metric });
  } catch (error) {
    console.error("Error logging health metric:", error);
    res.status(500).json({ error: "Failed to log health metric" });
  }
});

// GET /health/metrics - Get user's health metrics
router.get("/metrics", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const { days = 30, metricType } = req.query;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const since = new Date(Date.now() - parseInt(days as string) * 24 * 60 * 60 * 1000);

    const metrics = await prisma.healthMetric.findMany({
      where: {
        userId: user.id,
        timestamp: { gte: since },
        ...(metricType && { metricType: metricType as string }),
      },
      orderBy: { timestamp: "desc" },
    });

    res.json({ metrics });
  } catch (error) {
    console.error("Error fetching health metrics:", error);
    res.status(500).json({ error: "Failed to fetch health metrics" });
  }
});

export { router as healthRouter };
