import { NextRequest, NextResponse } from "next/server";
import {
  AUTH_COOKIE_NAME,
  authCookieConfig,
  isJwtExpired,
} from "@/lib/auth-server";

export async function GET(request: NextRequest) {
  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token || isJwtExpired(token)) {
    const response = NextResponse.json({ authenticated: false });
    if (token) {
      response.cookies.set(AUTH_COOKIE_NAME, "", {
        ...authCookieConfig(0),
        expires: new Date(0),
      });
    }
    return response;
  }

  return NextResponse.json({ authenticated: true });
}
