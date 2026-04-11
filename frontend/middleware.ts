import { NextRequest, NextResponse } from "next/server";

const AUTH_COOKIE_NAME = "mindrift_auth_token";

const protectedPrefixes = [
  "/dashboard",
  "/insights",
  "/activity",
  "/health",
  "/reports",
  "/settings",
  "/chat",
  "/onboarding",
];

const authPages = ["/sign-in", "/sign-up"];

function isProtectedPath(pathname: string): boolean {
  return protectedPrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isAuthPage(pathname: string): boolean {
  return authPages.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function decodePayload(token: string): { exp?: number } | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const normalized = parts[1]
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    const payload = JSON.parse(atob(normalized)) as { exp?: number };
    return payload;
  } catch {
    return null;
  }
}

function hasValidToken(request: NextRequest): boolean {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return false;

  const payload = decodePayload(token);
  if (!payload?.exp) return false;

  return payload.exp > Math.floor(Date.now() / 1000);
}

export default function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const authenticated = hasValidToken(request);
  const atRoot = pathname === "/";
  const atAuthPage = isAuthPage(pathname);
  const needsAuth = isProtectedPath(pathname);

  if (authenticated && (atRoot || atAuthPage)) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!authenticated && needsAuth) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
