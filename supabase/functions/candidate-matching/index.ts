// Supabase Edge Function for candidate matching
/// <reference path="./deno.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import { UserManager } from "./user-manager.ts";

import { ScoringSystem } from "./scoring.ts";
import {
  corsHeaders,
  createRouteNotFoundResponse,
} from "./http.ts";
import { getUserRouteHandler } from "./user-route-handlers.ts";

// Initialize Supabase client
const supabaseUrl =
  Deno.env.get("SUPABASE_URL") || Deno.env.get("SUPABASE_PROJECT_URL")!;
const supabaseKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);
const userManager = new UserManager(supabase);

const scoringSystem = new ScoringSystem(userManager);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let path = url.pathname;
    console.log(`[${req.method}] ${path}`);

    path = path.replace(/^\/functions\/v1\/candidate-matching\/?/, "");
    path = path.replace(/^\/candidate-matching\/?/, "");

    path = path.trim();

    if (path.endsWith("/") && path !== "/") {
      path = path.slice(0, -1);
    }

    if (!path.startsWith("/")) {
      path = "/" + path;
    }

    const userMatch = path.match(/^\/users\/([^/]+)(?:\/(.+))?$/);
    if (!userMatch) {
      return createRouteNotFoundResponse({
        path,
        method: req.method,
      });
    }

    const userId = userMatch[1];
    const subPath = userMatch[2] || "";
    console.log(`→ userId: ${userId}, subPath: ${subPath || "(root)"}`);

    const userProfile = await userManager.getUserProfile(userId);
    if (!userProfile) {
      console.log(`[${req.method}] ❌ User not found: ${userId}`);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    console.log(`[${req.method}] ✅ User found: ${userId}`);

    const handler = getUserRouteHandler(req.method, subPath);
    if (handler) {
      return handler({
        req,
        userId,
        userProfile,
        userManager,
        scoringSystem,
      });
    }

    console.log(`[${req.method}] ❌ Not found: ${subPath || "(empty)"}`);
    return createRouteNotFoundResponse({
      path,
      method: req.method,
    });
  } catch (error) {
    console.error(
      `[ERROR] ${error instanceof Error ? error.message : String(error)}`
    );
    if (error instanceof Error && error.stack) {
      console.error(`[ERROR] Stack: ${error.stack}`);
    }
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
