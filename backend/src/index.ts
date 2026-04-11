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
import { errorHandler } from "./middleware/errorHandler.js";
import { clerkMiddleware } from "./middleware/clerk.js";
import { createGeneralLimiter } from "./middleware/rateLimiter.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      const frontendUrl = process.env.FRONTEND_URL ?? "http://localhost:3000";
      if (!origin || origin === frontendUrl || origin.startsWith("chrome-extension://")) {
        callback(null, true);
        return;
      }

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

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Mindrift Backend API running on port ${PORT} (${process.env.NODE_ENV ?? "development"})`,
  );
});

export default app;
