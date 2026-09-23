/**
 * Stable, machine-readable identifiers for errors a client has to tell apart.
 *
 * WHY THESE EXIST. Two distinct failures on the justification upload both answer
 * 409 — the record is not an absence, and the submission deadline has passed —
 * and until now the only thing separating them was a French sentence. A client
 * that needs different copy for each had no choice but to pattern-match that
 * sentence, which breaks the moment anyone rewords it or adds a second
 * language.
 *
 * The codes are part of the API contract: they are never translated, never
 * rephrased, and never reused for a different condition. The human sentence in
 * `error` stays exactly as it was and remains the fallback for any client that
 * does not know about codes.
 */
export type ErrorCode = 'NOT_ABSENT' | 'DEADLINE_PASSED';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  /**
   * OPTIONAL, and that is the whole point. Every existing `throw new AppError(
   * message, status)` keeps its exact body — the error handler only emits a
   * `code` when one was actually supplied, so no response that does not need
   * one changes by a single byte.
   */
  code?: ErrorCode;

  constructor(message: string, statusCode: number, code?: ErrorCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
