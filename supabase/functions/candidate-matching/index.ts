// Supabase Edge Function for candidate matching
/// <reference path="./deno.d.ts" />
import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";
import {
  AnswerRequest,
  AnswerResponse,
  CandidateScore,
  MatchesResponse,
  QuestionResponse,
  UserResponse,
  TopicSelection,
} from "./types.ts";
import { UserManager } from "./user-manager.ts";

import { ScoringSystem } from "./scoring.ts";
import { generateEmbeddingForUserInput } from "./matching.ts";

// Initialize Supabase client
const supabaseUrl =
  Deno.env.get("SUPABASE_URL") || Deno.env.get("SUPABASE_PROJECT_URL")!;
const supabaseKey =
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
  Deno.env.get("SUPABASE_ANON_KEY")!;

const supabase = createClient(supabaseUrl, supabaseKey);
const userManager = new UserManager(supabase);

const scoringSystem = new ScoringSystem(userManager);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    let path = url.pathname;
    console.log(`[${req.method}] ${path}`);

    if (
      path === "/candidate-matching" ||
      path === "/candidate-matching/" ||
      path === "/functions/v1/candidate-matching" ||
      path === "/functions/v1/candidate-matching/"
    ) {
      return new Response(
        JSON.stringify({
          message: "Political Candidates Matching API",
          version: "1.0.0",
          endpoints: {
            get_question: "GET /users/{user_id}/question",
            submit_answer: "POST /users/{user_id}/answer",
            get_matches: "GET /users/{user_id}/matches",
          },
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

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
      return new Response(
        JSON.stringify({
          error: "Not found",
          path: path,
          method: req.method,
          available_endpoints: {
            root: "GET /",
            topics: "GET /topics",
            create_user: "POST /users",
            user_operations: "GET/POST /users/{user_id}/...",
          },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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

    if (subPath === "question" && req.method === "GET") {
      console.log(
        `[GET question] topics: ${userProfile.selected_topics.length}`
      );
      if (userProfile.selected_topics.length === 0) {
        console.log(`[GET question] ❌ No topics selected`);
        return new Response(
          JSON.stringify({
            error: "No topics selected. Please select topics first.",
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const question = await userManager.getNextRandomQuestion(
        userId,
        userProfile.selected_topics
      );

      if (!question) {
        console.log(`[GET question] ❌ No more questions available`);
        return new Response(
          JSON.stringify({
            error: "No more questions available for selected topics",
          }),
          {
            status: 404,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(
        `[GET question] ✅ ${question.question_id} (${question.topic})`
      );
      const response: QuestionResponse = {
        question_id: question.question_id,
        topic: question.topic,
        statement: question.statement,
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (subPath === "answer" && req.method === "POST") {
      const body: AnswerRequest = await req.json();
      console.log(
        `[POST answer] ${body.question_id} → ${
          body.agree ? "agree" : "disagree"
        }`
      );

      const opinionIdMatch = body.question_id.match(/^q_(\d+)$/);
      if (!opinionIdMatch) {
        console.log(`[POST answer] ❌ Invalid question_id format`);
        return new Response(
          JSON.stringify({ error: "Invalid question_id format" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const opinionId = parseInt(opinionIdMatch[1], 10);

      // Get the opinion to get topic and statement
      const opinion = await userManager.getOpinion(opinionId);
      if (!opinion) {
        console.log(`[POST answer] ❌ Opinion ${opinionId} not found`);
        return new Response(JSON.stringify({ error: "Opinion not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Add answer to database (no embedding needed - Answers only stores choice)
      const answerAdded = await userManager.addAnswer(
        userId,
        opinionId,
        body.agree
      );

      if (!answerAdded) {
        console.log(`[POST answer] ❌ Failed to save answer`);
        return new Response(
          JSON.stringify({ error: "Failed to save answer" }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Reload user profile to get updated answers
      const updatedUserProfile = await userManager.getUserProfile(userId);
      if (!updatedUserProfile) {
        console.log(`[POST answer] ❌ User not found after save`);
        return new Response(JSON.stringify({ error: "User not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(
        `[POST answer] ✅ Saved (total answers: ${updatedUserProfile.answers.length})`
      );

      // Create answer object for scoring
      const answer = {
        question_id: body.question_id,
        topic: opinion.topic.toLowerCase().replace(/\s+/g, "_"),
        statement: opinion.text,
        agree: body.agree,
      };

      // Update scores (persisted to DB)
      await scoringSystem.updateScoresFromAnswer(updatedUserProfile, answer);

      // Check for strong match (after at least 10 answers)
      let hasStrongMatch = false;
      if (updatedUserProfile.answers.length >= 10) {
        hasStrongMatch = await scoringSystem.hasStrongMatch(
          updatedUserProfile,
          60.0
        );
        if (hasStrongMatch) {
          console.log(`[POST answer] 🎯 Strong match detected`);
        }
      }

      // Prepare current scores for response (normalized)
      const candidateScores = await scoringSystem.getCandidateScores(
        updatedUserProfile,
        true
      );
      const scoresDict: Record<string, number> = {};
      for (const [candidate, score] of candidateScores) {
        scoresDict[candidate.name] = score;
      }

      const response: AnswerResponse = {
        question_id: body.question_id,
        answer_accepted: true,
        current_scores: scoresDict,
        has_strong_match: hasStrongMatch,
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (subPath === "matches" && req.method === "GET") {
      console.log(`[GET matches] answers: ${userProfile.answers.length}`);
      if (userProfile.answers.length === 0) {
        console.log(`[GET matches] ⚠️ No answers yet`);
        return new Response(
          JSON.stringify({
            user_id: userId,
            total_answers: 0,
            candidates: [],
            user_preferences_summary: "No answers yet.",
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Get matches from DB
      const matches = await scoringSystem.getCandidateScores(userProfile, true);
      console.log(`[GET matches] ✅ Found ${matches.length} candidates`);

      // Format response
      const candidates: CandidateScore[] = matches.map(([c, score]) => ({
        candidate_name: c.name,
        party: c.party,
        score: score,
        match_percentage: Math.round(score),
      }));

      // Generate summary
      const summary = userManager.getUserPreferencesSummary(userProfile);

      const response: MatchesResponse = {
        user_id: userId,
        total_answers: userProfile.answers.length,
        candidates,
        user_preferences_summary: summary,
      };

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (subPath === "" && req.method === "GET") {
      console.log(
        `[GET user] topics: ${userProfile.selected_topics.length}, answers: ${userProfile.answers.length}`
      );
      const response: UserResponse = {
        user_id: userProfile.user_id,
        selected_topics: userProfile.selected_topics,
        answers_count: userProfile.answers.length,
        status: "active",
      };
      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`[${req.method}] ❌ Not found: ${subPath || "(empty)"}`);
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
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
