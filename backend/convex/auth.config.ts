import { AuthConfig } from "convex/server";

const issuer = process.env.JWT_ISSUER ?? process.env.CONVEX_SITE_URL;
if (!issuer) {
  throw new Error("Missing JWT_ISSUER (or CONVEX_SITE_URL) for Convex JWT auth");
}

const jwks =
  process.env.JWT_JWKS_URL ?? `${issuer.replace(/\/+$/, "")}/.well-known/jwks.json`;

export default {
  providers: [
    {
      type: "customJwt",
      issuer,
      jwks,
      algorithm: "RS256",
      applicationID: process.env.JWT_AUDIENCE ?? "mindrift",
    },
  ],
} satisfies AuthConfig;
