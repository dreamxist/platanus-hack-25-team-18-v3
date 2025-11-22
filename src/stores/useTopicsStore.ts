import { create } from 'zustand';

export interface Topic {
  id: number;
  name: string;
  emoji: string;
}

interface TopicsState {
  topics: Topic[];
  setTopics: (topics: Topic[]) => void;
  addTopic: (topic: Topic) => void;
  removeTopic: (id: number) => void;
}

export const useTopicsStore = create<TopicsState>((set) => ({
  topics: [],

  setTopics: (topics) => set({ topics }),

  addTopic: (topic) => set((state) => ({
    topics: [...state.topics, topic]
  })),

  removeTopic: (id) => set((state) => ({
    topics: state.topics.filter(t => t.id !== id)
  })),
}));
