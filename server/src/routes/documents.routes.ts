import type { FastifyInstance } from 'fastify';
import { proxyUploadToRAG, listDocuments, deleteDocument } from '../services/document.service.js';

const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/markdown',
];

export async function documentRoutes(app: FastifyInstance) {
    // POST /api/documents — Upload document
    app.post('/documents', async (request, reply) => {
        try {
            const data = await request.file();

            if (!data) {
                return reply.status(400).send({ error: 'No file uploaded' });
            }

            // Validate file type
            const isAllowed = ALLOWED_TYPES.includes(data.mimetype) ||
                data.filename.endsWith('.md') ||
                data.filename.endsWith('.txt');

            if (!isAllowed) {
                return reply.status(400).send({
                    error: 'Unsupported file type',
                    supportedFormats: ['PDF', 'DOCX', 'TXT', 'MD'],
                });
            }

            const buffer = await data.toBuffer();
            const result = await proxyUploadToRAG(buffer, data.filename, data.mimetype);

            return reply.status(201).send(result);
        } catch (error) {
            request.log.error(error, 'Document upload failed');
            return reply.status(500).send({
                error: 'Upload failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });

    // GET /api/documents — List documents
    app.get('/documents', async (_request, reply) => {
        try {
            const documents = await listDocuments();
            return reply.send({ documents });
        } catch (error) {
            return reply.status(503).send({
                error: 'RAG server unavailable',
                message: 'Could not fetch document list. Is the RAG server running?',
            });
        }
    });

    // DELETE /api/documents/:id — Delete document
    app.delete('/documents/:id', async (request, reply) => {
        const { id } = request.params as { id: string };

        try {
            await deleteDocument(id);
            return reply.status(204).send();
        } catch (error) {
            request.log.error(error, 'Document deletion failed');
            return reply.status(500).send({
                error: 'Deletion failed',
                message: error instanceof Error ? error.message : 'Unknown error',
            });
        }
    });
}
