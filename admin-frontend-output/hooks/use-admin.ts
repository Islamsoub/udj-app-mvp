'use client';

import { useAuthStore } from '@/stores/auth-store';
import { ROLE_META } from '@/lib/constants';
import type { AdminIdentity, AdminRole } from '@/lib/types';

export interface CurrentAdmin extends AdminIdentity {
  name: string;
  roleLabel: string;
}

/** Current admin derived from the auth store (populated at login). */
export function useAdmin(): CurrentAdmin | null {
  const admin = useAuthStore((s) => s.admin);
  if (!admin) return null;
  return {
    ...admin,
    name: `${admin.firstName} ${admin.lastName}`,
    roleLabel: ROLE_META[admin.role].label,
  };
}

export function useAdminRole(): AdminRole | undefined {
  return useAuthStore((s) => s.admin?.role);
}
