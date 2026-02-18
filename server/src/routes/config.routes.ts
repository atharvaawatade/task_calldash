import type { FastifyInstance } from 'fastify';
import { getSystemPrompt, setSystemPrompt, getDefaultPrompt } from '../services/config.service.js';

export async function configRoutes(app: FastifyInstance) {
    // GET /api/prompt — Get current system prompt
    app.get('/prompt', async (_request, reply) => {
        const prompt = await getSystemPrompt();
        return reply.send({ prompt, defaultPrompt: getDefaultPrompt() });
    });

    // PUT /api/prompt — Update system prompt
    app.put('/prompt', async (request, reply) => {
        const { prompt } = request.body as { prompt: string };

        if (!prompt || typeof prompt !== 'string') {
            return reply.status(400).send({ error: 'Prompt is required and must be a string' });
        }

        if (prompt.length > 5000) {
            return reply.status(400).send({ error: 'Prompt must be under 5000 characters' });
        }

        await setSystemPrompt(prompt);
        return reply.send({ prompt, message: 'Prompt updated successfully' });
    });
}
