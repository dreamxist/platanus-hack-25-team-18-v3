// Updated interfaces to match database structure
export interface Idea {
  id: number;
  candidateId: number;
  text: string;
  topicId: number;
  topicName: string;
  emoji: string;
}

export interface Candidate {
  id: number;
  name: string;
  partyName: string;
  shortLabel: string;
  avatarUrl: string;
  color: string;
  age?: number;
}

export interface UserAnswer {
  opinionId: number;
  candidateId: number;
  answer: "agree" | "disagree";
}

// Mock data removed - now using real database data
// These arrays are kept empty for backwards compatibility
export const candidates: Candidate[] = [];
export const ideas: Idea[] = [];

// Helper functions updated to work with database structure
export function getTopCandidate(
  answers: UserAnswer[],
  availableCandidates: Candidate[]
): Candidate | null {
  if (answers.length === 0) return null;

  const scores = new Map<number, { agree: number; total: number }>();

  answers.forEach((answer) => {
    const current = scores.get(answer.candidateId) || { agree: 0, total: 0 };
    scores.set(answer.candidateId, {
      agree: current.agree + (answer.answer === "agree" ? 1 : 0),
      total: current.total + 1,
    });
  });

  let topCandidate: Candidate | null = null;
  let topScore = 0;

  scores.forEach((score, candidateId) => {
    const percentage = (score.agree / score.total) * 100;
    if (percentage > topScore) {
      topScore = percentage;
      topCandidate =
        availableCandidates.find((c) => c.id === candidateId) || null;
    }
  });

  return topCandidate;
}

export function getCandidateScore(
  candidateId: number,
  answers: UserAnswer[]
): number {
  const candidateAnswers = answers.filter((a) => a.candidateId === candidateId);
  if (candidateAnswers.length === 0) return 0;

  const agrees = candidateAnswers.filter((a) => a.answer === "agree").length;
  return Math.round((agrees / candidateAnswers.length) * 100);
}

export function getTopicScores(
  candidateId: number,
  answers: UserAnswer[],
  allIdeas: Idea[]
): Record<string, number> {
  const topicScores: Record<string, { agree: number; total: number }> = {};

  answers
    .filter((a) => a.candidateId === candidateId)
    .forEach((answer) => {
      const idea = allIdeas.find((i) => i.id === answer.opinionId);
      if (!idea) return;

      const current = topicScores[idea.topicName] || { agree: 0, total: 0 };
      topicScores[idea.topicName] = {
        agree: current.agree + (answer.answer === "agree" ? 1 : 0),
        total: current.total + 1,
      };
    });

  const percentages: Record<string, number> = {};
  Object.entries(topicScores).forEach(([topic, score]) => {
    percentages[topic] = Math.round((score.agree / score.total) * 100);
  });

  return percentages;
}
