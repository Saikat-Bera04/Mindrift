import { Router, Request, Response } from "express";

const router = Router();

// ─── GET /health — Basic health check ───────────────────────────
router.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: "1.0.0",
    environment: process.env.NODE_ENV ?? "development",
  });
});

// ─── GET /health/convex — Convex connection status ──────────────
router.get("/convex", async (_req: Request, res: Response) => {
  const convexUrl = process.env.CONVEX_URL;

  if (!convexUrl) {
    res.status(503).json({
      status: "unhealthy",
      error: "CONVEX_URL not configured",
    });
    return;
  }

  try {
    // Simple connectivity check
    const response = await fetch(convexUrl, {
      method: "OPTIONS",
      signal: AbortSignal.timeout(5000),
    });

    res.json({
      status: "healthy",
      convexUrl: convexUrl.replace(
        /https:\/\/(.{8}).*?(\.convex\.cloud)/,
        "https://$1****$2"
      ),
      responseStatus: response.status,
    });
  } catch (err) {
    res.status(503).json({
      status: "unhealthy",
      error: "Cannot reach Convex",
    });
  }
});

// ─── GET /health/ready — Readiness probe for Render ──────────────
router.get("/ready", (_req: Request, res: Response) => {
  const checks = {
    convexUrl: !!process.env.CONVEX_URL,
    clerkSecret: !!process.env.CLERK_WEBHOOK_SECRET,
  };

  const allReady = Object.values(checks).every(Boolean);

  res.status(allReady ? 200 : 503).json({
    ready: allReady,
    checks,
  });
});

export { router as healthRouter };
