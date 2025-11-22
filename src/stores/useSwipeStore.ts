import { create } from 'zustand';
import { UserAnswer, Idea, Candidate } from '@/data/mockData';
import {
  fetchOpinions,
  saveAnswer,
  getUserAnswers,
  OpinionWithDetails
} from '@/services/opinionsService';

interface SwipeState {
  // State
  currentIdeaIndex: number;
  answers: UserAnswer[];
  ideas: Idea[];
  candidates: Candidate[];
  hasShownImminentMatch: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentIdeaIndex: (index: number) => void;
  setAnswers: (answers: UserAnswer[]) => void;
  setIdeas: (ideas: Idea[]) => void;
  setCandidates: (candidates: Candidate[]) => void;
  setHasShownImminentMatch: (shown: boolean) => void;
  setIsLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Complex actions
  loadOpinions: (topicIds?: number[]) => Promise<void>;
  answerIdea: (userId: string, answer: 'agree' | 'disagree') => Promise<void>;
  loadPreviousAnswers: (userId: string) => Promise<void>;
  resetSwipe: () => void;

  // Computed
  getCurrentIdea: () => Idea | null;
  getProgress: () => { current: number; total: number };
  shouldShowMatch: () => boolean;
  markMatchShown: () => void;
}

export const useSwipeStore = create<SwipeState>((set, get) => ({
  // Initial state
  currentIdeaIndex: 0,
  answers: [],
  ideas: [],
  candidates: [],
  hasShownImminentMatch: false,
  isLoading: false,
  error: null,

  // Simple setters
  setCurrentIdeaIndex: (index) => set({ currentIdeaIndex: index }),
  setAnswers: (answers) => set({ answers }),
  setIdeas: (ideas) => set({ ideas }),
  setCandidates: (candidates) => set({ candidates }),
  setHasShownImminentMatch: (shown) => set({ hasShownImminentMatch: shown }),
  setIsLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),

  // Load previous answers
  loadPreviousAnswers: async (userId: string) => {
    try {
      const previousAnswers = await getUserAnswers(userId);
      const formattedAnswers: UserAnswer[] = previousAnswers.map((a) => ({
        opinionId: a.opinion_id,
        candidateId: a.opinion_id,
        answer: a.choice ? 'agree' : 'disagree',
      }));
      set({ answers: formattedAnswers });
    } catch (err) {
      console.error('Error loading previous answers:', err);
    }
  },

  // Load opinions
  loadOpinions: async (topicIds?: number[]) => {
    set({
      isLoading: true,
      error: null,
      currentIdeaIndex: 0,
      answers: [],
      hasShownImminentMatch: false
    });

    try {
      const opinionsData = await fetchOpinions(topicIds);

      // Transform OpinionWithDetails to Idea format
      const transformedIdeas: Idea[] = opinionsData.map((opinion) => ({
        id: opinion.id,
        candidateId: opinion.candidate_id,
        text: opinion.text,
        topicId: opinion.topic_id,
        topicName: opinion.topic.name,
        emoji: opinion.topic.emoji,
      }));

      set({ ideas: transformedIdeas });

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
            color: 'hsl(270, 65%, 55%)',
            age: opinion.candidate.age,
          });
        }
      });

      set({ candidates: Array.from(uniqueCandidates.values()) });
    } catch (err) {
      console.error('Error loading opinions:', err);
      set({ error: 'Error al cargar las opiniones. Por favor, intenta de nuevo.' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Answer idea
  answerIdea: async (userId: string, answer: 'agree' | 'disagree') => {
    const { ideas, currentIdeaIndex, answers } = get();
    const currentIdea = ideas[currentIdeaIndex];

    if (!currentIdea || !userId) return;

    const newAnswer: UserAnswer = {
      opinionId: currentIdea.id,
      candidateId: currentIdea.candidateId,
      answer,
    };

    // Update state immediately for UI responsiveness
    set({
      answers: [...answers, newAnswer],
      currentIdeaIndex: currentIdeaIndex + 1
    });

    // Save to database (fire and forget, handle errors silently)
    try {
      await saveAnswer(userId, currentIdea.id, answer === 'agree');
    } catch (err) {
      console.error('Error saving answer:', err);
    }
  },

  // Reset
  resetSwipe: () => set({
    currentIdeaIndex: 0,
    answers: [],
    hasShownImminentMatch: false,
    ideas: [],
    candidates: [],
  }),

  // Computed values
  getCurrentIdea: () => {
    const { ideas, currentIdeaIndex } = get();
    return ideas[currentIdeaIndex] || null;
  },

  getProgress: () => {
    const { answers, ideas } = get();
    return {
      current: answers.length,
      total: ideas.length,
    };
  },

  shouldShowMatch: () => {
    const { answers, hasShownImminentMatch } = get();
    return answers.length >= 8 && !hasShownImminentMatch;
  },

  markMatchShown: () => set({ hasShownImminentMatch: true }),
}));
