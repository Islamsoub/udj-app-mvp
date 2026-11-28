'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';

/** GET /admin/auth/me — the signed-in admin as the server has them now. */
export interface MeResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  facultyId: string | null;
  lastLoginAt: string | null;
}

export function useMe() {
  return useQuery({
    queryKey: ['me'],
    queryFn: () => get<MeResponse>('/admin/auth/me'),
  });
}
