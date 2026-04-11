import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

/** Must match an "Authorized redirect URI" in Google Cloud Console. */
function resolveGoogleCallbackURL(): string {
  const explicit = process.env.GOOGLE_CALLBACK_URL?.trim();
  if (explicit) return explicit;
  const fromPublic = process.env.BACKEND_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (fromPublic) return `${fromPublic}/auth/google/callback`;
  const fromBackend = process.env.BACKEND_URL?.trim().replace(/\/$/, "");
  if (fromBackend) return `${fromBackend}/auth/google/callback`;
  const port = process.env.PORT ?? "3001";
  return `http://localhost:${port}/auth/google/callback`;
}

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: resolveGoogleCallbackURL(),
      },
      (_accessToken, _refreshToken, profile, done) => {
        // Return the profile so our route handler can use it
        return done(null, profile);
      }
    )
  );
  console.log("✓ Google OAuth strategy configured");
} else {
  console.warn(
    "⚠ Google OAuth is NOT configured — missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in env"
  );
}

// Minimal serialization since we only use Passport for the initial OAuth handshake
// and we don't store long-lived sessions in Express.
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user: Express.User, done) => {
  done(null, user);
});

export { passport };
