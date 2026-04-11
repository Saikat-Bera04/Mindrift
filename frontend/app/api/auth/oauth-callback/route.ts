import { NextRequest, NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, authCookieConfig } from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const expiresInRaw = searchParams.get("expiresIn");

  if (!token) {
    return NextResponse.redirect(new URL("/sign-in?error=missing_token", request.url));
  }

  const expiresIn = expiresInRaw ? parseInt(expiresInRaw, 10) : undefined;

  // Redirect to onboarding for first-time users, dashboard for returning ones.
  // The onboarding page itself checks if profile exists and skips if so.
  const destination = new URL("/dashboard", request.url);

  const response = NextResponse.redirect(destination);

  response.cookies.set(
    AUTH_COOKIE_NAME,
    token,
    authCookieConfig(
      typeof expiresIn === "number" && !isNaN(expiresIn) ? expiresIn : undefined
    )
  );

  return response;
}
