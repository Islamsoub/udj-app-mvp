'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { get, patch, post } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { Faculty, Programme, Semester, Subject } from '@/lib/types';

// ─── Faculties ───────────────────────────────────────────────────────────────

/** GET /admin/faculties — drives the Context Bar faculty dropdown (Pass C-2). */
export function useFaculties() {
  return useQuery({
    queryKey: ['faculties'],
    queryFn: () => get<Faculty[]>('/admin/faculties'),
  });
}

export function useSaveFaculty() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<Faculty> }) =>
      id ? patch<Faculty>(`/admin/faculties/${id}`, data) : post<Faculty>('/admin/faculties', data),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['faculties'] });
      toast(v.id ? 'Modifications enregistrées' : 'Faculté créée', 'check');
    },
  });
}

// ─── Programmes ──────────────────────────────────────────────────────────────

/**
 * GET /admin/programmes[?faculty=] — drives the Context Bar programme dropdown
 * (Pass C-2). Each programme carries `_count.students`, used for the
 * "Vue filtrée · N étudiants" label.
 */
export function useProgrammes(facultyId?: string) {
  return useQuery({
    queryKey: ['programmes', facultyId ?? 'all'],
    queryFn: () => get<Programme[]>('/admin/programmes', facultyId ? { faculty: facultyId } : undefined),
  });
}

/** Resolve a single programme from the cached list (Context Bar helper). */
export function useProgramme(programmeId: string | null | undefined): Programme | undefined {
  const { data } = useProgrammes();
  if (!programmeId) return undefined;
  return data?.find((p) => p.id === programmeId);
}

export function useSaveProgramme() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<Programme> }) =>
      id ? patch<Programme>(`/admin/programmes/${id}`, data) : post<Programme>('/admin/programmes', data),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['programmes'] });
      toast(v.id ? 'Modifications enregistrées' : 'Programme créé', 'check');
    },
  });
}

// ─── Semesters ───────────────────────────────────────────────────────────────

export function useSemesters() {
  return useQuery({
    queryKey: ['semesters'],
    queryFn: () => get<Semester[]>('/admin/semesters'),
  });
}

/** The semester flagged isCurrent (or undefined while loading). */
export function useCurrentSemester(): Semester | undefined {
  const { data } = useSemesters();
  return data?.find((s) => s.isCurrent);
}

export function useSaveSemester() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<Semester> }) =>
      id ? patch<Semester>(`/admin/semesters/${id}`, data) : post<Semester>('/admin/semesters', data),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['semesters'] });
      toast(v.id ? 'Modifications enregistrées' : 'Semestre créé', 'check');
    },
  });
}

// ─── Subjects ────────────────────────────────────────────────────────────────

export function useSubjects(filters: { programme?: string; semester?: string } = {}) {
  return useQuery({
    queryKey: ['subjects', filters],
    queryFn: () => get<Subject[]>('/admin/subjects', { ...filters }),
  });
}

export function useSaveSubject() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id?: string; data: Partial<Subject> }) =>
      id ? patch<Subject>(`/admin/subjects/${id}`, data) : post<Subject>('/admin/subjects', data),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['subjects'] });
      toast(v.id ? 'Modifications enregistrées' : 'Matière créée', 'check');
    },
  });
}
