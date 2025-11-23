// Type definitions for candidate matching system

export interface Candidate {
  name: string;
  party: string;
  opinions: Record<string, string>;
}

export interface Answer {
  question_id: number;
  topic: string;
  statement: string;
  agree: boolean;
}

export interface UserProfile {
  user_id: string;
  selected_topics: string[];
  answers: Answer[];
  user_preferences?: string[];
  current_question_index: number;
}

export interface Question {
  question_id: string;
  topic: string;
  statement: string;
}

export interface CandidateScore {
  candidate_name: string;
  party: string;
  score: number;
  match_percentage: number;
}

export interface UserResponse {
  user_id: string;
  selected_topics: string[];
  answers_count: number;
  status: string;
}

export interface QuestionResponse {
  question_id: number;
  topic: string;
  statement: string;
}

export interface AnswerRequest {
  question_id: number;
  agree: boolean;
}

export interface AnswerResponse {
  question_id: number;
  answer_accepted: boolean;
  current_scores?: Record<string, number>;
  has_strong_match: boolean;
}

export interface MatchesResponse {
  user_id: string;
  total_answers: number;
  candidates: CandidateScore[];
  user_preferences_summary?: string;
}

export interface TopicSelection {
  topics: string[];
}

// Available topics
export const TOPICS = [
  "economia",
  "educacion",
  "seguridad_social",
  "salud",
  "medio_ambiente",
  "seguridad",
  "migracion",
] as const;

export type Topic = (typeof TOPICS)[number];
