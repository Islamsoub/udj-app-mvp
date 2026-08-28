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
 * POST /api/auth/login
 *
 * Forwards credentials to the backend and converts the refresh token from the
 * JSON body into a first-party httpOnly cookie. The refresh token never appears
 * in this route's response — that is the entire point of proxying: a token in a
 * body is readable by any script that gets injected into the page, a token in an
 * httpOnly cookie is not.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const { studentId, password } = (body ?? {}) as {
    studentId?: unknown;
    password?: unknown;
  };

  if (typeof studentId !== 'string' || typeof password !== 'string') {
    return NextResponse.json(
      { error: 'Student ID and password are required' },
      { status: 400 }
    );
  }

  let upstream: Response;
  try {
    upstream = await backendFetch('/auth/login', {
      method: 'POST',
      headers: backendHeaders(req),
      body: JSON.stringify({ studentId, password }),
    });
  } catch (err) {
    if (err instanceof BackendTimeoutError) {
      return NextResponse.json({ error: 'Authentication server timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Authentication server unreachable' }, { status: 502 });
  }

  const data = await readJson(upstream);

  // Passed through unchanged so the client can tell 401 (bad credentials) from
  // 423 (locked, carries lockedUntil) from 429 (rate limited).
  if (upstream.status !== 200) {
    return NextResponse.json(data ?? { error: 'Login failed' }, { status: upstream.status });
  }

  const { accessToken, refreshToken, student } = (data ?? {}) as {
    accessToken?: unknown;
    refreshToken?: unknown;
    student?: unknown;
  };

  if (typeof accessToken !== 'string' || typeof refreshToken !== 'string') {
    return NextResponse.json(
      { error: 'Unexpected response from authentication server' },
      { status: 502 }
    );
  }

  const store = await cookies();
  store.set(REFRESH_COOKIE, refreshToken, cookieOptions());

  return NextResponse.json({ accessToken, student });
}
