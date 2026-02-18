import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';
import rateLimit from '@fastify/rate-limit';
import { config } from './config.js';
import { voiceRoutes } from './routes/voice.routes.js';
import { configRoutes } from './routes/config.routes.js';
import { documentRoutes } from './routes/documents.routes.js';
import { closeRedis } from './services/config.service.js';

const app = Fastify({
    logger: {
        level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    },
});

// --- Plugins ---
await app.register(cors, {
    origin: [config.CLIENT_URL, 'http://localhost:5173'],
    credentials: true,
});

await app.register(multipart, {
    limits: {
        fileSize: 20 * 1024 * 1024, // 20MB max
    },
});

await app.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
});

// --- Routes ---
await app.register(voiceRoutes, { prefix: '/api' });
await app.register(configRoutes, { prefix: '/api' });
await app.register(documentRoutes, { prefix: '/api' });

// --- Health Check ---
app.get('/api/health', async () => {
    return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        services: {
            server: 'running',
            ragServer: config.RAG_SERVER_URL,
            livekit: config.LIVEKIT_URL,
        },
    };
});

// --- Graceful Shutdown ---
const shutdown = async (signal: string) => {
    app.log.info(`${signal} received — shutting down`);
    await app.close();
    await closeRedis();
    process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// --- Start ---
const start = async () => {
    try {
        await app.listen({ port: config.GATEWAY_PORT, host: '0.0.0.0' });
        app.log.info(`🚀 API Server running on http://localhost:${config.GATEWAY_PORT}`);
    } catch (err) {
        app.log.error(err);
        process.exit(1);
    }
};

start();
