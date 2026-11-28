import { ApiError } from '@/lib/api-client';

/**
 * The public student-card check, against this app's own /api/verify route.
 *
 * Bare `fetch`, like auth-client.ts: no session is involved (the person
 * checking a card usually has no account), so nothing is retried or refreshed,
 * and the answer is never cached — offline-cache.ts does not see it.
 */

export type CardKind = 'live' | 'offline';
export type CardReason = 'expired' | 'invalid' | 'inactive';

export interface CardStudent {
  firstName: string;
  lastName: string;
  studentIdDisplay: string;
  photoUrl: string | null;
  status: string;
  currentSemester: number;
  programme: { nameFr: string; nameAr: string; level: string };
  faculty: { nameFr: string; nameAr: string };
}

export interface CardVerdict {
  valid: boolean;
  reason?: CardReason;
  kind?: CardKind;
  issuedAt?: string;
  expiresAt?: string;
  checkedAt: string;
  student?: CardStudent;
}

/** The token as the QR link carries it, after "#t=". Null when absent. */
export function tokenFromHash(hash: string): string | null {
  const m = hash.match(/(?:^#|&)t=([A-Za-z0-9_\-.]+)/);
  return m ? m[1] : null;
}

export async function verifyCardCode(code: string): Promise<CardVerdict> {
  const res = await fetch('/api/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code }),
    cache: 'no-store',
    credentials: 'omit',
  });
  const body = await res.json().catch(() => null);
  if (!res.ok || !body || typeof body.valid !== 'boolean') throw new ApiError(res.status, body);
  return body as CardVerdict;
}
