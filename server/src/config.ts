import { z } from 'zod';
import dotenv from 'dotenv';
import { resolve } from 'path';

// Load .env from project root (one level up from server/)
dotenv.config({ path: resolve(import.meta.dirname, '../../.env') });

const envSchema = z.object({
    // LiveKit
    LIVEKIT_URL: z.string().url().default('ws://localhost:7880'),
    LIVEKIT_API_KEY: z.string().min(1),
    LIVEKIT_API_SECRET: z.string().min(1),

    // Services
    RAG_SERVER_URL: z.string().url().default('http://localhost:8001'),
    CLIENT_URL: z.string().url().default('http://localhost:5173'),
    GATEWAY_PORT: z.coerce.number().default(3000),

    // Redis
    REDIS_URL: z.string().default('redis://localhost:6379'),

    // Environment
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type EnvConfig = z.infer<typeof envSchema>;

function loadConfig(): EnvConfig {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('❌ Invalid environment variables:');
        console.error(result.error.format());
        process.exit(1);
    }
    return result.data;
}

export const config = loadConfig();
