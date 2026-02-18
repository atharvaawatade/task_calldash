import Redis from 'ioredis';
import { config } from '../config.js';

const PROMPT_KEY = 'voice-ai:system-prompt';
const DEFAULT_PROMPT = `You are a helpful AI assistant that answers questions using the context provided from uploaded documents.

When answering:
- Always reference specific information from the provided context
- If the context doesn't contain relevant information, say so honestly
- Be concise and conversational — you're speaking, not writing
- Keep responses under 3 sentences unless asked for more detail`;

let redis: Redis | null = null;

function getRedis(): Redis {
    if (!redis) {
        redis = new Redis(config.REDIS_URL, {
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 200, 2000),
        });
        redis.on('error', (err) => {
            console.error('Redis connection error:', err.message);
        });
    }
    return redis;
}

export async function closeRedis(): Promise<void> {
    if (redis) {
        await redis.quit();
        redis = null;
    }
}

export async function getSystemPrompt(): Promise<string> {
    try {
        const prompt = await getRedis().get(PROMPT_KEY);
        return prompt || DEFAULT_PROMPT;
    } catch {
        return DEFAULT_PROMPT;
    }
}

export async function setSystemPrompt(prompt: string): Promise<void> {
    await getRedis().set(PROMPT_KEY, prompt);
}

export function getDefaultPrompt(): string {
    return DEFAULT_PROMPT;
}
