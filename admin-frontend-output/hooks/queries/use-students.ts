'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, post } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type {
  CreateStudentInput,
  ImportResult,
  Paginated,
  ResetPasswordResponse,
  StudentDetail,
  StudentFilters,
  StudentImportRow,
  StudentRow,
  StudentStatus,
  UpdateStudentInput,
} from '@/lib/types';

/** GET /admin/students — paginated + filters. */
export function useStudents(filters: StudentFilters = {}) {
  return useQuery({
    queryKey: ['students', filters],
    queryFn: () => get<Paginated<StudentRow>>('/admin/students', { ...filters }),
  });
}

/** GET /admin/students/:id — full detail. */
export function useStudent(id: string | undefined) {
  return useQuery({
    queryKey: ['students', 'detail', id],
    queryFn: () => get<StudentDetail>(`/admin/students/${id}`),
    enabled: !!id,
  });
}

export function useCreateStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: CreateStudentInput) => post<StudentRow>('/admin/students', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast('Étudiant créé avec succès', 'check');
    },
  });
}

export function useUpdateStudent() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateStudentInput }) =>
      patch<StudentRow>(`/admin/students/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast('Modifications enregistrées', 'check');
    },
  });
}

/** POST /admin/students/:id/reset-password — returns the temp password once. */
export function useResetStudentPassword() {
  return useMutation({
    mutationFn: (id: string) => post<ResetPasswordResponse>(`/admin/students/${id}/reset-password`),
  });
}

/** PATCH /admin/students/:id/status — suspend / graduate / reactivate. */
export function useUpdateStudentStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, reason }: { id: string; status: StudentStatus; reason?: string }) =>
      patch<{ id: string; status: StudentStatus; reason: string | null }>(
        `/admin/students/${id}/status`,
        { status, reason }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}

/** POST /admin/students/import — bulk create from client-parsed CSV rows. */
export function useImportStudents() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rows: StudentImportRow[]) =>
      post<ImportResult>('/admin/students/import', { rows, skipInvalid: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
  });
}
