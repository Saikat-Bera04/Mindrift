import { Request, Response, NextFunction } from "express";
import { verifyToken } from "@clerk/backend";

declare global {
  namespace Express {
    interface Request {
      clerkUserId?: string;
      clerkAuthError?: string;
    }
  }
}

export const clerkMiddleware = () => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return next();
    }

    if (!process.env.CLERK_SECRET_KEY) {
      req.clerkAuthError = "CLERK_SECRET_KEY is not configured";
      return next();
    }

    try {
      const token = authHeader.slice(7);
      const decoded = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
        authorizedParties: [
          process.env.FRONTEND_URL ?? "http://localhost:3000",
          "http://localhost:3000",
        ],
      });

      if (decoded && typeof decoded.sub === "string") {
        req.clerkUserId = decoded.sub;
      }
    } catch (error: any) {
      req.clerkAuthError = error?.message ?? "Token verification failed";
      console.error("Clerk token verification failed:", req.clerkAuthError);
    }

    next();
  };
};

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (!req.clerkUserId) {
    return res.status(401).json({
      error: "Unauthorized",
      ...(process.env.NODE_ENV !== "production" && req.clerkAuthError
        ? { detail: req.clerkAuthError }
        : {}),
    });
  }
  next();
};
