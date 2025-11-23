import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { UserAnswer, Idea, Candidate, getTopCandidate } from "@/data/mockData";
import {
  saveAnswer,
  getUserTopicIds,
  OpinionWithDetails,
  getNextQuestion,
  getOpinionFromQuestionId,
  QuestionResponse,
  submitAnswer as submitAnswerToEdgeFunction,
  getMatches,
  MatchesResponse,
} from "@/services/opinionsService";

interface Topic {
  id: number;
  name: string;
  emoji: string;
}

interface AppContextType {
  currentIdeaIndex: number;
  answers: UserAnswer[];
  ideas: Idea[];
  candidates: Candidate[];
  hasShownImminentMatch: boolean;
  topics: Topic[];
  isLoading: boolean;
  error: string | null;
  setTopics: (topics: Topic[]) => void;
  resetApp: () => void;
  getCurrentIdea: () => Idea | null;
  getProgress: () => { current: number; total: number };
  shouldShowMatch: () => boolean;
  markMatchShown: () => void;
  loadOpinions: (topicIds?: number[], userId?: string) => Promise<void>;
  answerIdea: (userId: string, answer: "agree" | "disagree") => Promise<void>;
  skipIdea: (userId: string) => Promise<void>;
  loadMatches: (userId: string) => Promise<MatchesResponse>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentIdeaIndex, setCurrentIdeaIndex] = useState(0);
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [hasShownImminentMatch, setHasShownImminentMatch] = useState(false);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingOpinions, setIsLoadingOpinions] = useState(false);

  const loadOpinions = useCallback(
    async (topicIds?: number[], userId?: string) => {
      // Prevent multiple simultaneous calls
      if (isLoadingOpinions) {
        console.log("AppContext - loadOpinions already in progress, skipping");
        return;
      }

      console.log(
        "AppContext - loadOpinions called with topicIds:",
        topicIds,
        "userId:",
        userId
      );
      setIsLoadingOpinions(true);
      setIsLoading(true);
      setError(null);

      // Reset state when loading new opinions
      setCurrentIdeaIndex(0);
      setAnswers([]);
      setHasShownImminentMatch(false);

      try {
        // Use Edge Function to fetch questions
        // Pre-fetch 3 questions for smooth swiping
        const preFetchCount = 3;
        const questions: Array<{
          question: QuestionResponse;
          opinion: OpinionWithDetails | null;
        }> = [];

        console.log(`AppContext - Pre-fetching ${preFetchCount} questions...`);
        for (let i = 0; i < preFetchCount; i++) {
          const question = await getNextQuestion(userId);
          console.log(`AppContext - Question ${i}:`, question);
          console.log(
            `AppContext - Question ID type:`,
            typeof question?.question_id
          );

          if (!question) {
            console.log(`AppContext - No more questions at index ${i}`);
            // No more questions available
            break;
          }

          // Get opinion details to get candidate and topic info
          // Extract opinion_id from question_id (can be number or string)
          let opinionId: number;
          if (typeof question.question_id === "number") {
            opinionId = question.question_id;
          } else if (typeof question.question_id === "string") {
            const match = question.question_id.match(/^q_(\d+)$/);
            opinionId = match
              ? parseInt(match[1], 10)
              : parseInt(question.question_id, 10);
          } else {
            console.warn(
              "Unexpected question_id type:",
              typeof question.question_id,
              question.question_id
            );
            continue;
          }
          const opinion = await getOpinionFromQuestionId(opinionId);
          console.log(
            `AppContext - Opinion for question ${question.question_id}:`,
            opinion
          );
          questions.push({ question, opinion });
        }
        console.log(`AppContext - Pre-fetched ${questions.length} questions`);

        if (questions.length === 0) {
          setError(
            "No hay más preguntas disponibles para los temas seleccionados."
          );
          setIsLoading(false);
          return;
        }

        // Transform questions to Ideas
        const transformedIdeas: Idea[] = [];
        const uniqueCandidates = new Map<number, Candidate>();

        for (const { question, opinion } of questions) {
          console.log("debug", question, opinion);
          if (!opinion) {
            console.warn(
              "Could not fetch opinion details for question:",
              question.question_id
            );
            continue;
          }

          // Extract opinion_id from question_id
          // question_id can be a number (7) or string ("q_7" or "7")
          let opinionId: number;

          if (typeof question.question_id === "number") {
            // Already a number, use directly
            opinionId = question.question_id;
          } else if (typeof question.question_id === "string") {
            // Try to match "q_123" format first
            const match = question.question_id.match(/^q_(\d+)$/);
            if (match) {
              opinionId = parseInt(match[1], 10);
            } else {
              // Try to parse as number directly
              opinionId = parseInt(question.question_id, 10);
              if (isNaN(opinionId)) {
                console.warn(
                  "Invalid question_id format:",
                  question.question_id
                );
                continue;
              }
            }
          } else {
            console.warn(
              "Unexpected question_id type:",
              typeof question.question_id,
              question.question_id
            );
            continue;
          }

          transformedIdeas.push({
            id: opinionId,
            candidateId: opinion.candidate_id,
            text: question.statement,
            topicId: opinion.topic_id,
            topicName: opinion.topic.name,
            emoji: opinion.topic.emoji,
          });

          // Track unique candidates
          if (!uniqueCandidates.has(opinion.candidate.id)) {
            uniqueCandidates.set(opinion.candidate.id, {
              id: opinion.candidate.id,
              name: opinion.candidate.name,
              partyName: opinion.candidate.political_party,
              shortLabel: opinion.candidate.name,
              avatarUrl: opinion.candidate.image,
              color: "hsl(270, 65%, 55%)",
              age: opinion.candidate.age,
            });
          }
        }

        setIdeas(transformedIdeas);
        setCandidates(Array.from(uniqueCandidates.values()));
      } catch (err) {
        console.error("AppContext - Error loading opinions:", err);
        console.error("AppContext - Error type:", typeof err);
        console.error(
          "AppContext - Error details:",
          err instanceof Error ? err.message : String(err)
        );
        console.error(
          "AppContext - Error stack:",
          err instanceof Error ? err.stack : "No stack"
        );
        setError("Error al cargar las opiniones. Por favor, intenta de nuevo.");
      } finally {
        setIsLoading(false);
        setIsLoadingOpinions(false);
      }
    },
    [isLoadingOpinions]
  );

  const resetApp = () => {
    setCurrentIdeaIndex(0);
    setAnswers([]);
    setHasShownImminentMatch(false);
    setIdeas([]);
    setCandidates([]);
  };

  const getCurrentIdea = () => {
    return ideas[currentIdeaIndex] || null;
  };

  const getProgress = () => {
    // Count only non-skipped answers for progress
    const nonSkippedAnswers = answers.filter((a) => a.answer !== "skip");
    return {
      current: nonSkippedAnswers.length,
      total: ideas.length,
    };
  };

  const shouldShowMatch = () => {
    // Count only non-skipped answers for match detection
    const nonSkippedAnswers = answers.filter((a) => a.answer !== "skip");
    // Show match after 8 swipes if not shown yet
    return nonSkippedAnswers.length >= 8 && !hasShownImminentMatch;
  };

  const markMatchShown = () => {
    setHasShownImminentMatch(true);
  };

  const answerIdea = useCallback(
    async (userId: string, answer: "agree" | "disagree") => {
      const currentIdea = ideas[currentIdeaIndex];
      console.log(
        "debug",
        "userId",
        userId,
        "currentIdea",
        currentIdea,
        "ideas"
      );

      if (!currentIdea || !userId) return;

      // Extract question_id from opinion_id (format: "q_123")
      const questionId = String(currentIdea.id);

      const newAnswer: UserAnswer = {
        opinionId: currentIdea.id,
        candidateId: currentIdea.candidateId,
        answer,
      };

      // Update state immediately for UI responsiveness
      setAnswers((prev) => [...prev, newAnswer]);
      setCurrentIdeaIndex((prev) => prev + 1);

      // Submit answer to Edge Function (which also saves to DB and updates scores)
      try {
        const response = await submitAnswerToEdgeFunction(
          userId,
          questionId,
          answer === "agree"
        );

        // Handle strong match flag from response
        if (response.has_strong_match) {
          // The shouldShowMatch logic will handle this
        }

        // Pre-fetch next question if we're running low on questions
        if (ideas.length - (currentIdeaIndex + 1) < 5) {
          // Pre-fetch more questions in the background
          const nextQuestion = await getNextQuestion(userId);
          if (nextQuestion) {
            // Extract opinion_id from question_id (can be number or string)
            let opinionId: number;
            if (typeof nextQuestion.question_id === "number") {
              opinionId = nextQuestion.question_id;
            } else if (typeof nextQuestion.question_id === "string") {
              const match = nextQuestion.question_id.match(/^q_(\d+)$/);
              opinionId = match
                ? parseInt(match[1], 10)
                : parseInt(nextQuestion.question_id, 10);
            } else {
              console.warn(
                "Unexpected question_id type in prefetch:",
                nextQuestion.question_id
              );
              return;
            }

            if (!isNaN(opinionId)) {
              const opinion = await getOpinionFromQuestionId(opinionId);
              if (opinion) {
                const newIdea: Idea = {
                  id: opinionId,
                  candidateId: opinion.candidate_id,
                  text: nextQuestion.statement,
                  topicId: opinion.topic_id,
                  topicName: opinion.topic.name,
                  emoji: opinion.topic.emoji,
                };
                setIdeas((prev) => [...prev, newIdea]);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error submitting answer:", err);
        // Fallback to old save method if Edge Function fails
        try {
          await saveAnswer(userId, currentIdea.id, answer === "agree");
        } catch (fallbackErr) {
          console.error("Error in fallback save:", fallbackErr);
        }
      }
    },
    [ideas, currentIdeaIndex]
  );

  const skipIdea = useCallback(
    async (userId: string) => {
      const currentIdea = ideas[currentIdeaIndex];

      if (!currentIdea || !userId) return;

      const newAnswer: UserAnswer = {
        opinionId: currentIdea.id,
        candidateId: currentIdea.candidateId,
        answer: "skip",
      };

      // Update state immediately for UI responsiveness
      // Do NOT call submitAnswerToEdgeFunction - skip should not be saved to DB
      setAnswers((prev) => [...prev, newAnswer]);
      setCurrentIdeaIndex((prev) => prev + 1);

      // Pre-fetch next question if we're running low on questions
      try {
        if (ideas.length - (currentIdeaIndex + 1) < 5) {
          // Pre-fetch more questions in the background
          const nextQuestion = await getNextQuestion(userId);
          if (nextQuestion) {
            // Extract opinion_id from question_id (can be number or string)
            let opinionId: number;
            if (typeof nextQuestion.question_id === "number") {
              opinionId = nextQuestion.question_id;
            } else if (typeof nextQuestion.question_id === "string") {
              const match = nextQuestion.question_id.match(/^q_(\d+)$/);
              opinionId = match
                ? parseInt(match[1], 10)
                : parseInt(nextQuestion.question_id, 10);
            } else {
              console.warn(
                "Unexpected question_id type in prefetch:",
                nextQuestion.question_id
              );
              return;
            }

            if (!isNaN(opinionId)) {
              const opinion = await getOpinionFromQuestionId(opinionId);
              if (opinion) {
                const newIdea: Idea = {
                  id: opinionId,
                  candidateId: opinion.candidate_id,
                  text: nextQuestion.statement,
                  topicId: opinion.topic_id,
                  topicName: opinion.topic.name,
                  emoji: opinion.topic.emoji,
                };
                setIdeas((prev) => [...prev, newIdea]);
              }
            }
          }
        }
      } catch (err) {
        console.error("Error pre-fetching next question after skip:", err);
        // Non-critical error, continue
      }
    },
    [ideas, currentIdeaIndex]
  );

  const loadMatches = useCallback(async (userId: string) => {
    try {
      const matches = await getMatches(userId);
      return matches;
    } catch (err) {
      console.error("Error loading matches:", err);
      throw err;
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        currentIdeaIndex,
        answers,
        ideas,
        candidates,
        hasShownImminentMatch,
        topics,
        isLoading,
        error,
        setTopics,
        resetApp,
        getCurrentIdea,
        getProgress,
        shouldShowMatch,
        markMatchShown,
        loadOpinions,
        answerIdea,
        skipIdea,
        loadMatches,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useAppContext must be used within AppProvider");
  }
  return context;
};
