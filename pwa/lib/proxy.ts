import { API_BASE_URL, PROXY_SECRET } from '@/lib/api-config';

/**
 * Name of the first-party refresh cookie. The backend returns the refresh token
 * in a JSON body and sets no cookie of its own — this proxy is what turns it
 * into an httpOnly cookie the browser stores but no script can read.
 */
export const REFRESH_COOKIE = 'unipocket_refresh';

/**
 * Render's free tier cold-starts in 30-50s, so a shorter deadline would turn a
 * first login of the day into a spurious failure.
 */
export const BACKEND_TIMEOUT_MS = 60_000;

/** Thrown when a backend call exceeds BACKEND_TIMEOUT_MS, so routes can answer 504. */
export class BackendTimeoutError extends Error {
  constructor() {
    super('Backend request timed out');
    this.name = 'BackendTimeoutError';
  }
}

/**
 * Cookie attributes for the refresh cookie.
 *
 * `path: '/api/auth'` keeps it off every other request — it is only ever read by
 * the refresh and logout routes. `secure` is off in development because
 * localhost is served over plain HTTP and the browser would drop the cookie.
 */
export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/api/auth',
    maxAge: 30 * 24 * 60 * 60,
  };
}

/**
 * The browser's IP as seen by the edge. x-forwarded-for accumulates one entry
 * per hop, so the leftmost is the original client; x-real-ip is the fallback for
 * proxies that only set that.
 */
export function clientIp(req: Request): string | null {
  const forwarded = req.headers.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }

  const real = req.headers.get('x-real-ip')?.trim();
  return real || null;
}

/**
 * Headers for a backend call. The forwarded-IP pair is sent only when the secret
 * is configured AND an IP was actually resolved — the backend ignores the IP
 * header without a matching secret, and sending a half-pair would be noise.
 */
export function backendHeaders(req: Request): Record<string, string> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };

  const ip = clientIp(req);
  if (PROXY_SECRET && ip) {
    headers['x-unipocket-proxy-secret'] = PROXY_SECRET;
    headers['x-unipocket-client-ip'] = ip;
  }

  return headers;
}

/**
 * fetch against the backend with a hard deadline. Throws BackendTimeoutError on
 * timeout and the underlying error on any other network failure, so callers can
 * answer 504 and 502 respectively.
 */
export async function backendFetch(path: string, init: RequestInit): Promise<Response> {
  if (!API_BASE_URL) {
    throw new Error('NEXT_PUBLIC_API_URL is not set');
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), BACKEND_TIMEOUT_MS);

  try {
    return await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      signal: controller.signal,
      cache: 'no-store',
    });
  } catch (err) {
    if (controller.signal.aborted) throw new BackendTimeoutError();
    throw err;
  } finally {
    clearTimeout(timer);
  }
}

/** Parsed JSON body, or null when the backend answered with something else. */
export async function readJson(res: Response): Promise<unknown> {
  return res.json().catch(() => null);
}
