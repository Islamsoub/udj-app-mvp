import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import jwt from 'jsonwebtoken';
import type { Request } from 'express';
import { env } from '../utils/env';

const TOO_MANY = { error: 'Too many requests, please try again later' };

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

  // ipKeyGenerator normalises IPv6 to a /56 subnet; a bare req.ip would let a
  // single IPv6 client rotate addresses within its prefix to evade the limit.
  return `ip:${ipKeyGenerator(req.ip ?? 'unknown')}`;
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
  message: TOO_MANY,
  standardHeaders: true,
  legacyHeaders: false,
});
