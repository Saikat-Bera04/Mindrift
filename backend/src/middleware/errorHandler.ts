import { Request, Response, NextFunction } from "express";

interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

// ─── Global error handler ───────────────────────────────────────
export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const message =
    statusCode === 500 ? "Internal Server Error" : err.message;

  console.error(`[ERROR] ${statusCode} - ${err.message}`, {
    stack: err.stack,
    code: err.code,
    timestamp: new Date().toISOString(),
  });

  res.status(statusCode).json({
    error: message,
    code: err.code ?? "INTERNAL_ERROR",
    ...(process.env.NODE_ENV === "development" && {
      stack: err.stack,
    }),
  });
}
