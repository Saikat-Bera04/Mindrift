import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/clerk.js";
import { processExtensionData } from "../cron.js";

const TOKEN_BYTES = 32;

export const extensionRouter = Router();

extensionRouter.post("/trigger-cron-now", async (req: Request, res: Response) => {
  try {
    await processExtensionData();
    res.json({ message: "6-hour extension data processing cycle triggered successfully." });
  } catch (error) {
    console.error("Error manually triggering cron:", error);
    res.status(500).json({ error: "Failed to trigger cycle" });
  }
});

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

extensionRouter.post("/pairing-codes", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findFirst({
      where: { clerkId: req.clerkUserId! },
    });

    if (!user) {
      return res.status(404).json({ error: "Finish onboarding before pairing the extension" });
    }

    // Prune expired codes for this user
    await prisma.pairingCode.deleteMany({
      where: { 
        OR: [
          { expiresAt: { lte: new Date() } },
          { userId: user.id } // Clear existing codes to avoid confusion
        ]
      }
    });

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const deviceName =
      typeof req.body?.deviceName === "string" ? req.body.deviceName.slice(0, 80) : undefined;

    await prisma.pairingCode.create({
      data: {
        code,
        userId: user.id,
        deviceName,
        expiresAt,
      },
    });

    res.json({
      pairingCode: code,
      expiresAt: expiresAt.getTime(),
      expiresAtIso: expiresAt.toISOString(),
      ttlSeconds: 600,
    });
  } catch (error) {
    console.error("Error creating extension pairing code:", error);
    res.status(500).json({ error: "Failed to create pairing code" });
  }
});

extensionRouter.post("/pair", async (req: Request, res: Response) => {
  try {
    const pairingCode = String(req.body?.pairingCode ?? "").trim();
    
    const pairing = await prisma.pairingCode.findUnique({
      where: { code: pairingCode },
      include: { user: true }
    });

    if (!pairing || pairing.expiresAt < new Date()) {
      if (pairing) {
        await prisma.pairingCode.delete({ where: { id: pairing.id } });
      }
      return res.status(404).json({ error: "Invalid or expired pairing code" });
    }

    const token = crypto.randomBytes(TOKEN_BYTES).toString("base64url");

    await prisma.extensionToken.create({
      data: {
        userId: pairing.userId,
        tokenHash: hashToken(token),
        deviceName: pairing.deviceName ?? "Chrome Extension",
      },
    });

    // Delete the used pairing code
    await prisma.pairingCode.delete({ where: { id: pairing.id } });

    res.json({
      token,
      deviceName: pairing.deviceName ?? "Chrome Extension",
    });
  } catch (error) {
    console.error("Error pairing extension:", error);
    res.status(500).json({ error: "Failed to pair extension" });
  }
});

