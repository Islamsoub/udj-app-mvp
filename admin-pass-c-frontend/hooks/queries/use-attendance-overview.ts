'use client';

import { useQuery } from '@tanstack/react-query';
import { get } from '@/lib/api';
import type { AttendanceOverviewResponse } from '@/lib/types';

/**
 * GET /admin/attendance/overview?programmeId= (Pass C-2, change-set §30.6 /
 * AD §4.7). Per-subject rollup for the scoped programme: sessions
 * (completed / total), hours-based class average, and students-at-risk against
 * the configured attendance threshold. Only runs once a programme is scoped.
 */
export function useAttendanceOverview(programmeId: string | null | undefined) {
  return useQuery({
    queryKey: ['attendance', 'overview', programmeId],
    queryFn: () =>
      get<AttendanceOverviewResponse>('/admin/attendance/overview', {
        programmeId: programmeId as string,
      }),
    enabled: !!programmeId,
  });
}
