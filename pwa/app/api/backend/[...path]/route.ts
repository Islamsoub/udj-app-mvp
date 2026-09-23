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

/**
 * The ONE upstream shape POST may reach:
 * `student/attendance/{uuid}/justification`.
 *
 * Anchored end to end rather than scoped to `student/*`. POST is the only verb
 * here that changes server state and the only one carrying an opaque binary
 * body, so it gets the narrowest possible target instead of inheriting GET's
 * reach — a `student/*` rule would have handed the browser every future POST
 * endpoint the backend grows, sight unseen.
 *
 * The record id is matched as a UUID even though the backend validates it too.
 * Defence in depth is cheap here, and it keeps the relay from forwarding
 * arbitrary strings into a path the backend will only reject anyway.
 */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isJustificationUpload(segments: string[]): boolean {
  return (
    segments.length === 4 &&
    segments[0] === 'student' &&
    segments[1] === 'attendance' &&
    segments[3] === 'justification' &&
    UUID.test(segments[2])
  );
}

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

/**
 * POST /api/backend/student/attendance/{uuid}/justification — the only POST.
 *
 * A separate handler rather than a branch inside `forward`, because almost
 * nothing about `forward` is right for this call: it hardcodes
 * `Content-Type: application/json`, which would make multer parse a multipart
 * body as JSON and find no file at all.
 *
 * ── BUFFERED, NOT STREAMED ───────────────────────────────────────────────────
 *
 * `req.arrayBuffer()` reads the whole body, and it is handed upstream as bytes.
 * Streaming would mean passing `req.body` with `duplex: 'half'`, which sends
 * chunked with no Content-Length and is supported unevenly across undici
 * versions — and it would buy nothing: Vercel buffers the entire request before
 * it ever invokes the function, so the memory has already been spent by the time
 * this line runs. The body is capped at 4.5 MB (see below), so the cost is
 * bounded and the bytes are guaranteed to arrive byte-for-byte as sent.
 *
 * ── THE CONTENT-TYPE IS COPIED, NEVER REBUILT ────────────────────────────────
 *
 * `multipart/form-data; boundary=----WebKitFormBoundary...` — the boundary is
 * generated by the browser and is the only thing that tells multer where the
 * parts begin. Reconstructing the header, or letting anything default it to
 * JSON, silently turns a valid upload into "Missing file field".
 *
 * ── 4.5 MB ───────────────────────────────────────────────────────────────────
 *
 * VERCEL caps a serverless function's request body at 4.5 MB and answers
 * 413 FUNCTION_PAYLOAD_TOO_LARGE above it — before this handler runs, so the
 * check below never sees those. The backend's own multer limit is 5 MB, which is
 * LOOSER. Do not "fix" the client's 4.5 MB cap to match the backend: a 4.6 MB
 * file would pass every check in this app and then fail only in production,
 * where `npm run dev` cannot reproduce it. The guard here is a second line
 * behind the client's, for the case where the multipart envelope pushes a file
 * that was under 4.5 MB over the platform's limit.
 *
 * ── maxDuration = 60 ─────────────────────────────────────────────────────────
 *
 * Unchanged, and it can be exceeded: a 4.5 MB upload over a slow mobile link
 * plus a Render free-tier cold start (30-50s) can outrun it. When it does,
 * Vercel kills the function and returns its own opaque error, so the student
 * sees the generic "service unavailable, try again" message rather than a
 * timeout. Note the upload may still have SUCCEEDED upstream in that case — the
 * backend can finish storing the file after the function that was waiting on it
 * is gone. Reopening the panel is what tells the student which happened.
 */
const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

export async function POST(req: Request, context: Context) {
  const { path } = await context.params;

  // The GET allow-list still applies, and the upload rule narrows it further.
  const target = upstreamPath(path, new URL(req.url).search);
  if (!target || !path || !isJustificationUpload(path)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const authorization = req.headers.get('authorization');
  if (!authorization) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const contentType = req.headers.get('content-type');
  if (!contentType || !contentType.toLowerCase().startsWith('multipart/form-data')) {
    return NextResponse.json({ error: 'Expected multipart/form-data' }, { status: 400 });
  }

  const body = new Uint8Array(await req.arrayBuffer());

  if (body.byteLength > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: 'Payload too large' }, { status: 413 });
  }

  let upstream: Response;
  try {
    upstream = await backendFetch(target, {
      method: 'POST',
      // The boundary rides along inside `contentType`. No Content-Length: fetch
      // derives it from the byte length it was given.
      headers: { 'Content-Type': contentType, Authorization: authorization },
      body,
    });
  } catch (err) {
    if (err instanceof BackendTimeoutError) {
      return NextResponse.json({ error: 'Backend timed out' }, { status: 504 });
    }
    return NextResponse.json({ error: 'Backend unreachable' }, { status: 502 });
  }

  const data = await readJson(upstream);

  // Straight through, like the other verbs: the client distinguishes 400 from
  // 404 from 409, and the success body carries a fresh signed Storage URL that
  // must reach the browser exactly as the backend minted it.
  return NextResponse.json(data ?? { error: 'Unexpected response from backend' }, {
    status: upstream.status,
  });
}
