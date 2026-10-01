'use client';

import { restoreSession, type SessionRestore } from '@/lib/auth-client';
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
 * logout, or a retry from the waiting state — genuinely re-runs rather than
 * replaying a stale answer.
 */
let inFlight: Promise<SessionRestore> | null = null;

/**
 * Pauses before each automatic retry of an 'unknown' restore. Two entries, so
 * two retries: a backend that answers 502 while it boots is usually up within
 * seconds, and absorbing that here means a short wake-up never reaches the
 * student as a screen at all.
 */
const AUTO_RETRY_DELAYS_MS = [2_000, 4_000];

/**
 * No automatic retry starts once a check has run this long. A 504 arrives only
 * after the proxy's own 55s deadline, so without the cap three of those would
 * hold the spinner for close to three minutes before admitting anything.
 */
const AUTO_RETRY_BUDGET_MS = 60_000;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * One restore, plus the automatic retries. Only 'unknown' is retried: 'dead' is
 * an answer, and asking again would only repeat it.
 *
 * Cannot loop — the retries are the fixed entries of AUTO_RETRY_DELAYS_MS, so a
 * check makes at most three attempts and then settles with whatever it has.
 */
async function restoreWithRetries(): Promise<SessionRestore> {
  const startedAt = Date.now();
  let outcome = await restoreSession();

  for (const delay of AUTO_RETRY_DELAYS_MS) {
    if (outcome !== 'unknown') break;
    if (Date.now() - startedAt >= AUTO_RETRY_BUDGET_MS) break;

    await sleep(delay);
    outcome = await restoreSession();
  }

  return outcome;
}

export function ensureSession(): Promise<SessionRestore> {
  if (getAccessToken() !== null) return Promise.resolve('restored');

  inFlight ??= restoreWithRetries().finally(() => {
    inFlight = null;
  });

  return inFlight;
}
