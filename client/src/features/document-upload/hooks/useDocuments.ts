import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/httpClient';

interface DocumentInfo {
    id: string;
    filename: string;
    status: 'processing' | 'ready' | 'failed';
    chunks: number;
    created_at: string;
}

export function useDocuments() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['documents'],
        queryFn: async () => {
            const data = await api.get<{ documents: DocumentInfo[] }>('/documents');
            return data.documents;
        },
    });

    const uploadMutation = useMutation({
        mutationFn: (file: File) => api.upload<DocumentInfo>('/documents', file),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });

    const deleteMutation = useMutation({
        mutationFn: (id: string) => api.delete(`/documents/${id}`),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['documents'] });
        },
    });

    return {
        documents: query.data || [],
        isLoading: query.isLoading,
        isError: query.isError,
        uploadDocument: uploadMutation.mutate,
        isUploading: uploadMutation.isPending,
        uploadError: uploadMutation.error,
        deleteDocument: deleteMutation.mutate,
        isDeleting: deleteMutation.isPending,
    };
}
