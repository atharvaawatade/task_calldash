import { create } from 'zustand';

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'disconnected' | 'error';

interface CallStore {
    connectionState: ConnectionState;
    isMicEnabled: boolean;
    agentSpeaking: boolean;
    audioLevel: number;
    roomName: string;
    error: string | null;

    setConnectionState: (state: ConnectionState) => void;
    setMicEnabled: (enabled: boolean) => void;
    setAgentSpeaking: (speaking: boolean) => void;
    setAudioLevel: (level: number) => void;
    setRoomName: (name: string) => void;
    setError: (error: string | null) => void;
    reset: () => void;
}

export const useCallStore = create<CallStore>((set) => ({
    connectionState: 'idle',
    isMicEnabled: true,
    agentSpeaking: false,
    audioLevel: 0,
    roomName: 'voice-ai-room',
    error: null,

    setConnectionState: (state) => set({ connectionState: state, error: null }),
    setMicEnabled: (enabled) => set({ isMicEnabled: enabled }),
    setAgentSpeaking: (speaking) => set({ agentSpeaking: speaking }),
    setAudioLevel: (level) => set({ audioLevel: level }),
    setRoomName: (name) => set({ roomName: name }),
    setError: (error) => set({ error, connectionState: 'error' }),
    reset: () =>
        set({
            connectionState: 'idle',
            isMicEnabled: true,
            agentSpeaking: false,
            audioLevel: 0,
            error: null,
        }),
}));
