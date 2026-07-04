import crypto from 'crypto';

/**
 * Shared helpers for admin routes: grade computation (reads weights from
 * SystemSettings — never hardcoded), mention thresholds, password generation,
 * and pagination parsing.
 */

// ─── Grades ──────────────────────────────────────────────────────────────────

export interface GradeWeights {
  gradeWeightCc: number;
  gradeWeightCf: number;
}

/**
 * NF = wCc·CC + wCf·CF, rounded to 2 decimals. Weights come from SystemSettings
 * (reconciliation §2/§5). Returns null if either component is missing.
 */
export function computeNoteFinale(
  noteCc: number | null | undefined,
  noteCf: number | null | undefined,
  weights: GradeWeights
): number | null {
  if (noteCc == null || noteCf == null) return null;
  const nf = weights.gradeWeightCc * noteCc + weights.gradeWeightCf * noteCf;
  return Math.round(nf * 100) / 100;
}

// Mention thresholds (reconciliation §2). Grades are on a /20 scale.
export function mentionFor(noteFinale: number | null): string | null {
  if (noteFinale == null) return null;
  if (noteFinale >= 16) return 'Très Bien';
  if (noteFinale >= 14) return 'Bien';
  if (noteFinale >= 12) return 'Assez Bien';
  if (noteFinale >= 10) return 'Passable';
  return 'Insuffisant';
}

export function isPassing(noteFinale: number | null): boolean {
  return noteFinale != null && noteFinale >= 10;
}

// ─── Passwords ───────────────────────────────────────────────────────────────

// Unambiguous alphabet — no 0/O/1/l/I (UI specs §27, task rule).
const UNAMBIGUOUS = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';

/** Cryptographically-random N-char password from the unambiguous alphabet. */
export function generatePassword(length = 12): string {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += UNAMBIGUOUS[bytes[i] % UNAMBIGUOUS.length];
  }
  return out;
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface Pagination {
  page: number;
  pageSize: number;
  skip: number;
  take: number;
}

/** Parses ?page & ?pageSize (default 20 rows/page per UI specs §8). */
export function parsePagination(query: Record<string, unknown>, defaultSize = 20): Pagination {
  const page = Math.max(1, parseInt(String(query.page ?? '1'), 10) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, parseInt(String(query.pageSize ?? String(defaultSize)), 10) || defaultSize)
  );
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize };
}

// ─── Matricule / email validation ────────────────────────────────────────────

// UDJ-YYYY-NNNN (implementation spec §27 allows 3–4 trailing digits).
export const MATRICULE_REGEX = /^UDJ-\d{4}-\d{3,4}$/;
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
