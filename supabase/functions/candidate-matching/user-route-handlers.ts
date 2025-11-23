import {
  Answer,
  AnswerRequest,
  AnswerResponse,
  CandidateScore,
  MatchesResponse,
  QuestionResponse,
  UserProfile,
  UserResponse,
} from "./types.ts";
import { jsonResponse } from "./http.ts";
import { UserManager } from "./user-manager.ts";
import { ScoringSystem } from "./scoring.ts";

type UserRouteContext = {
  req: Request;
  userId: string;
  userProfile: UserProfile;
  userManager: UserManager;
  scoringSystem: ScoringSystem;
};

type UserRouteHandler = (ctx: UserRouteContext) => Promise<Response>;

const userRouteHandlers = new Map<string, UserRouteHandler>([
  ["GET:question", handleGetQuestion],
  ["POST:answer", handlePostAnswer],
  ["GET:matches", handleGetMatches],
  ["GET:", handleGetUserProfile],
]);

export function getUserRouteHandler(
  method: string,
  subPath?: string
): UserRouteHandler | undefined {
  return userRouteHandlers.get(buildRouteKey(method, subPath));
}

function buildRouteKey(method: string, subPath?: string): string {
  return `${method.toUpperCase()}:${normalizeSubPath(subPath)}`;
}

function normalizeSubPath(subPath?: string): string {
  if (!subPath) {
    return "";
  }
  return subPath.replace(/^\/+/, "").replace(/\/+$/, "");
}

async function handleGetQuestion({
  userManager,
  userProfile,
  userId,
}: UserRouteContext): Promise<Response> {
  console.log(
    `[GET question] topics: ${userProfile.selected_topics.length}`
  );

  if (userProfile.selected_topics.length === 0) {
    console.log(`[GET question] ❌ No topics selected`);
    return jsonResponse(
      {
        error: "No topics selected. Please select topics first.",
      },
      400
    );
  }

  const question = await userManager.getNextRandomQuestion(userId);
  if (!question) {
    console.log(`[GET question] ❌ No more questions available`);
    return jsonResponse(
      {
        error: "No more questions available for selected topics",
      },
      404
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
  return jsonResponse(response);
}

async function handlePostAnswer({
  req,
  userId,
  userManager,
  scoringSystem,
}: UserRouteContext): Promise<Response> {
  const body = (await req.json()) as AnswerRequest;
  console.log(
    `[POST answer] ${body.question_id} → ${
      body.agree ? "agree" : "disagree"
    }`
  );

  const opinionId = body.question_id;
  if (!opinionId) {
    console.log(`[POST answer] ❌ Invalid question_id format`);
    return jsonResponse(
      {
        error: "Invalid question_id format",
      },
      400
    );
  }

  const opinion = await userManager.getOpinion(opinionId);
  if (!opinion) {
    console.log(`[POST answer] ❌ Opinion ${opinionId} not found`);
    return jsonResponse({ error: "Opinion not found" }, 404);
  }

  const answerAdded = await userManager.addAnswer(
    userId,
    opinionId,
    body.agree
  );
  if (!answerAdded) {
    console.log(`[POST answer] ❌ Failed to save answer`);
    return jsonResponse({ error: "Failed to save answer" }, 500);
  }

  const updatedUserProfile = await userManager.getUserProfile(userId);
  if (!updatedUserProfile) {
    console.log(`[POST answer] ❌ User not found after save`);
    return jsonResponse({ error: "User not found" }, 404);
  }

  console.log(
    `[POST answer] ✅ Saved (total answers: ${updatedUserProfile.answers.length})`
  );

  const answer: Answer = {
    question_id: body.question_id,
    topic: opinion.topic.toLowerCase().replace(/\s+/g, "_"),
    statement: opinion.text,
    agree: body.agree,
  };

  await scoringSystem.updateScoresFromAnswer(updatedUserProfile, answer);

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

  return jsonResponse(response);
}

async function handleGetMatches({
  scoringSystem,
  userManager,
  userProfile,
  userId,
}: UserRouteContext): Promise<Response> {
  console.log(`[GET matches] answers: ${userProfile.answers.length}`);
  if (userProfile.answers.length === 0) {
    console.log(`[GET matches] ⚠️ No answers yet`);
    return jsonResponse({
      user_id: userId,
      total_answers: 0,
      candidates: [],
      user_preferences_summary: "No answers yet.",
    });
  }

  const matches = await scoringSystem.getCandidateScores(userProfile, true);
  console.log(`[GET matches] ✅ Found ${matches.length} candidates`);

  const candidates: CandidateScore[] = matches.map(([c, score]) => ({
    candidate_name: c.name,
    party: c.party,
    score,
    match_percentage: Math.round(score),
  }));

  const summary = userManager.getUserPreferencesSummary(userProfile);

  const response: MatchesResponse = {
    user_id: userId,
    total_answers: userProfile.answers.length,
    candidates,
    user_preferences_summary: summary,
  };

  return jsonResponse(response);
}

async function handleGetUserProfile({
  userProfile,
}: UserRouteContext): Promise<Response> {
  console.log(
    `[GET user] topics: ${userProfile.selected_topics.length}, answers: ${userProfile.answers.length}`
  );
  const response: UserResponse = {
    user_id: userProfile.user_id,
    selected_topics: userProfile.selected_topics,
    answers_count: userProfile.answers.length,
    status: "active",
  };
  return jsonResponse(response);
}

