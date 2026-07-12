'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, patch, post } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type {
  ScheduleConflictsResult,
  ScheduleEntry,
  ScheduleEntryInput,
  ScheduleFilters,
} from '@/lib/types';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * GET /admin/schedule — Pass C-2 adds cross-programme `room` / `professorName`
 * modes (AD §5.1). Faculty scope always applies server-side.
 */
export function useSchedule(filters: ScheduleFilters = {}) {
  return useQuery({
    queryKey: ['schedule', filters],
    queryFn: () => get<ScheduleEntry[]>('/admin/schedule', { ...filters }),
  });
}

/**
 * GET /admin/schedule/conflicts — real-time room-clash check for the
 * ScheduleForm soft warning (Pass C-2, AD §5.2). Only fires once the room,
 * weekday and a valid time window are all present.
 */
export function useScheduleConflicts(params: {
  room?: string;
  dayOfWeek?: number;
  startTime?: string;
  endTime?: string;
  excludeId?: string;
}) {
  const { room, dayOfWeek, startTime, endTime, excludeId } = params;
  const enabled =
    !!room &&
    dayOfWeek != null &&
    !!startTime &&
    !!endTime &&
    TIME_REGEX.test(startTime) &&
    TIME_REGEX.test(endTime) &&
    endTime > startTime;

  return useQuery({
    queryKey: ['schedule', 'conflicts', room, dayOfWeek, startTime, endTime, excludeId],
    queryFn: () =>
      get<ScheduleConflictsResult>('/admin/schedule/conflicts', {
        room,
        dayOfWeek,
        startTime,
        endTime,
        ...(excludeId ? { excludeId } : {}),
      }),
    enabled,
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
