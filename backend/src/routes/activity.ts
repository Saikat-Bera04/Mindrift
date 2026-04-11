import { Router, Request, Response } from "express";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/clerk.js";

export const activityRouter = Router();

function cleanString(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function optionalNumber(value: unknown): number | undefined {
  if (value === null || value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

activityRouter.post("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const type = cleanString(req.body.type);
    const title = cleanString(req.body.title);
    const duration = optionalNumber(req.body.duration);
    const notes = cleanString(req.body.notes);
    const intensity = cleanString(req.body.intensity);

    if (!type || !title) {
      return res.status(400).json({ error: "type and title are required" });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const timestamp = req.body.timestamp ? new Date(req.body.timestamp) : new Date();
    const safeTimestamp = Number.isNaN(timestamp.getTime()) ? new Date() : timestamp;
    const date = safeTimestamp.toISOString().split("T")[0];

    const activity = await prisma.activityEntry.create({
      data: {
        userId: user.id,
        type,
        title,
        duration,
        notes,
        intensity,
        timestamp: safeTimestamp,
        date,
      },
    });

    await prisma.gamification.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        xp: 5,
        level: 1,
        streak: 0,
        lastActivityDate: date,
      },
      update: {
        xp: { increment: 5 },
        lastActivityDate: date,
      },
    });

    res.json({ success: true, activity });
  } catch (error) {
    console.error("Error creating activity entry:", error);
    res.status(500).json({ error: "Failed to save activity entry" });
  }
});

activityRouter.get("/", requireAuth, async (req: Request, res: Response) => {
  try {
    const clerkUserId = req.clerkUserId!;
    const days = optionalNumber(req.query.days) ?? 30;

    const user = await prisma.user.findUnique({
      where: { clerkId: clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const activities = await prisma.activityEntry.findMany({
      where: {
        userId: user.id,
        timestamp: { gte: since },
      },
      orderBy: { timestamp: "desc" },
    });

    res.json({ activities });
  } catch (error) {
    console.error("Error fetching activity entries:", error);
    res.status(500).json({ error: "Failed to fetch activity entries" });
  }
});
