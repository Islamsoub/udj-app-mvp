'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, post } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type {
  AttendanceOverview,
  AttendanceRecordRow,
  JustificationDecisionInput,
  RecordSessionInput,
} from '@/lib/types';

/** GET /admin/attendance — records + pending count + status counts. */
export function useAttendance(filters: { subject?: string; student?: string; status?: string } = {}) {
  return useQuery({
    queryKey: ['attendance', filters],
    queryFn: () => get<AttendanceOverview>('/admin/attendance', { ...filters }),
  });
}

/** GET /admin/attendance/pending-justifications */
export function usePendingJustifications() {
  return useQuery({
    queryKey: ['attendance', 'pending-justifications'],
    queryFn: () => get<AttendanceRecordRow[]>('/admin/attendance/pending-justifications'),
  });
}

/** POST /admin/attendance/record — save a session roster. */
export function useRecordSession() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: RecordSessionInput) =>
      post<{ subjectId: string; sessionDate: string; saved: number }>('/admin/attendance/record', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Appel enregistré', 'check');
    },
  });
}

/** PATCH /admin/attendance/:id/justification — approve/reject. */
export function useDecideJustification() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, decision, note }: JustificationDecisionInput) =>
      patch<{ id: string; justificationStatus: string; status: string; message: string }>(
        `/admin/attendance/${id}/justification`,
        { decision, note }
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast(
        variables.decision === 'approve' ? 'Justificatif validé' : 'Justificatif rejeté',
        variables.decision === 'approve' ? 'check' : 'x'
      );
    },
  });
}
