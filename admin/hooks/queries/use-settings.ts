'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { SystemSettings } from '@/lib/types';

/** GET /admin/settings — singleton row. */
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => get<SystemSettings>('/admin/settings'),
  });
}

/** PATCH /admin/settings/grade-formula — weights must sum to 1.0. */
export function useUpdateGradeFormula() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: { gradeWeightCc: number; gradeWeightCf: number }) =>
      patch<SystemSettings>('/admin/settings/grade-formula', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast('Formule de calcul mise à jour', 'check');
    },
  });
}

/** PATCH /admin/settings/attendance-threshold (50–100). */
export function useUpdateAttendanceThreshold() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (attendanceThreshold: number) =>
      patch<SystemSettings>('/admin/settings/attendance-threshold', { attendanceThreshold }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast('Seuil de présence mis à jour', 'check');
    },
  });
}

/** PATCH /admin/settings/automations. */
export function useUpdateAutomations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: { autoPublishGrades?: boolean; notifyOnPublish?: boolean; weeklyRecap?: boolean }) =>
      patch<SystemSettings>('/admin/settings/automations', input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      toast('Automatisations mises à jour', 'check');
    },
  });
}
