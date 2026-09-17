/**
 * The only upstream headers the auth proxy routes forward, and only on a 429.
 *
 * `RateLimit-Reset` is the seconds left in the window, and it is the sole source
 * for the login screen's "réessayez dans N s" countdown — without it the client
 * has to guess, and a guessed countdown that expires early just produces another
 * 429. The other three are what make the value interpretable.
 *
 * Everything else is deliberately dropped. Blanket header forwarding is how
 * proxies leak upstream state: `Set-Cookie` in particular would put the
 * backend's own cookie into the browser and undercut the first-party httpOnly
 * cookie these routes exist to create, and it would arrive on the one response
 * nobody inspects closely. An allow-list cannot leak a header nobody listed.
 *
 * Kept in one module rather than copied into both routes so the list cannot
 * drift between them.
 */
const RATE_LIMIT_HEADERS = [
  'RateLimit-Limit',
  'RateLimit-Remaining',
  'RateLimit-Reset',
  'RateLimit-Policy',
] as const;

/**
 * The rate-limit headers present on `upstream`, ready to spread into a
 * ResponseInit. Absent headers are simply omitted.
 *
 * `Headers.get()` matches case-insensitively, which is what the HTTP spec
 * requires and what this needs: express-rate-limit emits these lowercased over
 * the wire, so a literal-string comparison against the canonical casing above
 * would find nothing.
 */
export function rateLimitHeaders(upstream: Response): Record<string, string> {
  const forwarded: Record<string, string> = {};

  for (const name of RATE_LIMIT_HEADERS) {
    const value = upstream.headers.get(name);
    if (value !== null) forwarded[name] = value;
  }

  return forwarded;
}
