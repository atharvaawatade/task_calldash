import type { FastifyInstance } from 'fastify';
import { generateLiveKitToken } from '../services/livekit.service.js';

export async function voiceRoutes(app: FastifyInstance) {
    // POST /api/token — Generate LiveKit room token
    app.post('/token', async (request, reply) => {
        const { roomName, participantName } = (request.body as Record<string, string>) || {};

        try {
            const result = await generateLiveKitToken(
                roomName || 'voice-ai-room',
                participantName || `user-${Date.now()}`
            );

            return reply.status(200).send(result);
        } catch (error) {
            request.log.error(error, 'Failed to generate LiveKit token');
            return reply.status(500).send({
                error: 'Failed to generate token',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });
}
