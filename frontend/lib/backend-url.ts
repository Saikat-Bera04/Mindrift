const DEFAULT_BACKEND_ORIGIN = "http://localhost:3001";

/** Public Express API origin (Passport Google OAuth starts here). */
export function getBackendOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (!raw) return DEFAULT_BACKEND_ORIGIN;
  return raw.replace(/\/$/, "");
}

export function getGoogleOAuthStartUrl(): string {
  return `${getBackendOrigin()}/auth/google`;
}
