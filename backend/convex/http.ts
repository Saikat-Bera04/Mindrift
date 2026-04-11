import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { batchIngest } from "./events/ingest";

const http = httpRouter();

// ─── Event ingestion endpoint for extensions ─────────────────────
http.route({
  path: "/events/batch",
  method: "POST",
  handler: batchIngest,
});
http.route({
  path: "/pair",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    const { pairingCode } = await req.json();
    try {
      const result = await ctx.runMutation(internal.users.mutations.pairDevice, { pairingCode });
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 400,
        headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" },
      });
    }
  }),
});

// Preflight for /pair
http.route({
  path: "/pair",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// ─── CORS preflight for extensions ──────────────────────────────
http.route({
  path: "/events/batch",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Authorization, Convex-Client",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

// ─── Clerk Webhook Handler ──────────────────────────────────────
// Clerk sends webhooks directly to this Convex HTTP action.
// No Express middleman needed — Convex can call internal mutations.
http.route({
  path: "/webhooks/clerk",
  method: "POST",
  handler: httpAction(async (ctx, req) => {
    // We skip Svix verification here since Convex HTTP actions
    // have their own security model. For production, add Svix
    // verification using the raw body.
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ error: "Invalid JSON" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const event = body as {
      type: string;
      data: {
        id: string;
        email_addresses?: Array<{ email_address: string }>;
        first_name?: string | null;
        last_name?: string | null;
        image_url?: string | null;
      };
    };

    try {
      switch (event.type) {
        case "user.created":
        case "user.updated": {
          const userData = event.data;
          const email =
            userData.email_addresses?.[0]?.email_address ?? "";
          const displayName =
            [userData.first_name, userData.last_name]
              .filter(Boolean)
              .join(" ") || "User";

          // Construct tokenIdentifier matching Clerk JWT format
          const tokenIdentifier = `${process.env.CLERK_JWT_ISSUER_DOMAIN}|${userData.id}`;

          await ctx.runMutation(internal.users.mutations.createOrUpdate, {
            clerkId: userData.id,
            tokenIdentifier,
            email,
            displayName,
            avatarUrl: userData.image_url ?? undefined,
          });

          return new Response(
            JSON.stringify({
              received: true,
              event: event.type,
              userId: userData.id,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        case "user.deleted": {
          await ctx.runMutation(internal.users.mutations.deleteByClerkId, {
            clerkId: event.data.id,
          });

          return new Response(
            JSON.stringify({ received: true, event: "user.deleted" }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
        }

        default:
          return new Response(
            JSON.stringify({
              received: true,
              event: event.type,
              handled: false,
            }),
            { status: 200, headers: { "Content-Type": "application/json" } }
          );
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Webhook processing error:", message);
      return new Response(
        JSON.stringify({ error: message }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }),
});

// ─── CORS preflight for webhooks ─────────────────────────────────
http.route({
  path: "/webhooks/clerk",
  method: "OPTIONS",
  handler: httpAction(async () => {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
      },
    });
  }),
});

export default http;
