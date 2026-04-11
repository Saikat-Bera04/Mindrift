import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  authCookieConfig,
  resolveConvexSiteUrl,
} from "@/lib/auth-server";

export async function POST(request: NextRequest) {
  let body: { email?: string; password?: string; displayName?: string };
  try {
    body = (await request.json()) as {
      email?: string;
      password?: string;
      displayName?: string;
    };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const email = body.email?.trim();
  const password = body.password ?? "";
  const displayName = body.displayName?.trim() || "";

  if (!email || !password) {
    return NextResponse.json({ error: "email and password are required" }, { status: 400 });
  }

  try {
    const convexResponse = await fetch(`${resolveConvexSiteUrl()}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, displayName }),
    });

    const payload = (await convexResponse.json().catch(() => ({}))) as {
      error?: string;
      token?: string;
      expiresIn?: number;
      user?: Record<string, unknown>;
    };

    if (!convexResponse.ok || !payload.token) {
      return NextResponse.json(
        { error: payload.error ?? "Registration failed" },
        { status: convexResponse.status || 400 },
      );
    }

    const response = NextResponse.json({ success: true, user: payload.user ?? null });
    response.cookies.set(
      AUTH_COOKIE_NAME,
      payload.token,
      authCookieConfig(
        typeof payload.expiresIn === "number" ? Math.floor(payload.expiresIn) : undefined,
      ),
    );

    return response;
  } catch {
    return NextResponse.json({ error: "Unable to reach auth service" }, { status: 502 });
  }
}
