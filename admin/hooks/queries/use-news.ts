'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, patch, post } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type {
  CreateCategoryInput,
  CreateNewsInput,
  NewsArticle,
  NewsCategory,
  NewsMutationResult,
  ReorderCategoryInput,
} from '@/lib/types';

/** GET /admin/news — published + drafts (includes the category relation). */
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
    mutationFn: (data: CreateNewsInput) => post<NewsMutationResult>('/admin/news', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateNewsInput> }) =>
      patch<NewsMutationResult>(`/admin/news/${id}`, data),
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

// ─── News categories (Pass C-2, AD §7.2) ─────────────────────────────────────

/** GET /admin/news/categories — admin-managed, ordered by displayOrder. */
export function useNewsCategories() {
  return useQuery({
    queryKey: ['news-categories'],
    queryFn: () => get<NewsCategory[]>('/admin/news/categories'),
  });
}

/** POST /admin/news/categories — slug is auto-generated from nameFr server-side. */
export function useCreateCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: CreateCategoryInput) =>
      post<NewsCategory>('/admin/news/categories', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-categories'] });
      toast('Catégorie créée', 'check');
    },
  });
}

/** DELETE /admin/news/categories/:id — 409 while any article references it. */
export function useDeleteCategory() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) =>
      del<{ id: string; deleted: boolean }>(`/admin/news/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news-categories'] });
      toast('Catégorie supprimée', 'check');
    },
  });
}

/** PATCH /admin/news/categories/reorder — drag-and-drop display order. */
export function useReorderCategories() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (items: ReorderCategoryInput[]) =>
      patch<NewsCategory[]>('/admin/news/categories/reorder', { items }),
    onSuccess: (data) => {
      // Seed the cache with the server's canonical order immediately.
      queryClient.setQueryData(['news-categories'], data);
      queryClient.invalidateQueries({ queryKey: ['news-categories'] });
    },
  });
}
