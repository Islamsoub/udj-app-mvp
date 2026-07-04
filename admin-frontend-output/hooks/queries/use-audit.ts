'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { AuditEntry, AuditFilters, Paginated } from '@/lib/types';

/** GET /admin/audit (SUPER_ADMIN only) — paginated, filterable. */
export function useAudit(filters: AuditFilters = {}) {
  return useQuery({
    queryKey: ['audit', filters],
    queryFn: () => get<Paginated<AuditEntry>>('/admin/audit', { ...filters }),
  });
}
