import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

// Edge Function response types
export interface QuestionResponse {
  question_id: string;
  topic: string;
  statement: string;
}

export interface AnswerResponse {
  question_id: string;
  answer_accepted: boolean;
  current_scores?: Record<string, number>;
  has_strong_match: boolean;
}

export interface CandidateScore {
  candidate_name: string;
  party: string;
  score: number;
  match_percentage: number;
}

export interface MatchesResponse {
  user_id: string;
  total_answers: number;
  candidates: CandidateScore[];
  user_preferences_summary?: string;
}

export interface OpinionWithDetails {
  id: number;
  text: string;
  candidate_id: number;
  topic_id: number;
  candidate: {
    id: number;
    name: string;
    political_party: string;
    image: string;
    age: number;
  };
  topic: {
    id: number;
    name: string;
    emoji: string;
  };
}

export interface UserAnswerData {
  opinion_id: number;
  candidate_id: number;
  answer: "agree" | "disagree";
}

/**
 * Save a user's answer (like/dislike) to an opinion
 */
export async function saveAnswer(
  userId: string,
  opinionId: number,
  choice: boolean
): Promise<void> {
  const answer: TablesInsert<"Answers"> = {
    user_id: userId,
    opinion_id: opinionId,
    choice: choice,
  };

  const { error } = await supabase.from("Answers").insert(answer);

  if (error) {
    console.error("Error saving answer:", error);
    throw error;
  }
}

/**
 * Get all answers for a specific user
 */
export async function getUserAnswers(
  userId: string
): Promise<Tables<"Answers">[]> {
  const { data, error } = await supabase
    .from("Answers")
    .select("*")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user answers:", error);
    throw error;
  }

  return data || [];
}

/**
 * Get user's selected topic IDs from UserTopics table
 */
export async function getUserTopicIds(userId: string): Promise<number[]> {
  const { data, error } = await supabase
    .from("UserTopics")
    .select("topic_id")
    .eq("user_id", userId);

  if (error) {
    console.error("Error fetching user topics:", error);
    throw error;
  }

  return data?.map((ut) => ut.topic_id) || [];
}

/**
 * Get opinion details from question_id (format: "q_123")
 * Used to get candidate and topic info for questions from Edge Function
 */
export async function getOpinionFromQuestionId(
  questionId: string
): Promise<OpinionWithDetails | null> {
  // Extract opinion_id from question_id (format: "q_123")
  const opinionIdMatch = questionId.match(/^q_(\d+)$/);
  if (!opinionIdMatch) {
    console.error("Invalid question_id format:", questionId);
    return null;
  }

  const opinionId = parseInt(opinionIdMatch[1], 10);

  const { data, error } = await supabase
    .from("Opinions")
    .select(
      `
      id,
      text,
      candidate_id,
      topic_id,
      Candidates (
        id,
        name,
        political_party,
        image,
        age
      ),
      Topics (
        id,
        name,
        emoji
      )
    `
    )
    .eq("id", opinionId)
    .single();

  if (error || !data) {
    console.error("Error fetching opinion:", error);
    return null;
  }

  if (!data.Candidates || !data.Topics) {
    return null;
  }

  return {
    id: data.id,
    text: data.text || "",
    candidate_id: data.candidate_id,
    topic_id: data.topic_id,
    candidate: {
      id: Array.isArray(data.Candidates)
        ? data.Candidates[0].id
        : data.Candidates.id,
      name: Array.isArray(data.Candidates)
        ? data.Candidates[0].name || ""
        : data.Candidates.name || "",
      political_party: Array.isArray(data.Candidates)
        ? data.Candidates[0].political_party || ""
        : data.Candidates.political_party || "",
      image: Array.isArray(data.Candidates)
        ? data.Candidates[0].image || ""
        : data.Candidates.image || "",
      age: Array.isArray(data.Candidates)
        ? data.Candidates[0].age || 0
        : data.Candidates.age || 0,
    },
    topic: {
      id: Array.isArray(data.Topics) ? data.Topics[0].id : data.Topics.id,
      name: Array.isArray(data.Topics) ? data.Topics[0].name : data.Topics.name,
      emoji: Array.isArray(data.Topics)
        ? data.Topics[0].emoji || ""
        : data.Topics.emoji || "",
    },
  };
}

/**
 * Get next random question from candidate-matching Edge Function
 * Calls GET /users/{user_id}/question
 */
export async function getNextQuestion(
  userId: string
): Promise<QuestionResponse | null> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Get session for auth token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const url = `${supabaseUrl}/functions/v1/candidate-matching/users/${userId}/question`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: session?.access_token
          ? `Bearer ${session.access_token}`
          : `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey || "",
      },
    });

    if (!response.ok) {
      // Handle specific error cases
      if (response.status === 400 || response.status === 404) {
        const errorData = await response.json().catch(() => ({}));
        if (
          errorData.error?.includes("No topics selected") ||
          errorData.error?.includes("No more questions")
        ) {
          return null;
        }
      }

      const errorText = await response.text();
      throw new Error(
        `Failed to fetch question: ${response.status} ${errorText}`
      );
    }

    const data: QuestionResponse = await response.json();
    return data;
  } catch (err) {
    console.error("Error in getNextQuestion:", err);
    throw err;
  }
}

/**
 * Submit an answer to the candidate-matching Edge Function
 * Calls POST /users/{user_id}/answer
 */
export async function submitAnswer(
  userId: string,
  questionId: string,
  agree: boolean
): Promise<AnswerResponse> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Get session for auth token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const url = `${supabaseUrl}/functions/v1/candidate-matching/users/${userId}/answer`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: session?.access_token
          ? `Bearer ${session.access_token}`
          : `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey || "",
      },
      body: JSON.stringify({
        question_id: questionId,
        agree: agree,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to submit answer: ${response.status} ${errorText}`
      );
    }

    const data: AnswerResponse = await response.json();
    return data;
  } catch (err) {
    console.error("Error in submitAnswer:", err);
    throw err;
  }
}

/**
 * Get candidate matches from candidate-matching Edge Function
 * Calls GET /users/{user_id}/matches
 */
export async function getMatches(userId: string): Promise<MatchesResponse> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

    // Get session for auth token
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const url = `${supabaseUrl}/functions/v1/candidate-matching/users/${userId}/matches`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: session?.access_token
          ? `Bearer ${session.access_token}`
          : `Bearer ${supabaseAnonKey}`,
        apikey: supabaseAnonKey || "",
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to fetch matches: ${response.status} ${errorText}`
      );
    }

    const data: MatchesResponse = await response.json();
    return data;
  } catch (err) {
    console.error("Error in getMatches:", err);
    throw err;
  }
}
