import { create } from 'zustand';

export interface TranscriptMessage {
    id: string;
    sender: 'user' | 'agent';
    text: string;
    timestamp: number;
    isFinal: boolean;
}

export interface RAGSource {
    filename: string;
    text: string;
    score: number;
}

interface TranscriptStore {
    messages: TranscriptMessage[];
    ragSources: RAGSource[];
    currentQuery: string;

    addMessage: (msg: TranscriptMessage) => void;
    updateMessage: (id: string, text: string, isFinal: boolean) => void;
    setRagSources: (sources: RAGSource[], query: string) => void;
    clear: () => void;
}

export const useTranscriptStore = create<TranscriptStore>((set) => ({
    messages: [],
    ragSources: [],
    currentQuery: '',

    addMessage: (msg) =>
        set((state) => ({ messages: [...state.messages, msg] })),

    updateMessage: (id, text, isFinal) =>
        set((state) => ({
            messages: state.messages.map((m) =>
                m.id === id ? { ...m, text, isFinal } : m
            ),
        })),

    setRagSources: (sources, query) =>
        set({ ragSources: sources, currentQuery: query }),

    clear: () => set({ messages: [], ragSources: [], currentQuery: '' }),
}));
