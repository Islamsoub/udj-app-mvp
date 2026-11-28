'use client';

import { useMutation } from '@tanstack/react-query';
import { post } from '@/lib/api';
import type { CardVerdict } from '@/lib/types';

/**
 * POST /admin/card/verify — checks a scanned student-card code (the QR link or
 * a bare token). A read, not a change: nothing to invalidate, and the answer
 * is shown on the page rather than in a toast.
 */
export function useCardVerify() {
  return useMutation({
    mutationFn: (code: string) => post<CardVerdict>('/admin/card/verify', { code }),
  });
}
