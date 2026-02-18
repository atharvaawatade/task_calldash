import { AccessToken } from 'livekit-server-sdk';
import { config } from '../config.js';

export interface TokenRequest {
    roomName?: string;
    participantName?: string;
}

export async function generateLiveKitToken(
    roomName: string = 'voice-ai-room',
    participantName: string = `user-${Date.now()}`
): Promise<{ token: string; roomName: string; url: string }> {
    const token = new AccessToken(config.LIVEKIT_API_KEY, config.LIVEKIT_API_SECRET, {
        identity: participantName,
        name: participantName,
    });

    token.addGrant({
        room: roomName,
        roomJoin: true,
        canPublish: true,
        canSubscribe: true,
        canPublishData: true,
    });

    const jwt = await token.toJwt();

    return {
        token: jwt,
        roomName,
        url: config.LIVEKIT_URL,
    };
}
