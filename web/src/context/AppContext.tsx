import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { UserAnswer, Idea, Candidate, getTopCandidate } from "@/data/mockData";
import {
  fetchOpinions,
  saveAnswer,
  getUserAnswers,
  getUserTopicIds,
  OpinionWithDetails,
  getNextQuestion,
  getOpinionFromQuestionId,
  QuestionResponse,
  submitAnswer,
} from "@/services/opinionsService";
import { supabase } from "@/integrations/supabase/client";

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
  userId: string | null;
  setTopics: (topics: Topic[]) => void;
  answerIdea: (answer: "agree" | "disagree") => Promise<void>;
  resetApp: () => void;
  getCurrentIdea: () => Idea | null;
  getProgress: () => { current: number; total: number };
  shouldShowMatch: () => boolean;
  markMatchShown: () => void;
  loadOpinions: (topicIds?: number[], userId?: string) => Promise<void>;
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
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoadingOpinions, setIsLoadingOpinions] = useState(false);

  // Get current user on mount
  useEffect(() => {
    const initUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        // Load previous answers if any
        try {
          const previousAnswers = await getUserAnswers(user.id);
          const formattedAnswers: UserAnswer[] = previousAnswers.map((a) => ({
            opinionId: a.opinion_id,
            candidateId: a.opinion_id, // Will be updated when we load opinions
            answer: a.choice ? "agree" : "disagree",
          }));
          setAnswers(formattedAnswers);
        } catch (err) {
          console.error("Error loading previous answers:", err);
        }
      }
    };
    initUser();
  }, []);

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
        // If userId is provided, use Edge Function to fetch questions
        if (userId) {
          // Pre-fetch 15 questions for smooth swiping
          const preFetchCount = 15;
          const questions: Array<{
            question: QuestionResponse;
            opinion: OpinionWithDetails | null;
          }> = [];

          console.log(
            `AppContext - Pre-fetching ${preFetchCount} questions...`
          );
          for (let i = 0; i < preFetchCount; i++) {
            const question = await getNextQuestion(userId);
            if (!question) {
              console.log(`AppContext - No more questions at index ${i}`);
              // No more questions available
              break;
            }

            // Get opinion details to get candidate and topic info
            const opinion = await getOpinionFromQuestionId(
              question.question_id
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
            if (!opinion) {
              console.warn(
                "Could not fetch opinion details for question:",
                question.question_id
              );
              continue;
            }

            // Extract opinion_id from question_id (format: "q_123")
            const opinionIdMatch = question.question_id.match(/^q_(\d+)$/);
            if (!opinionIdMatch) {
              console.warn("Invalid question_id format:", question.question_id);
              continue;
            }

            const opinionId = parseInt(opinionIdMatch[1], 10);

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
        } else {
          // Fall back to old method when no userId provided
          const opinionsData = await fetchOpinions(topicIds);
          console.log("AppContext - Fetched opinions:", opinionsData.length);

          // Transform OpinionWithDetails to Idea format
          const transformedIdeas: Idea[] = opinionsData.map((opinion) => ({
            id: opinion.id,
            candidateId: opinion.candidate_id,
            text: opinion.text,
            topicId: opinion.topic_id,
            topicName: opinion.topic.name,
            emoji: opinion.topic.emoji,
          }));

          console.log(
            "AppContext - Transformed ideas:",
            transformedIdeas.length
          );
          setIdeas(transformedIdeas);

          // Extract unique candidates
          const uniqueCandidates = new Map<number, Candidate>();
          opinionsData.forEach((opinion) => {
            if (!uniqueCandidates.has(opinion.candidate.id)) {
              uniqueCandidates.set(opinion.candidate.id, {
                id: opinion.candidate.id,
                name: opinion.candidate.name,
                partyName: opinion.candidate.political_party,
                shortLabel: opinion.candidate.name,
                avatarUrl: opinion.candidate.image,
                color: "hsl(270, 65%, 55%)", // Default color
                age: opinion.candidate.age,
              });
            }
          });

          setCandidates(Array.from(uniqueCandidates.values()));
        }
      } catch (err) {
        console.error("Error loading opinions:", err);
        setError("Error al cargar las opiniones. Por favor, intenta de nuevo.");
      } finally {
        setIsLoading(false);
        setIsLoadingOpinions(false);
      }
    },
    [isLoadingOpinions]
  );

  const answerIdea = async (answer: "agree" | "disagree") => {
    const currentIdea = ideas[currentIdeaIndex];
    if (!currentIdea || !userId) {
      console.log("AppContext - answerIdea: missing currentIdea or userId");
      return;
    }

    const questionId = `q_${currentIdea.id}`;
    console.log(`AppContext - answerIdea: ${questionId} → ${answer}`);

    const newAnswer: UserAnswer = {
      opinionId: currentIdea.id,
      candidateId: currentIdea.candidateId,
      answer,
    };

    // Save to state immediately for UI responsiveness
    setAnswers((prev) => [...prev, newAnswer]);
    setCurrentIdeaIndex((prev) => prev + 1);

    // Save to database using Edge Function
    try {
      console.log(`AppContext - Submitting answer to Edge Function...`);
      const response = await submitAnswer(
        userId,
        questionId,
        answer === "agree"
      );
      console.log(`AppContext - Answer submitted successfully:`, response);

      // Handle strong match flag from response if needed
      if (response.has_strong_match) {
        console.log(`AppContext - Strong match detected!`);
      }
    } catch (err) {
      console.error("AppContext - Error submitting answer:", err);
      // Fallback to old method if Edge Function fails
      try {
        console.log(`AppContext - Falling back to saveAnswer...`);
        await saveAnswer(userId, currentIdea.id, answer === "agree");
      } catch (fallbackErr) {
        console.error("AppContext - Error in fallback save:", fallbackErr);
      }
    }
  };

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
    return {
      current: answers.length,
      total: ideas.length,
    };
  };

  const shouldShowMatch = () => {
    // Show match after 8 swipes if not shown yet
    return answers.length >= 8 && !hasShownImminentMatch;
  };

  const markMatchShown = () => {
    setHasShownImminentMatch(true);
  };

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
        userId,
        setTopics,
        answerIdea,
        resetApp,
        getCurrentIdea,
        getProgress,
        shouldShowMatch,
        markMatchShown,
        loadOpinions,
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
