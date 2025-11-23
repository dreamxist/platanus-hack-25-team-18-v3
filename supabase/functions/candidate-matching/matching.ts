// Matching utilities using pre-calculated embeddings from database
import type { Candidate } from "./types.ts";
import { UserManager } from "./user-manager.ts";

/**
 * Calculate cosine similarity between two vectors
 */
export function calculateCosineSimilarity(
  vec1: number[],
  vec2: number[]
): number {
  if (vec1.length !== vec2.length) {
    throw new Error("Vectors must have the same length");
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) {
    return 0.0;
  }

  return dotProduct / (norm1 * norm2);
}

/**
 * Match user response for a specific topic to candidates
 * Uses pre-calculated embeddings from database for efficiency
 */
export async function matchByTopic(
  userResponseEmbedding: number[],
  topic: string,
  userManager: UserManager
): Promise<Array<{ candidate_id: number; score: number }>> {
  // Get opinions with embeddings for this topic from database
  const opinions = await userManager.getOpinionsForTopics([topic]);

  if (opinions.length === 0) {
    return [];
  }

  // Filter opinions that have embeddings
  const opinionsWithEmbeddings = opinions.filter(
    (op) => op.embedding && op.embedding.length > 0
  );

  if (opinionsWithEmbeddings.length === 0) {
    console.warn("No opinions with embeddings found for topic:", topic);
    return [];
  }

  // Group opinions by candidate and calculate average similarity
  const candidateSimilarities: Record<
    number,
    { candidate_id: number; similarities: number[] }
  > = {};

  console.log(
    `[matchByTopic] Found ${opinionsWithEmbeddings.length} opinions with embeddings for topic: ${topic}`
  );
  console.log(
    `[matchByTopic] User embedding dimensions: ${userResponseEmbedding.length}`
  );

  for (const opinion of opinionsWithEmbeddings) {
    if (!opinion.embedding) continue;

    // Parse embedding if it's a string
    let opinionEmbedding: number[];
    if (typeof opinion.embedding === "string") {
      try {
        opinionEmbedding = JSON.parse(opinion.embedding);
      } catch (e) {
        console.log(
          `[matchByTopic] Failed to parse embedding for opinion ${opinion.id}:`,
          e
        );
        continue;
      }
    } else {
      opinionEmbedding = opinion.embedding;
    }

    // Validate dimensions match
    if (opinionEmbedding.length !== userResponseEmbedding.length) {
      console.log(
        `[matchByTopic] Dimension mismatch: user embedding has ${userResponseEmbedding.length} dimensions, ` +
          `opinion ${opinion.id} embedding has ${opinionEmbedding.length} dimensions. Skipping.`
      );
      continue;
    }

    if (!candidateSimilarities[opinion.candidate_id]) {
      candidateSimilarities[opinion.candidate_id] = {
        candidate_id: opinion.candidate_id,
        similarities: [],
      };
    }

    // Calculate similarity between user response and opinion embedding
    try {
      const similarity = calculateCosineSimilarity(
        userResponseEmbedding,
        opinionEmbedding
      );
      candidateSimilarities[opinion.candidate_id].similarities.push(similarity);
    } catch (e) {
      console.warn(
        `[matchByTopic] Error calculating similarity for opinion ${opinion.id}:`,
        e
      );
      continue;
    }
  }

  // Calculate average score per candidate using top 3 similarities
  const candidateScores: Record<number, number> = {};
  for (const data of Object.values(candidateSimilarities)) {
    // Sort similarities in descending order and take top 3
    const sortedSimilarities = [...data.similarities].sort((a, b) => b - a);
    const top3Similarities = sortedSimilarities.slice(0, 3);

    // Calculate average of top 3 similarities
    const avgScore =
      top3Similarities.length > 0
        ? top3Similarities.reduce((sum, s) => sum + s, 0) /
          top3Similarities.length
        : 0;

    candidateScores[data.candidate_id] = avgScore;
  }

  // Normalize scores so sum equals 1
  const totalScore = Object.values(candidateScores).reduce(
    (sum, score) => sum + score,
    0
  );

  const results: Array<{ candidate_id: number; score: number }> = [];

  if (totalScore === 0) {
    // If all scores are zero, return equal distribution
    const numCandidates = Object.keys(candidateScores).length;
    if (numCandidates > 0) {
      const normalizedScore = 1.0 / numCandidates;
      for (const candidateId of Object.keys(candidateScores).map(Number)) {
        results.push({ candidate_id: candidateId, score: normalizedScore });
      }
    }
  } else {
    // Normalize scores
    for (const [candidateId, score] of Object.entries(candidateScores)) {
      const normalizedScore = score / totalScore;
      results.push({
        candidate_id: Number(candidateId),
        score: normalizedScore,
      });
    }
  }

  // Sort by score (highest first)
  results.sort((a, b) => b.score - a.score);

  return results;
}

/**
 * Generate embedding for user input (only when needed, e.g., for user answers)
 * This should be used sparingly - most embeddings should be pre-calculated
 */
export async function generateEmbeddingForUserInput(
  text: string
): Promise<number[]> {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const OPENAI_EMBEDDING_MODEL = "text-embedding-3-small";

  if (!OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY environment variable is not set");
  }

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_EMBEDDING_MODEL,
      input: text,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${error}`);
  }

  const data = await response.json();
  return data.data[0].embedding;
}
