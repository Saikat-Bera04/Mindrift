const DEFAULT_BACKEND_ORIGIN = "http://127.0.0.1:3001";

/** Public Express API origin. */
export function getBackendOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  if (!raw) return DEFAULT_BACKEND_ORIGIN;
  return raw.replace(/\/$/, "");
}
