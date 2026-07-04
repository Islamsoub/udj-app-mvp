'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, post } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { fmtNumber } from '@/lib/utils';
import type {
  BulkGradeInput,
  BulkGradeResult,
  GradeRow,
  PublishGradesResult,
} from '@/lib/types';

export interface GradeFilters {
  subject?: string;
  semester?: string;
  student?: string;
}

/** GET /admin/grades?subject=&semester=&student= */
export function useGrades(filters: GradeFilters = {}) {
  return useQuery({
    queryKey: ['grades', filters],
    queryFn: () => get<GradeRow[]>('/admin/grades', { ...filters }),
  });
}

/** PATCH /admin/grades/:id — server recomputes NF from settings. */
export function useUpdateGrade() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, noteCc, noteCf }: { id: string; noteCc?: number | null; noteCf?: number | null }) =>
      patch<GradeRow>(`/admin/grades/${id}`, { noteCc, noteCf }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
    },
  });
}

/** POST /admin/grades/bulk — upsert rows (used by save bar + CSV import). */
export function useBulkGrades() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: BulkGradeInput) => post<BulkGradeResult>('/admin/grades/bulk', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });
}

/** POST /admin/grades/publish — publishes + notifies students. */
export function usePublishGrades() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: { subjectId: string; semesterId?: string }) =>
      post<PublishGradesResult>('/admin/grades/publish', input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      toast(`Notes publiées · ${fmtNumber(data.notified)} étudiants notifiés`, 'send');
    },
  });
}
