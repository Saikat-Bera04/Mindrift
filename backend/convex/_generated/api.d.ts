/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as crons from "../crons.js";
import type * as events_cleanup from "../events/cleanup.js";
import type * as events_ingest from "../events/ingest.js";
import type * as events_queries from "../events/queries.js";
import type * as gamification_levels from "../gamification/levels.js";
import type * as gamification_queries from "../gamification/queries.js";
import type * as gamification_rewards from "../gamification/rewards.js";
import type * as gamification_streaks from "../gamification/streaks.js";
import type * as http from "../http.js";
import type * as insights_generate from "../insights/generate.js";
import type * as insights_queries from "../insights/queries.js";
import type * as interventions_mutations from "../interventions/mutations.js";
import type * as interventions_queries from "../interventions/queries.js";
import type * as interventions_trigger from "../interventions/trigger.js";
import type * as lib_constants from "../lib/constants.js";
import type * as lib_validators from "../lib/validators.js";
import type * as reports_generate from "../reports/generate.js";
import type * as reports_queries from "../reports/queries.js";
import type * as scoring_compute from "../scoring/compute.js";
import type * as scoring_queries from "../scoring/queries.js";
import type * as scoring_rules from "../scoring/rules.js";
import type * as users_helpers from "../users/helpers.js";
import type * as users_mutations from "../users/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  crons: typeof crons;
  "events/cleanup": typeof events_cleanup;
  "events/ingest": typeof events_ingest;
  "events/queries": typeof events_queries;
  "gamification/levels": typeof gamification_levels;
  "gamification/queries": typeof gamification_queries;
  "gamification/rewards": typeof gamification_rewards;
  "gamification/streaks": typeof gamification_streaks;
  http: typeof http;
  "insights/generate": typeof insights_generate;
  "insights/queries": typeof insights_queries;
  "interventions/mutations": typeof interventions_mutations;
  "interventions/queries": typeof interventions_queries;
  "interventions/trigger": typeof interventions_trigger;
  "lib/constants": typeof lib_constants;
  "lib/validators": typeof lib_validators;
  "reports/generate": typeof reports_generate;
  "reports/queries": typeof reports_queries;
  "scoring/compute": typeof scoring_compute;
  "scoring/queries": typeof scoring_queries;
  "scoring/rules": typeof scoring_rules;
  "users/helpers": typeof users_helpers;
  "users/mutations": typeof users_mutations;
  "users/queries": typeof users_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
