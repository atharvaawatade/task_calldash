import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/api/httpClient';

interface PromptResponse {
    prompt: string;
    defaultPrompt: string;
}

export function usePrompt() {
    const queryClient = useQueryClient();

    const query = useQuery({
        queryKey: ['prompt'],
        queryFn: () => api.get<PromptResponse>('/prompt'),
    });

    const mutation = useMutation({
        mutationFn: (prompt: string) =>
            api.put<{ prompt: string; message: string }>('/prompt', { prompt }),
        onSuccess: (data) => {
            queryClient.setQueryData(['prompt'], {
                prompt: data.prompt,
                defaultPrompt: query.data?.defaultPrompt || '',
            });
        },
    });

    return {
        prompt: query.data?.prompt || '',
        defaultPrompt: query.data?.defaultPrompt || '',
        isLoading: query.isLoading,
        isError: query.isError,
        savePrompt: mutation.mutate,
        isSaving: mutation.isPending,
        saveError: mutation.error,
    };
}
