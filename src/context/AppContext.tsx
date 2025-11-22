import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { UserAnswer, Idea, Candidate, getTopCandidate } from "@/data/mockData";
import {
  fetchOpinions,
  saveAnswer,
  getUserAnswers,
  getUserTopicIds,
  OpinionWithDetails,
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
  loadOpinions: (topicIds?: number[]) => Promise<void>;
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

  const loadOpinions = useCallback(async (topicIds?: number[]) => {
    console.log("AppContext - loadOpinions called with topicIds:", topicIds);
    setIsLoading(true);
    setError(null);

    // Reset state when loading new opinions
    setCurrentIdeaIndex(0);
    setAnswers([]);
    setHasShownImminentMatch(false);

    try {
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

      console.log("AppContext - Transformed ideas:", transformedIdeas.length);
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
    } catch (err) {
      console.error("Error loading opinions:", err);
      setError("Error al cargar las opiniones. Por favor, intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const answerIdea = async (answer: "agree" | "disagree") => {
    const currentIdea = ideas[currentIdeaIndex];
    if (!currentIdea || !userId) return;

    const newAnswer: UserAnswer = {
      opinionId: currentIdea.id,
      candidateId: currentIdea.candidateId,
      answer,
    };

    // Save to state immediately for UI responsiveness
    setAnswers((prev) => [...prev, newAnswer]);
    setCurrentIdeaIndex((prev) => prev + 1);

    // Save to database
    try {
      await saveAnswer(userId, currentIdea.id, answer === "agree");
    } catch (err) {
      console.error("Error saving answer:", err);
      // Optionally: show error to user or rollback the answer
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
