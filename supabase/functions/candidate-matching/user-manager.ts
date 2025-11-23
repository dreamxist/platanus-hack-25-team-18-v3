// User profile manager using Supabase database
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Answer, UserProfile } from "./types.ts";
import { OpinionWithEmbedding, pickFarthestOpinion } from "./matching.ts";

// Get Supabase client from environment
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl =
    Deno.env.get("SUPABASE_URL") || Deno.env.get("SUPABASE_PROJECT_URL")!;
  const supabaseKey =
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
    Deno.env.get("SUPABASE_ANON_KEY")!;

  return createClient(supabaseUrl, supabaseKey);
}

export class UserManager {
  public supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || getSupabaseClient();
  }

  /**
   * Create a new user profile (or get existing one)
   */
  async createUserProfile(userId?: string): Promise<UserProfile> {
    const userIdFinal = userId || crypto.randomUUID();

    const userProfile: UserProfile = {
      user_id: userIdFinal,
      selected_topics: [],
      answers: [],
      current_question_index: 0,
    };

    return userProfile;
  }

  /**
   * Get a user profile by user_id
   */
  async getUserProfile(userId: string): Promise<UserProfile | null> {
    // Get selected topics for this user
    const { data: userTopicsData } = await this.supabase
      .from("UserTopics")
      .select("topic_id, Topics(name)")
      .eq("user_id", userId);

    const selectedTopics: string[] = [];
    if (userTopicsData) {
      for (const ut of userTopicsData) {
        const topic = ut.Topics as { name: string } | null;
        if (topic) {
          selectedTopics.push(topic.name.toLowerCase().replace(/\s+/g, "_"));
        }
      }
    }

    // Get answers for this user
    const { data: answersData } = await this.supabase
      .from("Answers")
      .select(
        `
        id,
        opinion_id,
        choice,
        created_at,
        Opinions!inner(
          id,
          text,
          Topics!inner(name),
          Candidates!inner(name)
        )
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const answers: Answer[] = [];
    if (answersData) {
      for (const a of answersData) {
        const opinion = a.Opinions as {
          id: number;
          text: string;
          asseveration: string;
          Topics: { name: string };
          Candidates: { name: string };
        } | null;

        if (opinion) {
          // Generate a question_id from opinion_id
          const questionId = `${opinion.id}`;
          const topic = opinion.Topics.name.toLowerCase().replace(/\s+/g, "_");

          answers.push({
            question_id: questionId,
            topic,
            statement: opinion.asseveration || opinion.text,
            agree: a.choice,
          });
        }
      }
    }

    return {
      user_id: userId,
      selected_topics: selectedTopics,
      answers,
      current_question_index: answers.length,
    };
  }

  async updateUserTopics(
    userId: string,
    topicNames: string[]
  ): Promise<boolean> {
    // First, get topic IDs from topic names
    const { data: topicsData } = await this.supabase
      .from("Topics")
      .select("id, name")
      .in(
        "name",
        topicNames.map((n) =>
          n
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        )
      );

    if (!topicsData || topicsData.length === 0) {
      return false;
    }

    // Delete existing user topics
    await this.supabase.from("UserTopics").delete().eq("user_id", userId);

    // Insert new user topics
    const userTopics = topicsData.map((topic) => ({
      user_id: userId,
      topic_id: topic.id,
    }));

    const { error } = await this.supabase.from("UserTopics").insert(userTopics);

    return !error;
  }

  async addAnswer(
    userId: string,
    opinionId: number,
    choice: boolean
  ): Promise<boolean> {
    const answerData = {
      user_id: userId,
      opinion_id: opinionId,
      choice: choice,
    };

    const { error } = await this.supabase.from("Answers").insert(answerData);

    return !error;
  }

  /**
   * Get opinion by ID
   */
  async getOpinion(opinionId: number) {
    const { data, error } = await this.supabase
      .from("Opinions")
      .select(
        `
        id,
        text,
        embedding,
        candidate_id,
        topic_id,
        Topics!inner(name),
        Candidates!inner(name, political_party)
      `)
      .eq("id", opinionId)
      .single();

    if (error) {
      console.error(`[getOpinion] Error fetching opinion ${opinionId}:`, error);
      return null;
    }

    if (!data) {
      console.error(`[getOpinion] No data returned for opinion ${opinionId}`);
      return null;
    }

    if (!data.Topics || !data.Candidates) {
      console.error(`[getOpinion] Missing relations for opinion ${opinionId}:`, {
        hasTopics: !!data.Topics,
        hasCandidates: !!data.Candidates
      });
      return null;
    }

    return {
      id: data.id,
      text: data.text,
      embedding: data.embedding,
      asseveration: data.asseveration,
      topic: (data.Topics as { name: string }[])[0]?.name || "",
      candidate: (data.Candidates as { name: string; political_party: string }[])[0]?.name || "",
      candidate_party: (
        data.Candidates as { name: string; political_party: string }[]
      )[0]?.political_party || "",
    };
  }

  /**
   * Get a random unanswered question for the user
   */
  async getNextRandomQuestion(
    userId: string
  ): Promise<{
    question_id: number;
    topic: string;
    statement: string;
  } | null> {
    // 1. User topics
    const { data: userTopicsData, error: topicsError } = await this.supabase
      .from("UserTopics")
      .select("topic_id")
      .eq("user_id", userId);
  
    if (topicsError) {
      console.error("[getNextRandomQuestion] Error fetching topics:", topicsError);
      return null;
    }
  
    if (!userTopicsData || userTopicsData.length === 0) {
      console.log(`[getNextRandomQuestion] No topics found for user ${userId}`);
      return null;
    }
  
    const allTopicIds = userTopicsData.map((ut) => ut.topic_id as number);
  
    // 2. Answers of the user
    const { data: answeredData, error: answeredError } = await this.supabase
      .from("Answers")
      .select("opinion_id")
      .eq("user_id", userId);
  
    if (answeredError) {
      console.error(
        "[getNextRandomQuestion] Error fetching answered opinions:",
        answeredError
      );
      return null;
    }
  
    const answeredOpinionIds =
      answeredData?.map((a) => a.opinion_id as number) ?? [];
  
    // 3. Embeddings of answered opinions (for distance calc)
    let chosenEmbeddings: number[][] = [];
  
    if (answeredOpinionIds.length > 0) {
      const { data: answeredOpinions, error: answeredOpinionsError } =
        await this.supabase
          .from("Opinions")
          .select("id, embedding, topic_id")
          .in("id", answeredOpinionIds);
  
      if (answeredOpinionsError) {
        console.error(
          "[getNextRandomQuestion] Error fetching embeddings for answered opinions:",
          answeredOpinionsError
        );
        return null;
      }
  
      chosenEmbeddings =
        answeredOpinions
          ?.map((o) => o.embedding as number[] | null)
          .filter((e): e is number[] => Array.isArray(e)) ?? [];
  
      // 4. Topics that already have at least one answer
      const answeredTopicSet = new Set<number>(
        answeredOpinions?.map((o) => o.topic_id as number) ?? []
      );
  
      // Topics selected by the user that still have zero answers
      const unansweredTopics = allTopicIds.filter(
        (t) => !answeredTopicSet.has(t)
      );
  
      // If there are topics with no answers yet, we restrict selection to those.
      // Otherwise we use all selected topics.
      var topicIdsForThisPick =
        unansweredTopics.length > 0 ? unansweredTopics : allTopicIds;
  
      console.log(
        `[getNextRandomQuestion] Topics with answers: ${answeredTopicSet.size}, ` +
          `topics without answers: ${unansweredTopics.length}, ` +
          `using ${topicIdsForThisPick.length} topics for selection`
      );
    } else {
      // No answers yet: all topics are "unanswered"
      var topicIdsForThisPick = allTopicIds;
      console.log(
        "[getNextRandomQuestion] User has no answers yet, using all topics"
      );
    }
  
    // 5. Fetch candidate opinions for the chosen topics and not yet answered
    let opinionsQuery = this.supabase
      .from("Opinions")
      .select(
        `
          id,
          text,
          asseveration,
          embedding,
          Topics!inner(name)
        `
      )
      .in("topic_id", topicIdsForThisPick);
  
    if (answeredOpinionIds.length > 0) {
      const ids = answeredOpinionIds.join(",");
      opinionsQuery = opinionsQuery.not("id", "in", `(${ids})`);
    }
  
    const { data: opinions, error: opinionsError } = await opinionsQuery;
  
    if (opinionsError) {
      console.error("[getNextRandomQuestion] Error fetching opinions:", opinionsError);
      return null;
    }
  
    if (!opinions || opinions.length === 0) {
      console.log("[getNextRandomQuestion] No unanswered opinions available");
      return null;
    }
  
    const candidates = (opinions as any as OpinionWithEmbedding[]).filter(
      (op) => Array.isArray(op.embedding) && op.embedding.length > 0
    );
  
    let selectedOpinion: OpinionWithEmbedding;
  
    if (chosenEmbeddings.length === 0 || candidates.length === 0) {
      const pool =
        candidates.length > 0
          ? candidates
          : (opinions as any as OpinionWithEmbedding[]);
      selectedOpinion = pool[Math.floor(Math.random() * pool.length)];
      console.log(
        `[getNextRandomQuestion] Using random selection (no answered embeddings or no embedded candidates)`
      );
    } else {
      selectedOpinion = pickFarthestOpinion(candidates, chosenEmbeddings);
      console.log(
        `[getNextRandomQuestion] Selected opinion ${selectedOpinion.id} using farthest-point strategy among ${candidates.length} candidates`
      );
    }
  
    const topicName = (selectedOpinion.Topics as { name: string }).name;
  
    return {
      question_id: selectedOpinion.id,
      topic: topicName.toLowerCase().replace(/\s+/g, "_"),
      statement: selectedOpinion.asseveration || selectedOpinion.text || "",
    };
  }

  /**
   * Get all opinions for selected topics
   */
  async getOpinionsForTopics(topicNames: string[]) {
    // Get topic IDs
    const { data: topicsData } = await this.supabase
      .from("Topics")
      .select("id, name")
      .in(
        "name",
        topicNames.map((n) =>
          n
            .split("_")
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(" ")
        )
      );

    if (!topicsData || topicsData.length === 0) {
      return [];
    }

    const topicIds = topicsData.map((t) => t.id);

    // Get opinions for these topics (including embeddings if available)
    const { data: opinionsData } = await this.supabase
      .from("Opinions")
      .select(
        `
        id,
        text,
        embedding,
        candidate_id,
        topic_id,
        Topics(name),
        Candidates(name, political_party)
      `
      )
      .in("topic_id", topicIds)
      .not("embedding", "is", null); // Only get opinions with embeddings

    if (!opinionsData) {
      return [];
    }

    return opinionsData.map((op) => ({
      id: op.id,
      text: op.text,
      embedding: op.embedding as number[] | null,
      topic: (op.Topics as { name: string }).name,
      topic_id: op.topic_id,
      candidate: (op.Candidates as { name: string; political_party: string })
        .name,
      candidate_party: (
        op.Candidates as { name: string; political_party: string }
      ).political_party,
      candidate_id: op.candidate_id,
    }));
  }

  /**
   * Get opinions with embeddings for vector similarity search
   * Uses pgvector for efficient similarity search
   */
  async getOpinionsBySimilarity(
    queryEmbedding: number[],
    topicIds: number[],
    limit: number = 10
  ) {
    // Use pgvector's cosine distance operator (<=>)
    // Note: Supabase client doesn't directly support pgvector operators,
    // so we'll use a raw SQL query via RPC or use the embedding directly
    const { data, error } = await this.supabase.rpc("match_opinions", {
      query_embedding: queryEmbedding,
      topic_ids: topicIds,
      match_threshold: 0.5,
      match_count: limit,
    });

    if (error) {
      console.error("Error in match_opinions RPC:", error);
      // Fallback to regular query if RPC doesn't exist
      return this.getOpinionsForTopics(
        topicIds.map(() => "") // Will be handled by topic_id filter
      );
    }

    return data || [];
  }

  /**
   * Generate a text summary of user preferences from their answers
   */
  getUserPreferencesText(userProfile: UserProfile): string {
    if (userProfile.answers.length === 0) {
      return "No preferences recorded yet.";
    }

    const preferenceParts = userProfile.answers.map((answer) => {
      if (answer.agree) {
        return `${answer.topic}: ${answer.statement}`;
      } else {
        return `${answer.topic}: Disagrees with '${answer.statement}'`;
      }
    });

    return preferenceParts.join(" | ");
  }

  /**
   * Generate a semantic summary of user preferences
   */
  getUserPreferencesSummary(userProfile: UserProfile): string {
    if (userProfile.answers.length === 0) {
      return "No preferences recorded yet.";
    }

    // Group preferences by topic
    const topicPreferences: Record<string, string[]> = {};
    for (const answer of userProfile.answers) {
      if (!topicPreferences[answer.topic]) {
        topicPreferences[answer.topic] = [];
      }

      if (answer.agree) {
        topicPreferences[answer.topic].push(answer.statement);
      } else {
        topicPreferences[answer.topic].push(
          `Disagrees with: ${answer.statement}`
        );
      }
    }

    // Create summary by topic
    const summaryParts: string[] = [];
    for (const [topic, preferences] of Object.entries(topicPreferences)) {
      const topicSummary = `${
        topic.charAt(0).toUpperCase() + topic.slice(1)
      }: `;
      if (preferences.length === 1) {
        summaryParts.push(topicSummary + preferences[0]);
      } else {
        // Combine multiple preferences for the topic
        const combined = preferences.slice(0, 3).join("; ");
        const more =
          preferences.length > 3 ? ` (and ${preferences.length - 3} more)` : "";
        summaryParts.push(topicSummary + combined + more);
      }
    }

    return summaryParts.join(" | ");
  }
}

// User manager instance will be created with proper Supabase client in index.ts
