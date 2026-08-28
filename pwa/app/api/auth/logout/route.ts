import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  REFRESH_COOKIE,
  backendFetch,
  backendHeaders,
  cookieOptions,
} from '@/lib/proxy';

export const runtime = 'nodejs';

/**
 * POST /api/auth/logout
 *
 * Best-effort revocation upstream, unconditional logout locally. The cookie is
 * cleared and 204 returned whatever the backend says — a student who taps
 * "se déconnecter" on a dead network, or whose token was already revoked, must
 * still end up logged out rather than stuck in a session they asked to leave.
 * The worst case is a refresh token that stays valid upstream until it expires,
 * and it is no longer reachable from this browser.
 */
export async function POST(req: Request) {
  const store = await cookies();
  const refreshToken = store.get(REFRESH_COOKIE)?.value;
  const authorization = req.headers.get('authorization');

  // The backend requires both; without either there is nothing to revoke.
  if (refreshToken && authorization) {
    try {
      await backendFetch('/auth/logout', {
        method: 'POST',
        headers: { ...backendHeaders(req), Authorization: authorization },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // Swallowed deliberately — see the note above. Not logged, because the
      // request body carries the refresh token.
    }
  }

  store.delete({ name: REFRESH_COOKIE, path: cookieOptions().path });

  return new NextResponse(null, { status: 204 });
}
