/**
 * Base URL of the Express API, without a trailing slash.
 *
 * NEXT_PUBLIC_ because non-proxied endpoints (grades, schedule, news) are called
 * straight from the browser with a Bearer token; only the three auth routes go
 * through this app's server so the refresh token can live in a first-party
 * httpOnly cookie.
 */
export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? '').replace(/\/+$/, '');

/**
 * Shared secret that authorises the `x-unipocket-client-ip` header the auth
 * proxy sends, so the backend rate-limits on the student's real IP instead of
 * this server's (see resolveClientIp in backend/src/middleware/rateLimiter.ts).
 *
 * SERVER ONLY. Deliberately not NEXT_PUBLIC_ — Next inlines every NEXT_PUBLIC_
 * value into the client bundle, and a leaked secret would let any caller mint
 * unlimited rate-limit buckets against the backend. Never import this module
 * from a client component.
 *
 * Undefined when unset, which simply turns the forwarded-IP header off.
 */
export const PROXY_SECRET = process.env.PWA_PROXY_SECRET || undefined;
