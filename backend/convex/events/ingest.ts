import { v } from "convex/values";
import { httpAction, internalMutation, internalQuery } from "../_generated/server";
import { internal } from "../_generated/api";
import {
  sourceValidator,
  eventTypeValidator,
  categoryValidator,
  eventPayloadValidator,
} from "../lib/validators";
import { MAX_EVENTS_PER_BATCH } from "../lib/constants";

// ─── HTTP Action: Batch Event Ingestion ─────────────────────────
// Extensions POST events here: {CONVEX_SITE_URL}/events/batch
export const batchIngest = httpAction(async (ctx, req) => {
  // Verify auth (Clerk JWT or Pairing Token)
  let tokenIdentifier: string | null = null;
  const identity = await ctx.auth.getUserIdentity();
  
  if (identity) {
    tokenIdentifier = identity.tokenIdentifier;
  } else {
    // Check for pairing token in Authorization header
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.split(" ")[1];
      // In this prototype, the 'token' is the clerkUserId.
      // We check if this user has any 'paired' devices.
      const pairing = await ctx.runQuery(internal.events.ingest.checkPairing, { token });
      if (pairing) {
        tokenIdentifier = pairing.tokenIdentifier;
      }
    }
  }

  if (!tokenIdentifier) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return new Response(
      JSON.stringify({ error: "Invalid JSON body" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  const parsed = body as {
    events?: Array<{
      type: string;
      source: string;
      category?: string;
      payload?: Record<string, unknown>;
      timestamp: number;
      batchId: string;
    }>;
  };

  if (!parsed.events || !Array.isArray(parsed.events)) {
    return new Response(
      JSON.stringify({ error: "Missing 'events' array" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (parsed.events.length > MAX_EVENTS_PER_BATCH) {
    return new Response(
      JSON.stringify({
        error: `Max ${MAX_EVENTS_PER_BATCH} events per batch`,
      }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Process via internal mutation for transactional safety
  try {
    const result: { inserted: number; duplicates: number } =
      await ctx.runMutation(internal.events.ingest.insertBatch, {
        tokenIdentifier,
        events: parsed.events.map((e) => ({
          type: e.type,
          source: e.source,
          category: e.category,
          payload: e.payload ?? {},
          timestamp: Math.round(e.timestamp / 60000) * 60000, // round to minute
          batchId: e.batchId,
        })),
      });
    return new Response(JSON.stringify({ ok: true, ...result }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});

// ─── Internal Mutation: Insert Event Batch ──────────────────────
export const insertBatch = internalMutation({
  args: {
    tokenIdentifier: v.string(),
    events: v.array(
      v.object({
        type: v.string(),
        source: v.string(),
        category: v.optional(v.string()),
        payload: v.any(),
        timestamp: v.number(),
        batchId: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    // Look up user by tokenIdentifier
    const user = await ctx.db
      .query("users")
      .withIndex("by_tokenIdentifier", (q) =>
        q.eq("tokenIdentifier", args.tokenIdentifier)
      )
      .unique();

    if (!user) {
      throw new Error("User not found");
    }

    let inserted = 0;
    let duplicates = 0;

    for (const event of args.events) {
      // Idempotency check: skip if batchId already exists
      const existing = await ctx.db
        .query("events")
        .withIndex("by_batchId", (q) => q.eq("batchId", event.batchId))
        .take(1);

      if (existing.length > 0) {
        duplicates++;
        continue;
      }

      await ctx.db.insert("events", {
        userId: user._id,
        source: event.source as "chrome" | "vscode" | "pwa" | "geolocation",
        type: event.type as
          | "tab_switch"
          | "session_start"
          | "session_end"
          | "break_taken"
          | "night_usage"
          | "coding_session"
          | "build_result"
          | "location_update"
          | "movement_detected"
          | "idle_detected",
        category: event.category as
          | "social"
          | "productivity"
          | "entertainment"
          | "education"
          | "other"
          | undefined,
        payload: event.payload ?? {},
        timestamp: event.timestamp,
        batchId: event.batchId,
      });
      inserted++;
    }

    return { inserted, duplicates };
  },
});

// ─── Internal Query: Check Pairing ─────────────────────────────
export const checkPairing = internalQuery({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerkId", (q) => q.eq("clerkId", args.token))
      .unique();

    if (!user) return null;

    const pairing = await ctx.db
      .query("devicePairings")
      .withIndex("by_status", (q) => q.eq("status", "paired"))
      .filter((q) => q.eq(q.field("clerkUserId"), user.clerkId))
      .first();

    if (!pairing) return null;

    return { tokenIdentifier: user.tokenIdentifier };
  },
});
