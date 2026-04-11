import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { webhookRouter } from "./routes/webhooks.js";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createGeneralLimiter } from "./middleware/rateLimiter.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

// ─── Security ───────────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  })
);

// ─── Webhooks need raw body for signature verification ──────────
// Must be before express.json()
app.use("/webhooks", express.raw({ type: "application/json" }));

// ─── Body parsing ───────────────────────────────────────────────
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Rate limiting ──────────────────────────────────────────────
app.use(createGeneralLimiter());

// ─── Routes ─────────────────────────────────────────────────────
app.use("/webhooks", webhookRouter);
app.use("/auth", authRouter);
app.use("/health", healthRouter);

// ─── Root ───────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    name: "Mindrift Backend API",
    version: "1.0.0",
    status: "running",
    docs: "/health",
  });
});

// ─── Error handling ─────────────────────────────────────────────
app.use(errorHandler);

// ─── Start ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════╗
║  🧠 Mindrift Backend API                 ║
║  Port: ${PORT}                              ║
║  Env:  ${process.env.NODE_ENV ?? "development"}                      ║
║  CORS: ${process.env.FRONTEND_URL ?? "http://localhost:3000"}  ║
╚══════════════════════════════════════════╝
  `);
});

export default app;
