import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { withNoStore } from '@/lib/no-store';
import {
  BackendTimeoutError,
  REFRESH_COOKIE,
  backendFetch,
  cookieOptions,
  readJson,
} from '@/lib/proxy';

export const runtime = 'nodejs';
// Long enough to sit through a Render free-tier cold start (30-50s).
export const maxDuration = 60;

/**
 * The longest body a password change can need: two passwords of at most 128
 * characters (the backend's limit), 4 bytes each at worst, JSON-escaped. Anything
 * larger is refused before it costs a backend call.
 */
const MAX_BODY_BYTES = 4 * 1024;

/**
 * PATCH /api/auth/password — the student changes their own password.
 *
 * WHY HERE AND NOT THROUGH /api/backend. On success the backend revokes EVERY
 * refresh token the student holds, this browser's included, and answers with a
 * new pair in the login format. The new refresh token must replace the cookie,
 * and the page must never see it. The relay passes bodies to the browser as
 * received, so it would hand the refresh token to page JS and leave the dead one
 * in the cookie (the student would be signed out at the next refresh). The
 * relay refuses student/password for that reason.
 *
 * So this route does what POST /api/auth/login does with the same response:
 * the refresh token goes into the httpOnly cookie, and only the access token is
 * returned, for the page's in-memory store (lib/auth-token). The student
 * object the backend also returns is not passed on: the page already has it.
 *
 * Only the two fields are forwarded, rebuilt rather than copied, so nothing
 * else the page sent reaches the backend. Neither the passwords nor the tokens
 * are ever logged here, and no error path echoes the request.
 *
 * Like /api/backend, it sends the Bearer token and no forwarded-IP pair: the
 * backend's limit on this route (5 per 15 minutes) is keyed on the student id
 * in that token, not on the IP.
 */
async function handlePATCH(req: Request) {
  const authorization = req.headers.get('authorization');
  if (!authorization || !authorization.startsWith('Bearer ')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const raw = await req.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let parsed: unknown = null;
  try {
    parsed = JSON.parse(raw);
  } catch {
    // Falls through to the 400 below. The body is not quoted anywhere.
  }
  const { currentPassword, newPassword } = (parsed ?? {}) as {
    currentPassword?: unknown;
    newPassword?: unknown;
  };
  if (typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    return NextResponse.json(
      { error: 'Mot de passe actuel et nouveau mot de passe requis' },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await backendFetch('/student/password', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  } catch (err) {
    if (err instanceof BackendTimeoutError) {
      return NextResponse.json({ error: 'Backend timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }

  const data = await readJson(upstream);

  // 400 (wrong current password, length, same password), 401 (access token),
  // 429 (rate limit): status and the backend's fixed message pass through. The
  // backend's error bodies never carry a password.
  if (upstream.status !== 200) {
    const error = (data as { error?: unknown } | null)?.error;
    return NextResponse.json(
      { error: typeof error === 'string' ? error : 'Password change failed' },
      { status: upstream.status }
    );
  }

  const { accessToken, refreshToken } = (data ?? {}) as {
    accessToken?: unknown;
    refreshToken?: unknown;
  };

  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    // The password HAS changed upstream and every session is revoked, this
    // one's included. Saying so is all that can be done; the client signs out.
    return NextResponse.json(
      { error: 'Unexpected response from backend' },
      { status: 502 }
    );
  }

  const store = await cookies();
  store.set(REFRESH_COOKIE, refreshToken, cookieOptions());

  return NextResponse.json({ accessToken });
}

// Carries tokens or session state: never cached (lib/no-store.ts).
export const PATCH = withNoStore(handlePATCH);
