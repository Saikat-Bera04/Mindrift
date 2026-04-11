import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { batchIngest } from "./events/ingest";
import {
  getAccessTokenTtlSeconds,
  getJwksDocument,
  getJwtIssuer,
  signUserAccessToken,
} from "./lib/jwt";

const http = httpRouter();

function jsonResponse(status: number, body: unknown, origin = "*") {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": origin,
    },
  });
}

const authCorsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
  "Access-Control-Max-Age": "86400",
};

// Event ingestion endpoint for extensions.
http.route({
  path: "/events/batch",
  method: "POST",
  handler: batchIngest,
});

http.route({
  path: "/events/batch",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, Convex-Client",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// Extension pairing endpoint.
http.route({
  path: "/pair",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    try {
      const body = (await req.json()) as { pairingCode?: string };
      const pairingCode = body.pairingCode?.trim();
      if (!pairingCode) {
        return jsonResponse(400, { error: "pairingCode is required" });
      }

      const result = await ctx.runMutation(internal.users.mutations.pairDevice, { pairingCode });
      return jsonResponse(200, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to pair device";
      return jsonResponse(400, { error: message });
    }
  }),
});

http.route({
  path: "/pair",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, { status: 204, headers: authCorsHeaders });
  }),
});

// JWT discovery endpoints consumed by Convex customJwt auth provider.
http.route({
  path: "/.well-known/jwks.json",
  method: "GET",
  handler: httpAction(async () => {
    return jsonResponse(200, getJwksDocument());
  }),
});

http.route({
  path: "/.well-known/openid-configuration",
  method: "GET",
  handler: httpAction(async () => {
    const issuer = getJwtIssuer().replace(/\/+$/, "");
    return jsonResponse(200, {
      issuer,
      jwks_uri: `${issuer}/.well-known/jwks.json`,
      id_token_signing_alg_values_supported: ["RS256"],
      subject_types_supported: ["public"],
      response_types_supported: ["token"],
      token_endpoint_auth_methods_supported: ["none"],
      claims_supported: [
        "sub",
        "iss",
        "aud",
        "iat",
        "exp",
        "email",
        "name",
        "picture",
      ],
    });
  }),
});

http.route({
  path: "/auth/register",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let body: { email?: string; password?: string; displayName?: string };
    try {
      body = (await req.json()) as { email?: string; password?: string; displayName?: string };
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }

    const email = body.email?.trim();
    const password = body.password ?? "";
    const displayName = body.displayName?.trim() || email?.split("@")[0] || "User";

    if (!email || !password) {
      return jsonResponse(400, { error: "email and password are required" });
    }

    try {
      const user = await ctx.runMutation(internal.auth.mutations.registerWithPassword, {
        email,
        password,
        displayName,
      });

      const signed = await signUserAccessToken({
        subject: user.subject,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      });

      return jsonResponse(200, {
        token: signed.token,
        expiresAt: signed.expiresAt,
        expiresIn: getAccessTokenTtlSeconds(),
        user: {
          subject: user.subject,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to register";
      return jsonResponse(400, { error: message });
    }
  }),
});

http.route({
  path: "/auth/login",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    let body: { email?: string; password?: string };
    try {
      body = (await req.json()) as { email?: string; password?: string };
    } catch {
      return jsonResponse(400, { error: "Invalid JSON body" });
    }

    const email = body.email?.trim();
    const password = body.password ?? "";
    if (!email || !password) {
      return jsonResponse(400, { error: "email and password are required" });
    }

    try {
      const user = await ctx.runMutation(internal.auth.mutations.loginWithPassword, {
        email,
        password,
      });

      const signed = await signUserAccessToken({
        subject: user.subject,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      });

      return jsonResponse(200, {
        token: signed.token,
        expiresAt: signed.expiresAt,
        expiresIn: getAccessTokenTtlSeconds(),
        user: {
          subject: user.subject,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to authenticate";
      const status = message === "Invalid email or password" ? 401 : 400;
      return jsonResponse(status, { error: message });
    }
  }),
});

http.route({
  path: "/auth/register",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: authCorsHeaders })),
});

http.route({
  path: "/auth/login",
  method: "OPTIONS",
  handler: httpAction(async () => new Response(null, { status: 204, headers: authCorsHeaders })),
});

export default http;