// GET /extension/stats - Fetch analyzed data for the extension popup
extensionRouter.get("/stats", async (req: Request, res: Response) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing extension token" });
    }

    const tokenHash = hashToken(authHeader.slice(7));
    const extensionToken = await prisma.extensionToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
      },
      include: {
        user: {
          include: {
            activityEntries: {
              take: 10,
              orderBy: { timestamp: "desc" },
            },
            insights: {
              take: 5,
              orderBy: { createdAt: "desc" },
            },
            moods: {
              take: 1,
              orderBy: { timestamp: "desc" },
            }
          }
        },
      },
    });

    if (!extensionToken) {
      return res.status(401).json({ error: "Invalid extension token" });
    }

    const user = extensionToken.user;
    
    // Simple wellness score logic
    let wellnessScore = 85; 
    const recentMood = user.moods[0]?.moodValue || 3;
    wellnessScore += (recentMood - 3) * 5;

    res.json({
      userName: user.displayName || "User",
      wellnessScore: Math.min(100, Math.max(0, wellnessScore)),
      activities: user.activityEntries.map(a => ({
        type: a.type,
        title: a.title,
        duration: a.duration,
        timestamp: a.timestamp.toISOString(),
      })),
      insights: user.insights.map(i => ({
        type: i.type,
        title: i.title,
        content: i.content,
        createdAt: i.createdAt.toISOString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching extension stats:", error);
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

extensionRouter.post("/events/batch", async (req: Request, res: Response) => {
  try {
    const authHeader = req.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Missing extension token" });
    }

    const tokenHash = hashToken(authHeader.slice(7));
    const extensionToken = await prisma.extensionToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
      },
      include: {
        user: true,
      },
    });

    if (!extensionToken) {
      return res.status(401).json({ error: "Invalid extension token" });
    }

    const events = Array.isArray(req.body?.events) ? req.body.events.slice(0, 100) : [];
    if (events.length === 0) {
      return res.status(400).json({ error: "events must be a non-empty array" });
    }

    let inserted = 0;
    let duplicates = 0;

    for (const event of events) {
      const batchId = typeof event.batchId === "string" ? event.batchId : crypto.randomUUID();
      const timestamp =
        typeof event.timestamp === "number" ? new Date(event.timestamp) : new Date(event.timestamp ?? Date.now());

      try {
        await prisma.browserEvent.create({
          data: {
            userId: extensionToken.userId,
            batchId,
            type: String(event.type ?? "unknown").slice(0, 80),
            source: String(event.source ?? "chrome").slice(0, 80),
            category: typeof event.category === "string" ? event.category.slice(0, 80) : undefined,
            payload: event.payload ?? {},
            occurredAt: Number.isNaN(timestamp.getTime()) ? new Date() : timestamp,
          },
        });
        inserted += 1;
      } catch (error: any) {
        if (error?.code === "P2002") {
          duplicates += 1;
        } else {
          throw error;
        }
      }
    }

    await prisma.extensionToken.update({
      where: { id: extensionToken.id },
      data: { lastUsedAt: new Date() },
    });

    res.json({ inserted, duplicates });
  } catch (error) {
    console.error("Error ingesting extension events:", error);
    res.status(500).json({ error: "Failed to ingest extension events" });
  }
});

// GET /extension/devices - List all paired devices for authenticated user
extensionRouter.get("/devices", requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: req.clerkUserId! },
      include: {
        extensionTokens: {
          where: { revokedAt: null },
          select: {
            id: true,
            deviceName: true,
            createdAt: true,
            lastUsedAt: true,
          },
          orderBy: { lastUsedAt: "desc" },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const devices = user.extensionTokens.map((token) => ({
      id: token.id,
      name: token.deviceName || "Unknown Device",
      pairedAt: token.createdAt.toISOString(),
      lastSyncAt: token.lastUsedAt?.toISOString() || null,
      isActive: token.lastUsedAt ? new Date().getTime() - token.lastUsedAt.getTime() < 3600000 : false,
    }));

    res.json({ devices });
  } catch (error) {
    console.error("Error fetching devices:", error);
    res.status(500).json({ error: "Failed to fetch devices" });
  }
});

// DELETE /extension/devices/:deviceId - Unpair and revoke a device
extensionRouter.delete("/devices/:deviceId", requireAuth, async (req: Request, res: Response) => {
  try {
    const { deviceId } = req.params;

    const user = await prisma.user.findUnique({
      where: { clerkId: req.clerkUserId! },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const token = await prisma.extensionToken.findFirst({
      where: {
        id: deviceId,
        userId: user.id,
      },
    });

    if (!token) {
      return res.status(404).json({ error: "Device not found" });
    }

    await prisma.extensionToken.update({
      where: { id: deviceId },
      data: { revokedAt: new Date() },
    });

    res.json({ success: true, message: "Device unpaired successfully" });
  } catch (error) {
    console.error("Error unpairing device:", error);
    res.status(500).json({ error: "Failed to unpair device" });
  }
});
