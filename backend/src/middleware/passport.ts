import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: "/auth/google/callback",
      },
      (accessToken, refreshToken, profile, done) => {
        // Return the profile so our route handler can use it
        return done(null, profile);
      }
    )
  );
} else {
  console.warn("passport-google-oauth20 is not configured due to missing GOOGLE_CLIENT_ID/SECRET");
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
