import type { TranslationKey } from '@/lib/i18n-types';

/**
 * What the client accepts before a request is made.
 *
 * ── 4.5 MB, NOT THE BACKEND'S 5 MB. DO NOT "FIX" THIS. ───────────────────────
 *
 * VERCEL caps a serverless function's request body at 4.5 MB and answers
 * `413 FUNCTION_PAYLOAD_TOO_LARGE` above it — before the function is invoked, so
 * no code in this app runs and no useful message can be produced.
 *
 * The backend's multer limit is 5 MB (`MAX_FILE_BYTES` in
 * backend/src/routes/student.ts). That is LOOSER than the platform the proxy is
 * deployed on, which leaves a 4.5-5 MB dead band: a file in that range passes
 * the client check, passes multer, and still fails in production only. Worse, it
 * CANNOT BE REPRODUCED LOCALLY — `npm run dev` runs a plain Node server with no
 * such cap, so the bug is invisible until a student hits it.
 *
 * The client therefore enforces the tighter of the two and says 4.5 in its copy.
 * Raising this to 5 to "match the backend" reintroduces exactly that failure.
 */
export const MAX_UPLOAD_BYTES = 4.5 * 1024 * 1024;

/** The figure shown to the student. Kept beside the byte count so the copy and
 *  the check can never disagree. */
export const MAX_UPLOAD_MB = 4.5;

/**
 * The four types the backend accepts, in `ALLOWED_MIME` order.
 *
 * Doubles as the file picker's `accept` attribute, which is a FILTER AND NOT A
 * CHECK — it only decides what the OS dialog greys out, and every platform lets
 * the student switch to "all files". `validateFile` is the real gate, and the
 * backend re-derives the type from the file's magic bytes after upload, so a
 * renamed file is caught there even though nothing on the client can see it.
 */
export const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
] as const;

/**
 * Checks one file before any request is made. Returns the translation key of
 * the problem, or null when the file is acceptable.
 *
 * TYPE FIRST, THEN SIZE. A 9 MB `.mov` is both wrong and too big; naming the
 * type is the more useful of the two, because the student needs a different file
 * rather than a smaller one.
 *
 * `File.type` comes from the browser's own sniffing, usually by extension. It is
 * enough to stop honest mistakes and costs nothing; it is not a security control
 * and is not treated as one — the backend's magic-byte check is.
 */
export function validateFile(file: File): TranslationKey | null {
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) {
    return 'attendance.upload.error.type';
  }

  if (file.size > MAX_UPLOAD_BYTES) {
    return 'attendance.upload.error.too_large';
  }

  // A zero-byte file passes both checks above and then fails magic-byte
  // detection upstream with a type error, which would be a confusing thing to
  // read about an empty file.
  if (file.size === 0) {
    return 'attendance.upload.error.empty';
  }

  return null;
}
