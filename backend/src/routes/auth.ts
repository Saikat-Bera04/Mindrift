import { Router, Request, Response } from "express";
import crypto from "crypto";

const router = Router();

// ─── In-memory store for pairing codes (use Redis in production) ─
const pairingCodes = new Map<
  string,
  {
    code: string;
    userId?: string;
    deviceName?: string;
    expiresAt: number;
    status: "pending" | "paired" | "expired";
  }
>();

// ─── Cleanup expired codes periodically ─────────────────────────
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of pairingCodes) {
    if (value.expiresAt < now) {
      pairingCodes.delete(key);
    }
  }
}, 60 * 1000); // every minute

// ─── POST /auth/device-pair — Generate pairing code ──────────────
// Extension calls this to get a code that user enters in the web app
router.post("/device-pair", async (req: Request, res: Response) => {
  const code = crypto.randomInt(100000, 999999).toString();
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes

  pairingCodes.set(code, {
    code,
    expiresAt,
    status: "pending",
  });

  res.json({
    pairingCode: code,
    expiresAt: new Date(expiresAt).toISOString(),
    ttlSeconds: 600,
  });
});

// ─── POST /auth/pair-confirm — Web app confirms pairing ─────────
// User enters the code in web app, which calls this with their auth
router.post("/pair-confirm", async (req: Request, res: Response) => {
  const { pairingCode, userId, deviceName } = req.body as {
    pairingCode: string;
    userId: string;
    deviceName?: string;
  };

  if (!pairingCode || !userId) {
    res.status(400).json({ error: "Missing pairingCode or userId" });
    return;
  }

  const pairing = pairingCodes.get(pairingCode);
  if (!pairing) {
    res.status(404).json({ error: "Invalid or expired pairing code" });
    return;
  }

  if (pairing.expiresAt < Date.now()) {
    pairingCodes.delete(pairingCode);
    res.status(410).json({ error: "Pairing code expired" });
    return;
  }

  // Confirm pairing
  pairing.userId = userId;
  pairing.deviceName = deviceName;
  pairing.status = "paired";

  // Generate a session token for the extension
  const sessionToken = crypto.randomBytes(32).toString("hex");

  res.json({
    success: true,
    sessionToken,
    userId,
  });
});

// ─── POST /auth/token-exchange — Extension exchanges code for token
router.post(
  "/token-exchange",
  async (req: Request, res: Response) => {
    const { pairingCode } = req.body as { pairingCode: string };

    if (!pairingCode) {
      res.status(400).json({ error: "Missing pairingCode" });
      return;
    }

    const pairing = pairingCodes.get(pairingCode);
    if (!pairing) {
      res.status(404).json({ error: "Invalid pairing code" });
      return;
    }

    if (pairing.status === "pending") {
      // Not yet confirmed by web app
      res.json({
        status: "pending",
        message: "Waiting for user to confirm in web app",
      });
      return;
    }

    if (pairing.status === "paired" && pairing.userId) {
      // Exchange successful — clean up
      pairingCodes.delete(pairingCode);

      const accessToken = crypto.randomBytes(32).toString("hex");

      res.json({
        status: "paired",
        accessToken,
        userId: pairing.userId,
        deviceName: pairing.deviceName,
      });
      return;
    }

    res.status(400).json({ error: "Invalid pairing state" });
  }
);

// ─── GET /auth/verify — Verify extension token ──────────────────
router.get("/verify", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  // In production, verify against stored tokens
  // For now, return a basic validation response
  const token = authHeader.slice(7);
  if (token.length < 32) {
    res.status(401).json({ error: "Invalid token" });
    return;
  }

  res.json({ valid: true, message: "Token accepted" });
});

export { router as authRouter };
