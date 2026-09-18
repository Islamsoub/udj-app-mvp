'use client';

import { restoreSession } from '@/lib/auth-client';
import { getAccessToken } from '@/lib/auth-token';

/**
 * Idempotent "do we have a session?" for the route guard.
 *
 * Two things make a bare `restoreSession()` call in an effect wrong, and both
 * are about the refresh token being ROTATED on every use (app/api/auth/refresh
 * replaces the cookie with a fresh token and invalidates the one it consumed).
 *
 *   1. An access token already in memory means the answer is yes. Arriving from
 *      /login, login() has just put one there — refreshing again spends a
 *      rotation, costs a round-trip, and can only turn a working session into a
 *      failed one.
 *
 *   2. Two restores must never be in flight at once. React Strict Mode mounts
 *      effects twice in development, and any remount of the layout does the same
 *      in production; both calls would send the same cookie, the first would
 *      rotate it, and the second would be rejected for presenting a token that
 *      no longer exists — logging out a student who was correctly logged in.
 *      lib/api-client single-flights its own refreshes, but restoreSession()
 *      reaches refreshAccessToken() directly and bypasses that.
 *
 * The in-flight promise is cleared when it settles, so a later check — after a
 * logout, say — genuinely re-runs rather than replaying a stale answer.
 */
let inFlight: Promise<boolean> | null = null;

export function ensureSession(): Promise<boolean> {
  if (getAccessToken() !== null) return Promise.resolve(true);

  inFlight ??= restoreSession().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
