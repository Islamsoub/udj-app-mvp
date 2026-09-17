import { NextResponse } from 'next/server';
import { BackendTimeoutError, backendFetch, readJson } from '@/lib/proxy';

export const runtime = 'nodejs';
// Long enough to sit through a Render free-tier cold start (30-50s).
export const maxDuration = 60;

/**
 * Upstream prefixes this route is allowed to reach. The backend also serves
 * /auth and /admin; without this allow-list the catch-all would be an open relay
 * to both, reachable from the browser with no CORS to stop it.
 */
const ALLOWED_ROOTS = new Set(['student', 'news']);

/**
 * A path segment safe to splice into the upstream URL. Rejecting anything else
 * (notably `.` and `..`) stops a request like /api/backend/student/../auth/login
 * from being normalised by fetch into a call the allow-list meant to refuse.
 */
const SAFE_SEGMENT = /^[A-Za-z0-9._~-]+$/;

type Context = { params: Promise<{ path?: string[] }> };

/**
 * Builds the upstream path, or null when the request must be refused.
 *
 * The incoming query string is carried over verbatim: `allSemesters`, `limit`,
 * `offset`, `category` and `semesterId` all change what the backend returns, so
 * dropping them would silently answer a different question than the one asked.
 */
function upstreamPath(segments: string[] | undefined, search: string): string | null {
  if (!segments || segments.length === 0) return null;
  if (!ALLOWED_ROOTS.has(segments[0])) return null;

  for (const segment of segments) {
    if (segment === '.' || segment === '..' || !SAFE_SEGMENT.test(segment)) return null;
  }

  return `/${segments.map(encodeURIComponent).join('/')}${search}`;
}

/**
 * Forwards one authenticated call to the backend.
 *
 * Deliberately sends neither `x-unipocket-proxy-secret` nor
 * `x-unipocket-client-ip`, unlike the /api/auth routes. These calls carry a
 * Bearer token and the backend's global limiter keys on the student ID inside
 * it, not on IP — so a forwarded IP would buy nothing and would widen the
 * surface of the IP-spoofing trust the backend grants to secret holders.
 */
async function forward(req: Request, context: Context, body?: string) {
  const { path } = await context.params;
  const target = upstreamPath(path, new URL(req.url).search);

  // Refused before any network call: an unknown path is not the backend's
  // problem, and answering 404 here keeps the relay closed.
  if (!target) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const authorization = req.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  let upstream: Response;
  try {
    upstream = await backendFetch(target, {
      method: req.method,
      headers: { 'Content-Type': 'application/json', Authorization: authorization },
      ...(body === undefined ? {} : { body }),
    });
  } catch (err) {
    if (err instanceof BackendTimeoutError) {
      return NextResponse.json({ error: 'Backend timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }

  const data = await readJson(upstream);

  // Status and body pass through untouched — the client needs to tell 401 from
  // 404 from 429, and /student/attendance returns short-lived signed Storage
  // URLs that must reach the browser exactly as the backend sent them.
  return NextResponse.json(data ?? { error: 'Unexpected response from backend' }, {
    status: upstream.status,
  });
}

/** GET /api/backend/{student,news}/... */
export async function GET(req: Request, context: Context) {
  return forward(req, context);
}

/** PATCH /api/backend/{student,news}/... — JSON body forwarded as received. */
export async function PATCH(req: Request, context: Context) {
  return forward(req, context, await req.text());
}
