'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { del, get, patch, post } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import type { AdminUser, CreateAdminInput, UpdateAdminInput } from '@/lib/types';

/** GET /admin/users (SUPER_ADMIN only). */
export function useAdmins() {
  return useQuery({
    queryKey: ['admins'],
    queryFn: () => get<AdminUser[]>('/admin/users'),
  });
}

export function useCreateAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (data: CreateAdminInput) => post<AdminUser>('/admin/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast('Administrateur créé', 'check');
    },
  });
}

export function useUpdateAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateAdminInput }) =>
      patch<AdminUser>(`/admin/users/${id}`, data),
    onSuccess: (_d, v) => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      if (v.data.isActive === true) toast('Compte réactivé', 'check');
      else if (v.data.isActive === false) toast('Compte désactivé', 'check');
      else toast('Modifications enregistrées', 'check');
    },
  });
}

/** DELETE /admin/users/:id — soft delete (isActive = false). */
export function useDeactivateAdmin() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) => del<AdminUser & { deactivated: boolean }>(`/admin/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admins'] });
      toast('Compte désactivé', 'check');
    },
  });
}
