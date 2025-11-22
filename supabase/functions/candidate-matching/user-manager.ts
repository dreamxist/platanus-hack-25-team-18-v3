// User profile manager using Supabase database
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Answer, UserProfile } from "./types.ts";

// Get Supabase client from environment
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = Deno.env.get("SUPABASE_URL") ||
    Deno.env.get("SUPABASE_PROJECT_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ||
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
      .select(`
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
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: true });

    const answers: Answer[] = [];
    if (answersData) {
      for (const a of answersData) {
        const opinion = a.Opinions as {
          id: number;
          text: string;
          Topics: { name: string };
          Candidates: { name: string };
        } | null;

        if (opinion) {
          // Generate a question_id from opinion_id
          const questionId = `q_${opinion.id}`;
          const topic = opinion.Topics.name.toLowerCase().replace(/\s+/g, "_");

          answers.push({
            question_id: questionId,
            topic,
            statement: opinion.text,
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
          n.split("_").map((w) =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(" ")
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

    const { error } = await this.supabase.from("UserTopics").insert(
      userTopics
    );

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
      .select(`
        id,
        text,
        embedding,
        candidate_id,
        topic_id,
        Topics(name),
        Candidates(name, political_party)
      `)
      .eq("id", opinionId)
      .single();

    if (error || !data) {
      return null;
    }

    return {
      id: data.id,
      text: data.text,
      embedding: data.embedding,
      topic: (data.Topics as { name: string }).name,
      candidate: (data.Candidates as { name: string; political_party: string })
        .name,
      candidate_party: (data.Candidates as { name: string; political_party: string })
        .political_party,
    };
  }

  /**
   * Get a random unanswered question for the user
   */
  async getNextRandomQuestion(
    userId: string,
    topicNames: string[]
  ): Promise<{
    question_id: string;
    topic: string;
    statement: string;
  } | null> {
    // 1. Get topic IDs
    const { data: topicsData } = await this.supabase
      .from("Topics")
      .select("id, name")
      .in(
        "name",
        topicNames.map((n) =>
          n.split("_").map((w) =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(" ")
        )
      );

    if (!topicsData || topicsData.length === 0) {
      return null;
    }
    const topicIds = topicsData.map((t) => t.id);

    // 2. Get IDs of opinions already answered by the user
    const { data: answeredData } = await this.supabase
      .from("Answers")
      .select("opinion_id")
      .eq("user_id", userId);
    
    const answeredOpinionIds = answeredData?.map(a => a.opinion_id) || [];
    console.log(`[getNextRandomQuestion] User has answered ${answeredOpinionIds.length} opinions`);

    // 3. Fetch a random opinion that hasn't been answered
    // Note: "random" in SQL can be slow for huge tables, but fine for this scale.
    // We use a stored procedure or just order by random() if supported,
    // but Supabase JS client doesn't support .order('random()') directly easily without RPC.
    // Workaround: Fetch a batch of candidate opinions and pick one randomly in code,
    // OR use an RPC. For now, let's fetch a batch of un-answered opinions and pick one.

    const query = this.supabase
      .from("Opinions")
      .select(`
        id,
        text,
        Topics!inner(name),
        Candidates!inner(name)
      `)
      .in("topic_id", topicIds);

    // Fetch a large batch to ensure we have enough candidates
    // Using 1000 instead of 50 to handle cases where user has answered many questions
    const { data: allOpinions, error } = await query.limit(1000);

    if (error) {
      console.error(`[getNextRandomQuestion] Query error:`, error);
      return null;
    }

    if (!allOpinions || allOpinions.length === 0) {
      console.log(`[getNextRandomQuestion] No opinions found for topics`);
      return null;
    }

    // Filter out already answered opinions in memory
    const answeredSet = new Set(answeredOpinionIds);
    const opinions = allOpinions.filter((op) => !answeredSet.has(op.id));

    if (!opinions || opinions.length === 0) {
      console.log(`[getNextRandomQuestion] No more unanswered opinions available`);
      return null;
    }

    // Pick one randomly
    const randomOpinion = opinions[Math.floor(Math.random() * opinions.length)];
    console.log(`[getNextRandomQuestion] Selected opinion ${randomOpinion.id} from ${opinions.length} candidates`);

    return {
      question_id: `q_${randomOpinion.id}`,
      topic: (randomOpinion.Topics as { name: string }).name.toLowerCase().replace(/\s+/g, "_"),
      statement: randomOpinion.text,
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
          n.split("_").map((w) =>
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(" ")
        )
      );

    if (!topicsData || topicsData.length === 0) {
      return [];
    }

    const topicIds = topicsData.map((t) => t.id);

    // Get opinions for these topics (including embeddings if available)
    const { data: opinionsData } = await this.supabase
      .from("Opinions")
      .select(`
        id,
        text,
        embedding,
        candidate_id,
        topic_id,
        Topics(name),
        Candidates(name, political_party)
      `)
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
      candidate_party: (op.Candidates as { name: string; political_party: string })
        .political_party,
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
      const topicSummary = `${topic.charAt(0).toUpperCase() + topic.slice(1)}: `;
      if (preferences.length === 1) {
        summaryParts.push(topicSummary + preferences[0]);
      } else {
        // Combine multiple preferences for the topic
        const combined = preferences.slice(0, 3).join("; ");
        const more = preferences.length > 3
          ? ` (and ${preferences.length - 3} more)`
          : "";
        summaryParts.push(topicSummary + combined + more);
      }
    }

    return summaryParts.join(" | ");
  }
}

// User manager instance will be created with proper Supabase client in index.ts
