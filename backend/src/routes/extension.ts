import { Router, Request, Response } from "express";
import crypto from "crypto";
import { prisma } from "../lib/prisma.js";
import { requireAuth } from "../middleware/clerk.js";

type PairingRecord = {
  code: string;
  clerkUserId: string;
  deviceName?: string;
  expiresAt: number;
};

const pairingCodes = new Map<string, PairingRecord>();
const TOKEN_BYTES = 32;

export const extensionRouter = Router();

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function pruneExpiredPairingCodes() {
  const now = Date.now();
  for (const [code, pairing] of pairingCodes) {
    if (pairing.expiresAt <= now) {
      pairingCodes.delete(code);
    }
  }
}

setInterval(pruneExpiredPairingCodes, 60 * 1000).unref();

extensionRouter.post("/pairing-codes", requireAuth, async (req: Request, res: Response) => {
  try {
    pruneExpiredPairingCodes();

    const code = crypto.randomInt(100000, 999999).toString();
    const expiresAt = Date.now() + 10 * 60 * 1000;
    const deviceName =
      typeof req.body?.deviceName === "string" ? req.body.deviceName.slice(0, 80) : undefined;

    pairingCodes.set(code, {
      code,
      clerkUserId: req.clerkUserId!,
      deviceName,
      expiresAt,
    });

    res.json({
      pairingCode: code,
      expiresAt,
      expiresAtIso: new Date(expiresAt).toISOString(),
      ttlSeconds: 600,
    });
  } catch (error) {
    console.error("Error creating extension pairing code:", error);
    res.status(500).json({ error: "Failed to create pairing code" });
  }
});

extensionRouter.post("/pair", async (req: Request, res: Response) => {
  try {
    pruneExpiredPairingCodes();

    const pairingCode = String(req.body?.pairingCode ?? "").trim();
    const pairing = pairingCodes.get(pairingCode);

    if (!pairing) {
      return res.status(404).json({ error: "Invalid or expired pairing code" });
    }

    const user = await prisma.user.findUnique({
      where: { clerkId: pairing.clerkUserId },
    });

    if (!user) {
      return res.status(404).json({ error: "Finish onboarding before pairing the extension" });
    }

    const token = crypto.randomBytes(TOKEN_BYTES).toString("base64url");

    await prisma.extensionToken.create({
      data: {
        userId: user.id,
        tokenHash: hashToken(token),
        deviceName: pairing.deviceName ?? "Chrome Extension",
      },
    });

    pairingCodes.delete(pairingCode);

    res.json({
      token,
      deviceName: pairing.deviceName ?? "Chrome Extension",
    });
  } catch (error) {
    console.error("Error pairing extension:", error);
    res.status(500).json({ error: "Failed to pair extension" });
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
