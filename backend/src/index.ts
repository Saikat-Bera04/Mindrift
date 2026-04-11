import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { authRouter } from "./routes/auth.js";
import { healthRouter } from "./routes/health.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { createGeneralLimiter } from "./middleware/rateLimiter.js";

const app = express();
const PORT = parseInt(process.env.PORT ?? "3001", 10);

app.use(helmet());
app.use(
  cors({
    origin: process.env.FRONTEND_URL ?? "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(createGeneralLimiter());

app.use("/auth", authRouter);
app.use("/health", healthRouter);

app.get("/", (_req, res) => {
  res.json({
    name: "Mindrift Backend API",
    version: "1.0.0",
    status: "running",
    docs: "/health",
  });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(
    `Mindrift Backend API running on port ${PORT} (${process.env.NODE_ENV ?? "development"})`,
  );
});

export default app;
