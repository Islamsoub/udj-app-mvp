'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, patch, post } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { CreateNewsInput, NewsArticle } from '@/lib/types';

/** GET /admin/news — published + drafts. */
export function useNews() {
  return useQuery({
    queryKey: ['news'],
    queryFn: () => get<NewsArticle[]>('/admin/news'),
  });
}

/** GET /admin/news/:id */
export function useNewsArticle(id: string | undefined) {
  return useQuery({
    queryKey: ['news', id],
    queryFn: () => get<NewsArticle>(`/admin/news/${id}`),
    enabled: !!id,
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateNewsInput) => post<NewsArticle>('/admin/news', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateNewsInput> }) =>
      patch<NewsArticle>(`/admin/news/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast('Modifications enregistrées', 'check');
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => del<{ id: string; deleted: boolean }>(`/admin/news/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      toast('Article supprimé', 'check');
    },
  });
}
