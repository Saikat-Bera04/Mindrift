import { Router, Request, Response } from "express";

const router = Router();

// ─── POST /webhooks/clerk ────────────────────────────────────────
// Clerk webhooks are now handled directly by Convex HTTP actions
// at {CONVEX_SITE_URL}/webhooks/clerk.
//
// This Express route exists as a fallback proxy — it forwards
// webhook payloads to Convex if you point Clerk here instead.
router.post("/clerk", async (req: Request, res: Response) => {
  const convexSiteUrl = process.env.CONVEX_SITE_URL;

  if (!convexSiteUrl) {
    console.error("CONVEX_SITE_URL not configured");
    res.status(500).json({ error: "Backend misconfigured" });
    return;
  }

  try {
    // Forward the raw webhook payload to the Convex HTTP action
    const convexResponse = await fetch(
      `${convexSiteUrl}/webhooks/clerk`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body:
          typeof req.body === "string"
            ? req.body
            : Buffer.isBuffer(req.body)
              ? req.body.toString("utf-8")
              : JSON.stringify(req.body),
      }
    );

    const result = await convexResponse.json();
    res.status(convexResponse.status).json(result);
  } catch (err) {
    console.error("Error proxying webhook to Convex:", err);
    res.status(500).json({ error: "Proxy failed" });
  }
});

export { router as webhookRouter };
