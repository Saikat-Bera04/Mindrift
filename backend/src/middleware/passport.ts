import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

function resolveGoogleCallbackURL(): string {
  const explicit = process.env.GOOGLE_CALLBACK_URL?.trim();
  if (explicit) return explicit;
  const base = process.env.BACKEND_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (base) return `${base}/auth/google/callback`;
  return "/auth/google/callback";
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:3001";

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${BACKEND_URL}/auth/google/callback`,
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
