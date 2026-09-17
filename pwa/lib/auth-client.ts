import { ApiError, refreshAccessToken } from '@/lib/api-client';
import { getAccessToken, setAccessToken } from '@/lib/auth-token';
import type { StudentSummary } from '@/lib/api-types';

/**
 * Session lifecycle against this app's own /api/auth routes.
 *
 * All three use bare `fetch`: they are not behind /api/backend, they must not be
 * retried on 401 (a wrong password is an answer, not a stale token), and the
 * refresh token they depend on travels as an httpOnly cookie the client never
 * sees. `credentials: 'same-origin'` is what carries that cookie.
 */

const LOGIN_PATH = '/api/auth/login';
const LOGOUT_PATH = '/api/auth/logout';

export interface LoginResult {
  student: StudentSummary;
}

async function parseBody(res: Response): Promise<unknown> {
  return res.json().catch(() => null);
}

/**
 * Authenticates and holds the access token in memory. The refresh token is not
 * in this response at all — the login route strips it into a cookie — so there
 * is nothing here to accidentally persist.
 *
 * Throws ApiError on failure so the caller can separate 401 (bad credentials)
 * from 423 (locked out, body carries lockedUntil) from 429 (rate limited).
 */
export async function login(studentId: string, password: string): Promise<LoginResult> {
  const res = await fetch(LOGIN_PATH, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    cache: 'no-store',
    body: JSON.stringify({ studentId, password }),
  });

  const body = await parseBody(res);
  if (!res.ok) throw new ApiError(res.status, body);

  const { accessToken, student } = (body ?? {}) as {
    accessToken?: unknown;
    student?: unknown;
  };

  if (typeof accessToken !== 'string' || !student) {
    throw new ApiError(502, { error: 'Malformed login response' });
  }

  setAccessToken(accessToken);

  return { student: student as StudentSummary };
}

/**
 * Ends the session. The in-memory token is cleared whatever the server says: a
 * student who asked to log out must end up logged out even on a dead network,
 * and the route clears the cookie unconditionally for the same reason.
 */
export async function logout(): Promise<void> {
  const token = getAccessToken();

  try {
    await fetch(LOGOUT_PATH, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      credentials: 'same-origin',
      cache: 'no-store',
    });
  } catch {
    // Swallowed: revocation upstream is best-effort. Not logged — the failure
    // would be of a request that carried a token.
  } finally {
    setAccessToken(null);
  }
}

/**
 * Re-establishes the session on page load, when the access token is gone (it
 * only ever lived in memory) but the refresh cookie may still be valid.
 *
 * Returns false rather than throwing, and deliberately does not fire
 * onSessionExpired: on a cold load "no valid cookie" means the visitor is simply
 * logged out, which is a routing decision, not an interruption to announce.
 */
export async function restoreSession(): Promise<boolean> {
  try {
    setAccessToken(await refreshAccessToken());
    return true;
  } catch {
    setAccessToken(null);
    return false;
  }
}
