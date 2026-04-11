export const AUTH_COOKIE_NAME = "mindrift_auth_token";
const DEFAULT_TOKEN_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function tryParseJwtExp(token: string): number | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const payload = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const json = Buffer.from(payload, "base64").toString("utf-8");
    const parsed = JSON.parse(json) as { exp?: unknown };
    return typeof parsed.exp === "number" ? parsed.exp : null;
  } catch {
    return null;
  }
}

export function isJwtExpired(token: string): boolean {
  const exp = tryParseJwtExp(token);
  if (!exp) return true;
  return exp <= Math.floor(Date.now() / 1000);
}

export function resolveConvexSiteUrl(): string {
  const explicit = process.env.CONVEX_SITE_URL ?? process.env.NEXT_PUBLIC_CONVEX_SITE_URL;
  if (explicit) {
    return explicit.replace(/\/+$/, "");
  }

  const convexCloud = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (convexCloud) {
    return convexCloud.replace(".convex.cloud", ".convex.site").replace(/\/+$/, "");
  }

  throw new Error(
    "Missing CONVEX_SITE_URL (or NEXT_PUBLIC_CONVEX_URL) in frontend environment",
  );
}

export function authCookieConfig(maxAgeSeconds?: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSeconds ?? DEFAULT_TOKEN_MAX_AGE_SECONDS,
  };
}
