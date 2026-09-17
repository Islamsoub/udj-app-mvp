import { ApiError } from '@/lib/api-client';
import { RateLimitError } from '@/lib/auth-client';

/**
 * What went wrong, in the form the screen renders it.
 *
 * The four cases are deliberately distinct types rather than one object with
 * optional fields: 401 and 423 both look like danger and 429 must never look
 * like either, so keeping them apart at the type level stops the rendering from
 * collapsing them by accident.
 *
 * `until` is an epoch millisecond deadline, not a duration, so a countdown can
 * be recomputed against the wall clock instead of drifting (see useCountdown).
 */
export type LoginError =
  /** 401 — wrong credentials. `attemptsLeft` is the backend's real count. */
  | { kind: 'credentials'; attemptsLeft: number | null }
  /** 423 — account locked after repeated failures. */
  | { kind: 'locked'; until: number }
  /** 429 — too many requests from this IP. Not about this student at all. */
  | { kind: 'rateLimited'; until: number }
  /** 502 / 504 from our own proxy — the backend is unreachable or cold-starting. */
  | { kind: 'server' }
  | { kind: 'unknown' };

/** True when the error owns the submit button until a deadline passes. */
export function deadlineOf(error: LoginError | null): number | null {
  if (error === null) return null;
  if (error.kind === 'locked' || error.kind === 'rateLimited') return error.until;
  return null;
}

/**
 * Maps a thrown error to what the screen should say.
 *
 * Anything that is not an ApiError — a TypeError from fetch when the network
 * drops mid-request, say — lands on 'server' rather than 'unknown': the student
 * can act on "try again in a moment", and a bare "an error occurred" only
 * invites them to re-check a password that was never the problem.
 */
export function toLoginError(err: unknown): LoginError {
  if (err instanceof RateLimitError) {
    return { kind: 'rateLimited', until: Date.now() + err.retryAfterSeconds * 1000 };
  }

  if (err instanceof ApiError) {
    if (err.status === 401) {
      return { kind: 'credentials', attemptsLeft: attemptsLeftFrom(err.body) };
    }

    if (err.status === 423) {
      return { kind: 'locked', until: lockedUntilFrom(err.body) };
    }

    if (err.status === 502 || err.status === 504) {
      return { kind: 'server' };
    }

    return { kind: 'unknown' };
  }

  return { kind: 'server' };
}

/**
 * The remaining attempts the backend reports. Null when absent — the message
 * then drops the sentence rather than inventing a number, because a hardcoded
 * "3" that disagrees with the server is worse than saying nothing.
 */
function attemptsLeftFrom(body: unknown): number | null {
  const value = (body as { attemptsLeft?: unknown } | null)?.attemptsLeft;
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/** Default matches the backend's 5-minute lockout when the field is missing. */
const DEFAULT_LOCKOUT_MS = 5 * 60 * 1000;

function lockedUntilFrom(body: unknown): number {
  const value = (body as { lockedUntil?: unknown } | null)?.lockedUntil;

  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    // A past or unparseable timestamp would render a countdown that is already
    // finished, re-enabling the button into an immediate second 423.
    if (Number.isFinite(parsed) && parsed > Date.now()) return parsed;
  }

  return Date.now() + DEFAULT_LOCKOUT_MS;
}
