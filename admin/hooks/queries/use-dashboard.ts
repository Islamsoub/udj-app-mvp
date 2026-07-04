'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { ActivityEntry, DashboardStats } from '@/lib/types';

/** GET /admin/dashboard/stats */
export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => get<DashboardStats>('/admin/dashboard/stats'),
  });
}

/** GET /admin/dashboard/recent-activity — last 20 audit entries. */
export function useRecentActivity() {
  return useQuery({
    queryKey: ['dashboard', 'recent-activity'],
    queryFn: () => get<ActivityEntry[]>('/admin/dashboard/recent-activity'),
  });
}
