import { config } from '../config.js';

export interface DocumentInfo {
    id: string;
    filename: string;
    status: 'processing' | 'ready' | 'failed';
    chunks: number;
    createdAt: string;
}

export async function proxyUploadToRAG(
    fileBuffer: Buffer,
    filename: string,
    mimetype: string
): Promise<DocumentInfo> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(fileBuffer)], { type: mimetype });
    formData.append('file', blob, filename);

    const response = await fetch(`${config.RAG_SERVER_URL}/ingest`, {
        method: 'POST',
        body: formData,
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`RAG server error: ${response.status} - ${error}`);
    }

    return response.json() as Promise<DocumentInfo>;
}

export async function listDocuments(): Promise<DocumentInfo[]> {
    const response = await fetch(`${config.RAG_SERVER_URL}/documents`);

    if (!response.ok) {
        throw new Error(`RAG server error: ${response.status}`);
    }

    return response.json() as Promise<DocumentInfo[]>;
}

export async function deleteDocument(id: string): Promise<void> {
    const response = await fetch(`${config.RAG_SERVER_URL}/documents/${id}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error(`RAG server error: ${response.status}`);
    }
}
