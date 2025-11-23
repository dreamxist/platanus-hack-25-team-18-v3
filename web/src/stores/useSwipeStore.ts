import { create } from 'zustand';
import { UserAnswer, Idea, Candidate } from '@/data/mockData';
import {
  saveAnswer,
  getUserAnswers,
  OpinionWithDetails,
  getNextQuestion,
  submitAnswer as submitAnswerToEdgeFunction,
  getMatches,
  getOpinionFromQuestionId,
  QuestionResponse
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
  loadOpinions: (topicIds?: number[], userId?: string) => Promise<void>;
  answerIdea: (userId: string, answer: 'agree' | 'disagree') => Promise<void>;
  loadPreviousAnswers: (userId: string) => Promise<void>;
  loadMatches: (userId: string) => Promise<any>;
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

  // Load opinions - now uses Edge Function to fetch questions
  loadOpinions: async (topicIds?: number[], userId?: string) => {
    set({
      isLoading: true,
      error: null,
      currentIdeaIndex: 0,
      answers: [],
      hasShownImminentMatch: false
    });

    try {
      // Use Edge Function to fetch questions (pre-fetch 3 questions for smooth swiping)
      const preFetchCount = 3;
      const questions: Array<{ question: QuestionResponse; opinion: OpinionWithDetails | null }> = [];

      for (let i = 0; i < preFetchCount; i++) {
        const question = await getNextQuestion(userId);
        if (!question) {
          // No more questions available
          break;
        }

        // Get opinion details to get candidate and topic info
        const opinion = await getOpinionFromQuestionId(question.question_id);
        questions.push({ question, opinion });
      }

      if (questions.length === 0) {
        set({ error: 'No hay más preguntas disponibles para los temas seleccionados.' });
        set({ isLoading: false });
        return;
      }

      // Transform questions to Ideas
      const transformedIdeas: Idea[] = [];
      const uniqueCandidates = new Map<number, Candidate>();

      for (const { question, opinion } of questions) {
        if (!opinion) {
          console.warn('Could not fetch opinion details for question:', question.question_id);
          continue;
        }

        // Extract opinion_id from question_id (format: "q_123")
        const opinionIdMatch = question.question_id.match(/^q_(\d+)$/);
        if (!opinionIdMatch) {
          console.warn('Invalid question_id format:', question.question_id);
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
            color: 'hsl(270, 65%, 55%)',
            age: opinion.candidate.age,
          });
        }
      }

      set({ ideas: transformedIdeas });
      set({ candidates: Array.from(uniqueCandidates.values()) });
    } catch (err) {
      console.error('Error loading opinions:', err);
      set({ error: 'Error al cargar las opiniones. Por favor, intenta de nuevo.' });
    } finally {
      set({ isLoading: false });
    }
  },

  // Answer idea - now uses Edge Function
  answerIdea: async (userId: string, answer: 'agree' | 'disagree') => {
    const { ideas, currentIdeaIndex, answers } = get();
    const currentIdea = ideas[currentIdeaIndex];

    if (!currentIdea || !userId) return;

    // Extract question_id from opinion_id (format: "q_123")
    const questionId = `q_${currentIdea.id}`;

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

    // Submit answer to Edge Function (which also saves to DB and updates scores)
    try {
      const response = await submitAnswerToEdgeFunction(
        userId,
        questionId,
        answer === 'agree'
      );

      // Handle strong match flag from response
      if (response.has_strong_match) {
        // The shouldShowMatch logic will handle this
      }

      // Pre-fetch next question if we're running low on questions
      const { ideas: currentIdeas } = get();
      if (currentIdeas.length - (currentIdeaIndex + 1) < 5) {
        // Pre-fetch more questions in the background
        const nextQuestion = await getNextQuestion(userId);
        if (nextQuestion) {
          const opinion = await getOpinionFromQuestionId(nextQuestion.question_id);
          if (opinion) {
            const opinionIdMatch = nextQuestion.question_id.match(/^q_(\d+)$/);
            if (opinionIdMatch) {
              const opinionId = parseInt(opinionIdMatch[1], 10);
              const newIdea: Idea = {
                id: opinionId,
                candidateId: opinion.candidate_id,
                text: nextQuestion.statement,
                topicId: opinion.topic_id,
                topicName: opinion.topic.name,
                emoji: opinion.topic.emoji,
              };
              set({ ideas: [...currentIdeas, newIdea] });
            }
          }
        }
      }
    } catch (err) {
      console.error('Error submitting answer:', err);
      // Fallback to old save method if Edge Function fails
      try {
        await saveAnswer(userId, currentIdea.id, answer === 'agree');
      } catch (fallbackErr) {
        console.error('Error in fallback save:', fallbackErr);
      }
    }
  },

  // Load matches from Edge Function
  loadMatches: async (userId: string) => {
    try {
      const matches = await getMatches(userId);
      return matches;
    } catch (err) {
      console.error('Error loading matches:', err);
      throw err;
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
    // Updated to match Edge Function's 10-answer threshold
    return !hasShownImminentMatch;
  },

  markMatchShown: () => set({ hasShownImminentMatch: true }),
}));
