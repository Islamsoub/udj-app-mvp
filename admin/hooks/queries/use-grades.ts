'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, post } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { fmtNumber } from '@/lib/utils';
import type {
  BulkGradeInput,
  BulkGradeResult,
  GradeChangeInput,
  GradeChangeResult,
  GradeRow,
  PublishGradesInput,
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

/**
 * POST /admin/grades/publish — two-phase publication (Pass C-2, AD §3.3).
 * `type: 'cc'` publishes contrôle-continu scores; `type: 'nf'` publishes final
 * results. Target a single `subjectId` or every subject in a `programmeId`.
 * The backend notifies every affected student.
 */
export function usePublishGrades() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: PublishGradesInput) =>
      post<PublishGradesResult>('/admin/grades/publish', input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      const label =
        data.type === 'cc' ? 'Notes CC publiées' : 'Résultats finaux publiés';
      toast(`${label} · ${fmtNumber(data.notified)} étudiants notifiés`, 'send');
    },
  });
}

/**
 * POST /admin/grades/:id/change — post-publication correction (Pass C-2,
 * AD §3.4). Records the mandatory reason + old/new value in the audit log.
 * SUPER_ADMIN / REGISTRAR only (enforced by the backend rbac guard).
 */
export function useCorrectGrade() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, ...body }: GradeChangeInput & { id: string }) =>
      post<GradeChangeResult>(`/admin/grades/${id}/change`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['grades'] });
      queryClient.invalidateQueries({ queryKey: ['students'] });
      queryClient.invalidateQueries({ queryKey: ['audit'] });
      toast('Correction consignée au journal d’audit', 'check');
    },
  });
}
