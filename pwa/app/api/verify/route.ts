import { NextResponse } from 'next/server';
import { BackendTimeoutError, backendFetch, backendHeaders, readJson } from '@/lib/proxy';

export const runtime = 'nodejs';
// Long enough to sit through a Render free-tier cold start (30-50s).
export const maxDuration = 60;

const NO_STORE = { 'Cache-Control': 'private, no-store' };

/**
 * POST /api/verify — relays a scanned student-card code to the backend's
 * public POST /verify/card. No session: the person checking a card usually has
 * no account. The client IP is forwarded (backendHeaders) so the backend's
 * per-IP limit counts each visitor, not this server.
 */
export async function POST(req: Request) {
  const input = (await req.json().catch(() => null)) as { code?: unknown } | null;
  const code = typeof input?.code === 'string' ? input.code.slice(0, 2048) : '';
  if (!code) {
    return NextResponse.json({ error: 'Code required' }, { status: 400, headers: NO_STORE });
  }

  let upstream: Response;
  try {
    upstream = await backendFetch('/verify/card', {
      method: 'POST',
      headers: backendHeaders(req),
      body: JSON.stringify({ code }),
    });
  } catch (err) {
    const status = err instanceof BackendTimeoutError ? 504 : 502;
    return NextResponse.json({ error: 'Backend unavailable' }, { status, headers: NO_STORE });
  }

  const data = await readJson(upstream);
  return NextResponse.json(data ?? { error: 'Unexpected response from backend' }, {
    status: upstream.status,
    headers: NO_STORE,
  });
}
