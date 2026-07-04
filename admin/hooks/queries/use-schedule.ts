'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, patch, post } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { ScheduleEntry, ScheduleEntryInput } from '@/lib/types';

/** GET /admin/schedule?programme=&day=&semester= */
export function useSchedule(filters: { programme?: string; semester?: string } = {}) {
  return useQuery({
    queryKey: ['schedule', filters],
    queryFn: () => get<ScheduleEntry[]>('/admin/schedule', { ...filters }),
  });
}

export function useCreateScheduleEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: ScheduleEntryInput) => post<ScheduleEntry>('/admin/schedule', data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      if (data.warning) toast(data.warning, 'x');
      else toast('Séance créée', 'check');
    },
  });
}

export function useUpdateScheduleEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ScheduleEntryInput> }) =>
      patch<ScheduleEntry>(`/admin/schedule/${id}`, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      if (data.warning) toast(data.warning, 'x');
      else toast('Modifications enregistrées', 'check');
    },
  });
}

export function useDeleteScheduleEntry() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => del<{ id: string; deleted: boolean }>(`/admin/schedule/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
      toast('Séance supprimée', 'check');
    },
  });
}
