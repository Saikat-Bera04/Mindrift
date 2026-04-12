import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { moodsRouter } from "./routes/moods.js";
import { healthRouter } from "./routes/health.js";
import { gamificationRouter } from "./routes/gamification.js";
import { insightsRouter } from "./routes/insights.js";
import { usersRouter } from "./routes/users.js";
import { extensionRouter } from "./routes/extension.js";
import { activityRouter } from "./routes/activity.js";
import { voiceRouter } from "./routes/voice.js";
import { stressRouter } from "./routes/stress.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { clerkMiddleware } from "./middleware/clerk.js";
import { createGeneralLimiter } from "./middleware/rateLimiter.js";
import { startBackgroundJobs } from "./cron.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        callback(null, true);
        return;
      }

      // Chrome extensions always allowed
      if (origin.startsWith("chrome-extension://")) {
        callback(null, true);
        return;
      }

      // Parse allowed origins from env (comma-separated) or use defaults
      const defaultOrigins = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://www.mindrift.vercel.app",
      ];
      
      const envOrigins = process.env.FRONTEND_URL 
        ? process.env.FRONTEND_URL.split(",").map(u => u.trim())
        : [];
      
      const allowedOrigins = [...defaultOrigins, ...envOrigins];
      
      // Remove trailing slashes for comparison
      const normalizedOrigin = origin.replace(/\/$/, "");
      const normalizedAllowed = allowedOrigins.map(u => u.replace(/\/$/, ""));
      
      if (normalizedAllowed.includes(normalizedOrigin)) {
        callback(null, true);
        return;
      }

      console.warn(`CORS blocked origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(createGeneralLimiter());

// Clerk authentication middleware (validates JWT tokens from Clerk)
app.use(clerkMiddleware());

app.get("/", (_req, res) => {
  res.json({
    name: "Mindrift Backend API",
    version: "1.0.0",
    status: "running",
  });
});

app.use("/api/users", usersRouter);
app.use("/moods", moodsRouter);
app.use("/health", healthRouter);
app.use("/gamification", gamificationRouter);
app.use("/insights", insightsRouter);
app.use("/extension", extensionRouter);
app.use("/activity", activityRouter);
app.use("/voice", voiceRouter);
app.use("/stress", stressRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Mindrift Backend API running on port ${PORT} (${process.env.NODE_ENV ?? "development"})`,
  );
  startBackgroundJobs();
});

export default app;
