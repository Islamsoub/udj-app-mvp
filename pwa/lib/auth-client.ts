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

/** Fallback window when the upstream header is missing. Matches the backend's 60s. */
const DEFAULT_RETRY_AFTER_SECONDS = 60;

/**
 * A 429 from the login proxy, carrying the seconds left in the rate-limit window.
 *
 * ApiError exposes only status and body, and the countdown lives in a HEADER —
 * `RateLimit-Reset`, forwarded by app/api/auth/login/route.ts precisely so the
 * screen can show a real number instead of guessing. Widening ApiError itself
 * would put a login-specific field on every API failure in the app, so the
 * detail is carried by a subclass: `catch (e) { if (e instanceof ApiError) }`
 * still matches, and code that wants the countdown narrows one step further.
 */
export class RateLimitError extends ApiError {
  readonly retryAfterSeconds: number;

  constructor(body: unknown, retryAfterSeconds: number) {
    super(429, body);
    this.name = 'RateLimitError';
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Seconds left in the rate-limit window. Falls back to the full window when the
 * header is absent or unparseable — a countdown that is too long merely makes
 * the student wait, while one that is too short walks straight into another 429.
 */
function retryAfterFrom(res: Response): number {
  const raw = res.headers.get('RateLimit-Reset');
  if (raw === null) return DEFAULT_RETRY_AFTER_SECONDS;

  const seconds = Number.parseInt(raw, 10);
  return Number.isFinite(seconds) && seconds > 0 ? seconds : DEFAULT_RETRY_AFTER_SECONDS;
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
  if (res.status === 429) throw new RateLimitError(body, retryAfterFrom(res));
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
 * What one attempt to restore the session established.
 *
 *   'restored' — a fresh access token is in memory.
 *   'dead'     — the refresh route answered 401: there is no cookie, or the
 *                backend rejected the token. Logging in is the only way forward.
 *   'unknown'  — the attempt said nothing about the session: the request never
 *                arrived, or the backend is down or cold-starting (502/504), or
 *                it is rate-limited. The cookie is untouched and may be perfectly
 *                good; the student's password cannot fix any of these.
 */
export type SessionRestore = 'restored' | 'dead' | 'unknown';

/**
 * Re-establishes the session on page load, when the access token is gone (it
 * only ever lived in memory) but the refresh cookie may still be valid.
 *
 * Resolves with the outcome rather than throwing, and deliberately does not fire
 * onSessionExpired: on a cold load "no valid cookie" means the visitor is simply
 * logged out, which is a routing decision, not an interruption to announce.
 *
 * The dead/unknown split is the rule lib/api-client's isSessionDead applies to a
 * mid-session refresh — only a 401 ends a session — restated here because that
 * helper is private to its module. The two must not drift apart.
 *
 * The in-memory token is cleared on 'dead' alone. On 'unknown' there is usually
 * none to clear, and if there is one it is still valid.
 */
export async function restoreSession(): Promise<SessionRestore> {
  try {
    setAccessToken(await refreshAccessToken());
    return 'restored';
  } catch (err) {
    if (err instanceof ApiError && err.status === 401) {
      setAccessToken(null);
      return 'dead';
    }
    return 'unknown';
  }
}
