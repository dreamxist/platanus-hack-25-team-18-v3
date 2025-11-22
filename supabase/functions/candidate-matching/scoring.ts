// Scoring system for candidate matching
import type { Answer, Candidate, UserProfile } from "./types.ts";
import { matchByTopic, generateEmbeddingForUserInput } from "./matching.ts";
import { UserManager } from "./user-manager.ts";

export class ScoringSystem {
  public userManager: UserManager;

  constructor(userManager: UserManager) {
    this.userManager = userManager;
  }

  /**
   * Update candidate scores based on a user's answer
   */
  async updateScoresFromAnswer(
    userProfile: UserProfile,
    answer: Answer
  ): Promise<void> {
    // 1. Calculate score updates based on the answer
    const scoreUpdates: Record<number, number> = {};

    // Get the embedding from the opinion (not from answer - answers don't have embeddings)
    // We need to get the opinion to access its embedding
    const opinionIdMatch = answer.question_id.match(/^q_(\d+)$/);
    if (!opinionIdMatch) {
      console.error("Invalid question_id format:", answer.question_id);
      return;
    }

    const opinionId = parseInt(opinionIdMatch[1], 10);
    const opinion = await this.userManager.getOpinion(opinionId);

    if (!opinion) {
      console.error("Opinion not found for question_id:", answer.question_id);
      return;
    }

    // Use opinion embedding if available, otherwise generate it from opinion text
    // Note: We use opinion.text directly, not answer.statement, since we have the opinion object
    let userAnswerEmbedding: number[];
    const opinionText = opinion.text || answer.statement || "";

    if (!opinionText) {
      console.error(
        `[updateScoresFromAnswer] No text available for opinion ${opinionId}`
      );
      return;
    }

    if (opinion.embedding && opinion.embedding.length > 0) {
      // Parse if string (should be handled by Supabase client but just in case)
      if (typeof opinion.embedding === "string") {
        try {
          userAnswerEmbedding = JSON.parse(opinion.embedding);
        } catch {
          console.log(
            `[updateScoresFromAnswer] Failed to parse embedding string, generating new one from opinion text`
          );
          userAnswerEmbedding = await generateEmbeddingForUserInput(
            opinionText
          );
        }
      } else {
        userAnswerEmbedding = opinion.embedding;
      }
    } else {
      // Fallback: generate embedding if opinion doesn't have one
      console.log(
        `[updateScoresFromAnswer] Opinion has no embedding, generating new one from opinion text`
      );
      userAnswerEmbedding = await generateEmbeddingForUserInput(opinionText);
    }

    // Validate embedding dimensions
    if (!userAnswerEmbedding || userAnswerEmbedding.length === 0) {
      console.error(
        `[updateScoresFromAnswer] Invalid embedding generated for question ${answer.question_id}`
      );
      return;
    }
    console.log(
      `[updateScoresFromAnswer] Using embedding with ${userAnswerEmbedding.length} dimensions`
    );

    if (answer.agree) {
      // User agrees: find candidates with similar opinions
      const matches = await matchByTopic(
        userAnswerEmbedding,
        answer.topic,
        this.userManager,
        5
      );

      for (const match of matches) {
        scoreUpdates[match.candidate_id] =
          (scoreUpdates[match.candidate_id] || 0) + match.score;
      }
    }

    if (Object.keys(scoreUpdates).length === 0) {
      return;
    }

    const candidateIds = Object.keys(scoreUpdates).map(Number);
    const { data: currentScores } = await this.userManager.supabase
      .from("UserMatches")
      .select("candidate_id, score")
      .eq("user_id", userProfile.user_id)
      .in("candidate_id", candidateIds);

    const currentScoreMap = new Map<number, number>();
    if (currentScores) {
      for (const s of currentScores) {
        currentScoreMap.set(s.candidate_id, s.score);
      }
    }

    // 3. Prepare upsert data
    const upsertData: Array<{
      user_id: string;
      candidate_id: number;
      score: number;
    }> = [];
    for (const [candidateIdStr, increment] of Object.entries(scoreUpdates)) {
      const candidateId = Number(candidateIdStr);
      const currentScore = currentScoreMap.get(candidateId) || 0;
      const newScore = currentScore + increment;

      upsertData.push({
        user_id: userProfile.user_id,
        candidate_id: candidateId,
        score: newScore,
      });
    }

    // 4. Persist to DB
    const { error } = await this.userManager.supabase
      .from("UserMatches")
      .upsert(upsertData, { onConflict: "user_id,candidate_id" });

    if (error) {
      console.error("Error updating scores:", error);
    }
  }

  /**
   * Get current candidate scores for a user
   */
  async getCandidateScores(
    userProfile: UserProfile,
    normalize: boolean = true
  ): Promise<Array<[Candidate, number]>> {
    // Query UserMatches joined with Candidates
    const { data: matches } = await this.userManager.supabase
      .from("UserMatches")
      .select(
        `
        score,
        candidate_id,
        Candidates (
          id,
          name,
          political_party
        )
      `
      )
      .eq("user_id", userProfile.user_id);

    if (!matches || matches.length === 0) {
      return [];
    }

    const scores: Array<[Candidate, number]> = [];
    const rawScores = matches.map((m) => m.score);

    const maxScore = rawScores.length > 0 ? Math.max(...rawScores) : 1.0;
    const minScore = rawScores.length > 0 ? Math.min(...rawScores) : 0.0;
    const scoreRange = maxScore - minScore || 1.0;

    for (const match of matches) {
      const candidateData = match.Candidates as any; // Supabase types workaround

      let normalized: number;
      if (normalize) {
        if (scoreRange > 0) {
          normalized = ((match.score - minScore) / scoreRange) * 100;
        } else {
          normalized = 50.0;
        }
      } else {
        normalized = match.score;
      }

      scores.push([
        {
          name: candidateData.name,
          party: candidateData.political_party,
          opinions: {}, // Not needed for display
        },
        normalized,
      ]);
    }

    // Sort by score
    scores.sort((a, b) => b[1] - a[1]);

    return scores;
  }

  /**
   * Check if there's a strong match (score above threshold)
   */
  async hasStrongMatch(
    userProfile: UserProfile,
    threshold: number = 70.0
  ): Promise<boolean> {
    const scores = await this.getCandidateScores(userProfile, true);
    if (scores.length === 0) {
      return false;
    }

    const topScore = scores[0][1];
    return topScore >= threshold;
  }
}
