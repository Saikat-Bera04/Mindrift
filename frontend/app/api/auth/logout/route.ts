import { NextResponse } from "next/server";
import { AUTH_COOKIE_NAME, authCookieConfig } from "@/lib/auth-server";

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(AUTH_COOKIE_NAME, "", {
    ...authCookieConfig(0),
    expires: new Date(0),
  });
  return response;
}
