import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import net from 'net';
import type { Request } from 'express';
import { env } from '../utils/env';

const TOO_MANY = { error: 'Too many requests, please try again later' };

const PROXY_SECRET_HEADER = 'x-unipocket-proxy-secret';
const CLIENT_IP_HEADER = 'x-unipocket-client-ip';

/**
 * The client IP to rate-limit on: the IP declared by a trusted first-party
 * proxy, otherwise Express's own `req.ip`.
 *
 * The PWA proxies /auth/login, /auth/refresh and /auth/logout through its own
 * Next.js server so the refresh cookie stays first-party. Render therefore sees
 * that server's IP on every PWA request, which would collapse every PWA student
 * into one login bucket (10/min) and one refresh bucket (30/min). The proxy
 * forwards the browser's address in `x-unipocket-client-ip`.
 *
 * PWA_PROXY_SECRET is the ONLY thing authorising that header — a caller who
 * presents the matching `x-unipocket-proxy-secret` is trusted to name its own
 * client IP. Leaking the secret would therefore let any caller mint unlimited
 * rate-limit buckets, one per forged IP, and walk straight past the login and
 * refresh limits into credential stuffing. Treat it like JWT_SECRET: never in a
 * tracked file, never in a client bundle, rotate it if it is ever exposed.
 *
 * The IP header is never trusted on its own. With the secret unset the feature
 * is off entirely and `req.ip` always wins, so the native app — which does not
 * proxy — is unaffected.
 */
export function resolveClientIp(req: Request): string {
  const fallback = req.ip ?? 'unknown';

  const secret = env.PWA_PROXY_SECRET;
  if (!secret) return fallback;

  // A repeated header arrives as string[]; anything but a single string is
  // rejected rather than joined, so a caller can't smuggle a second value past
  // the comparison.
  const presented = req.headers[PROXY_SECRET_HEADER];
  if (typeof presented !== 'string') return fallback;

  const presentedBuf = Buffer.from(presented);
  const secretBuf = Buffer.from(secret);
  // timingSafeEqual throws on a length mismatch, so the lengths are compared
  // first. Length is not the secret; the bytes are, and those are compared in
  // constant time.
  if (presentedBuf.length !== secretBuf.length) return fallback;
  if (!crypto.timingSafeEqual(presentedBuf, secretBuf)) return fallback;

  const forwarded = req.headers[CLIENT_IP_HEADER];
  if (typeof forwarded !== 'string') return fallback;

  // net.isIP returns 0 for anything that is not a valid IPv4/IPv6 literal. An
  // unvalidated value would become a rate-limit key, letting a compromised
  // proxy fill the limiter's memory store with arbitrary strings.
  const candidate = forwarded.trim();
  if (net.isIP(candidate) === 0) return fallback;

  return candidate;
}

/**
 * Rate-limit key for the resolved client IP. ipKeyGenerator normalises IPv6 to
 * a /56 subnet; a bare address would let a single IPv6 client rotate within its
 * prefix to evade the limit.
 */
function clientIpKey(req: Request): string {
  return ipKeyGenerator(resolveClientIp(req));
}

/**
 * Bucket key for the global limiter: the authenticated student's id when the
 * request carries a valid access token, otherwise the client IP.
 *
 * Keying purely on IP put the entire campus into a single bucket — students
 * leave through one NAT, so a 100/min cap was exhausted by roughly a dozen
 * simultaneous users.
 *
 * The token is verified here rather than read from `req.studentId` because this
 * limiter runs at the app level (index.ts), before any router's authMiddleware
 * has populated that field — reading it there would always be undefined and
 * silently fall back to IP. Verification is an HMAC check with no database
 * round-trip, and it stops a caller from minting arbitrary ids to hand
 * themselves unlimited buckets.
 */
function studentOrIpKey(req: Request): string {
  const header = req.headers.authorization;

  if (header?.startsWith('Bearer ')) {
    try {
      const payload = jwt.verify(header.slice(7), env.JWT_SECRET) as {
        studentId?: string;
        type?: string;
      };
      if (payload.type === 'access' && payload.studentId) {
        return `student:${payload.studentId}`;
      }
    } catch {
      // Missing, invalid or expired token — fall through to IP keying.
    }
  }

  return `ip:${clientIpKey(req)}`;
}

/** 300/min per student (or per IP when unauthenticated). */
export const globalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  keyGenerator: studentOrIpKey,
  message: TOO_MANY,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 10/min per IP on login only. Deliberately IP-keyed and deliberately tight —
 * this is the credential-stuffing surface, and there is no authenticated
 * identity to key on yet.
 */
export const authLoginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  keyGenerator: clientIpKey,
  message: TOO_MANY,
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * 30/min per IP on refresh. Higher than login because every cold start hits it,
 * so a shared campus NAT would otherwise trip the login-grade limit during a
 * morning rush.
 */
export const authRefreshLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  keyGenerator: clientIpKey,
  message: TOO_MANY,
  standardHeaders: true,
  legacyHeaders: false,
});
