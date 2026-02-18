import { useCallback, useRef, useEffect } from 'react';
import {
    Room,
    RoomEvent,
    Track,
} from 'livekit-client';
import { useCallStore } from '../store/callStore';
import { useTranscriptStore } from '../../transcript/store/transcriptStore';
import { api } from '@/shared/api/httpClient';

export function useVoiceCall() {
    const roomRef = useRef<Room | null>(null);
    // Track all audio elements we append so we can remove them reliably on cleanup.
    const audioElementsRef = useRef<HTMLAudioElement[]>([]);

    const {
        connectionState,
        isMicEnabled,
        setConnectionState,
        setMicEnabled,
        setAgentSpeaking,
        setError,
        reset,
    } = useCallStore();

    const { addMessage, setRagSources } = useTranscriptStore();

    const cleanupAudioElements = useCallback(() => {
        audioElementsRef.current.forEach((el) => el.remove());
        audioElementsRef.current = [];
    }, []);

    const connectToRoom = useCallback(async () => {
        try {
            setConnectionState('connecting');

            // 1. Get token from server
            const { token, url } = await api.post<{
                token: string;
                roomName: string;
                url: string;
            }>('/token', { roomName: 'voice-ai-room' });

            // 2. Create & connect room
            const room = new Room({
                adaptiveStream: true,
                dynacast: true,
                audioCaptureDefaults: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            });

            roomRef.current = room;

            // 3. Set up event listeners
            room.on(RoomEvent.Connected, () => {
                setConnectionState('connected');
            });

            room.on(RoomEvent.Disconnected, () => {
                setConnectionState('disconnected');
                cleanupAudioElements();
                reset();
            });

            room.on(RoomEvent.TrackSubscribed, (track) => {
                if (track.kind === Track.Kind.Audio) {
                    const audioElement = track.attach() as HTMLAudioElement;
                    document.body.appendChild(audioElement);
                    audioElementsRef.current.push(audioElement);
                    setAgentSpeaking(true);
                }
            });

            room.on(RoomEvent.TrackUnsubscribed, (track) => {
                // Detach returns the elements that were attached to this track.
                track.detach().forEach((el) => {
                    el.remove();
                    audioElementsRef.current = audioElementsRef.current.filter((a) => a !== el);
                });
                if (audioElementsRef.current.length === 0) {
                    setAgentSpeaking(false);
                }
            });

            // Listen for data channel messages (transcript, RAG sources)
            room.on(RoomEvent.DataReceived, (data) => {
                try {
                    const message = JSON.parse(new TextDecoder().decode(data));

                    if (message.type === 'rag_sources') {
                        setRagSources(message.sources, message.query);
                    }

                    if (message.type === 'transcript') {
                        const msg = {
                            id: `${Date.now()}-${message.sender}`,
                            sender: message.sender as 'user' | 'agent',
                            text: message.text,
                            timestamp: Date.now(),
                            isFinal: message.is_final ?? true,
                        };
                        addMessage(msg);
                    }
                } catch {
                    // Ignore non-JSON messages
                }
            });

            // 4. Connect
            await room.connect(url, token);

            // 5. Enable microphone
            await room.localParticipant.setMicrophoneEnabled(true);
            setMicEnabled(true);

        } catch (error) {
            const message = error instanceof Error ? error.message : 'Connection failed';
            setError(message);
            console.error('Failed to connect:', error);
        }
    }, [cleanupAudioElements]);

    const disconnect = useCallback(() => {
        if (roomRef.current) {
            roomRef.current.disconnect();
            roomRef.current = null;
        }
        cleanupAudioElements();
        reset();
    }, [reset, cleanupAudioElements]);

    const toggleMic = useCallback(async () => {
        if (roomRef.current) {
            const newState = !isMicEnabled;
            await roomRef.current.localParticipant.setMicrophoneEnabled(newState);
            setMicEnabled(newState);
        }
    }, [isMicEnabled, setMicEnabled]);

    // Cleanup on unmount — disconnect room and remove any lingering audio elements.
    useEffect(() => {
        return () => {
            if (roomRef.current) {
                roomRef.current.disconnect();
                roomRef.current = null;
            }
            cleanupAudioElements();
        };
    }, [cleanupAudioElements]);

    return {
        connectionState,
        isMicEnabled,
        connectToRoom,
        disconnect,
        toggleMic,
    };
}
