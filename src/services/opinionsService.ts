import { supabase } from "@/integrations/supabase/client";
import { Tables, TablesInsert } from "@/integrations/supabase/types";

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
 * Fetch all opinions with their associated topic and candidate data
 * Optionally filter by topic IDs
 */
export async function fetchOpinions(
  topicIds?: number[]
): Promise<OpinionWithDetails[]> {
  let query = supabase
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
    .order("id");

  if (topicIds && topicIds.length > 0) {
    query = query.in("topic_id", topicIds);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching opinions:", error);
    throw error;
  }

  if (!data) {
    return [];
  }

  return data
    .filter((opinion) => opinion.Candidates && opinion.Topics)
    .map((opinion) => ({
      id: opinion.id,
      text: opinion.text || "",
      candidate_id: opinion.candidate_id,
      topic_id: opinion.topic_id,
      candidate: {
        id: Array.isArray(opinion.Candidates)
          ? opinion.Candidates[0].id
          : opinion.Candidates.id,
        name: Array.isArray(opinion.Candidates)
          ? opinion.Candidates[0].name || ""
          : opinion.Candidates.name || "",
        political_party: Array.isArray(opinion.Candidates)
          ? opinion.Candidates[0].political_party || ""
          : opinion.Candidates.political_party || "",
        image: Array.isArray(opinion.Candidates)
          ? opinion.Candidates[0].image || ""
          : opinion.Candidates.image || "",
        age: Array.isArray(opinion.Candidates)
          ? opinion.Candidates[0].age || 0
          : opinion.Candidates.age || 0,
      },
      topic: {
        id: Array.isArray(opinion.Topics)
          ? opinion.Topics[0].id
          : opinion.Topics.id,
        name: Array.isArray(opinion.Topics)
          ? opinion.Topics[0].name
          : opinion.Topics.name,
        emoji: Array.isArray(opinion.Topics)
          ? (opinion.Topics[0] as any).emoji || ""
          : (opinion.Topics as any).emoji || "",
      },
    }));
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
