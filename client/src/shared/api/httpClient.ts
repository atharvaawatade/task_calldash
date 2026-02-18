const API_BASE = '/api';

interface FetchOptions extends RequestInit {
    json?: unknown;
}

class HttpClient {
    private baseUrl: string;

    constructor(baseUrl: string) {
        this.baseUrl = baseUrl;
    }

    private async request<T>(path: string, options: FetchOptions = {}): Promise<T> {
        const { json, ...fetchOptions } = options;

        const headers: Record<string, string> = {
            ...((fetchOptions.headers as Record<string, string>) || {}),
        };

        if (json) {
            headers['Content-Type'] = 'application/json';
            fetchOptions.body = JSON.stringify(json);
        }

        const response = await fetch(`${this.baseUrl}${path}`, {
            ...fetchOptions,
            headers,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || error.error || `HTTP ${response.status}`);
        }

        if (response.status === 204) return undefined as T;
        return response.json();
    }

    get<T>(path: string) {
        return this.request<T>(path);
    }

    post<T>(path: string, data?: unknown) {
        return this.request<T>(path, { method: 'POST', json: data });
    }

    put<T>(path: string, data?: unknown) {
        return this.request<T>(path, { method: 'PUT', json: data });
    }

    delete<T>(path: string) {
        return this.request<T>(path, { method: 'DELETE' });
    }

    async upload<T>(path: string, file: File): Promise<T> {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch(`${this.baseUrl}${path}`, {
            method: 'POST',
            body: formData,
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ message: response.statusText }));
            throw new Error(error.message || error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }
}

export const api = new HttpClient(API_BASE);
