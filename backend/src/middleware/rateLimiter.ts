import rateLimit from "express-rate-limit";

// ─── General API rate limiter ───────────────────────────────────
export function createGeneralLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many requests, please try again later",
      retryAfter: "15 minutes",
    },
  });
}

// ─── Strict rate limiter for auth endpoints ─────────────────────
export function createAuthLimiter() {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20, // stricter for auth
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Too many authentication attempts",
      retryAfter: "15 minutes",
    },
  });
}

// ─── Webhook rate limiter ───────────────────────────────────────
export function createWebhookLimiter() {
  return rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 50,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      error: "Webhook rate limit exceeded",
    },
  });
}
