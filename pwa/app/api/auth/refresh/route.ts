import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  BackendTimeoutError,
  REFRESH_COOKIE,
  backendFetch,
  backendHeaders,
  cookieOptions,
  readJson,
} from '@/lib/proxy';

export const runtime = 'nodejs';

/**
 * POST /api/auth/refresh
 *
 * Takes no request body: the refresh token comes from the httpOnly cookie, which
 * the client cannot read and therefore cannot send itself. The backend rotates
 * the token on every refresh, so the cookie is overwritten with the new one.
 */
export async function POST(req: Request) {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;

  // No cookie means no session — answered locally, without spending a backend
  // call or a rate-limit slot on a request that cannot succeed.
  if (!refreshToken) {
    return NextResponse.json({ error: 'No session' }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await backendFetch('/auth/refresh', {
      method: 'POST',
      headers: backendHeaders(req),
      body: JSON.stringify({ refreshToken }),
    });
  } catch (err) {
    if (err instanceof BackendTimeoutError) {
      return NextResponse.json({ error: 'Authentication server timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Authentication server unreachable' }, { status: 502 });
  }

  const data = await readJson(upstream);

  if (upstream.status === 401) {
    // The token is dead upstream; keeping the cookie would only produce the same
    // 401 on every future call. Deleted with the same path it was set with,
    // otherwise the browser keeps it.
    store.delete({ name: REFRESH_COOKIE, path: cookieOptions().path });
    return NextResponse.json(data ?? { error: 'Invalid refresh token' }, { status: 401 });
  }

  if (upstream.status !== 200) {
    return NextResponse.json(data ?? { error: 'Refresh failed' }, { status: upstream.status });
  }

  const { accessToken, refreshToken: rotatedToken } = (data ?? {}) as {
    accessToken?: unknown;
    refreshToken?: unknown;
  };

  if (typeof accessToken !== 'string' || typeof rotatedToken !== 'string') {
    return NextResponse.json(
      { error: 'Unexpected response from authentication server' },
      { status: 502 }
    );
  }

  store.set(REFRESH_COOKIE, rotatedToken, cookieOptions());

  return NextResponse.json({ accessToken });
}
