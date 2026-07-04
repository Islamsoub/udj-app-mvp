import type { Tone } from './tokens';

/**
 * Grade logic helpers (impl spec §5 "Shared helpers"). The NF weighting is
 * configurable in Settings — pass the live weights from useSettings(); the
 * 0.40/0.60 defaults match the SystemSettings seed.
 */

/** Mention thresholds (reconciliation §2). */
export function mention(nf: number | null | undefined): string {
  if (nf == null) return '—';
  if (nf >= 16) return 'Très Bien';
  if (nf >= 14) return 'Bien';
  if (nf >= 12) return 'Assez Bien';
  if (nf >= 10) return 'Passable';
  return 'Insuffisant';
}

/** ≥10 jade · ≥8 amber · <8 danger · null slate. */
export function gradeTone(nf: number | null | undefined): Tone {
  if (nf == null) return 'slate';
  if (nf >= 10) return 'jade';
  if (nf >= 8) return 'amber';
  return 'danger';
}

/** Fixed-decimal formatting, or "—" when null. */
export function fmt(n: number | null | undefined, d = 2): string {
  if (n == null) return '—';
  return n.toFixed(d);
}

/**
 * NF = wCc·CC + wCf·CF (null if either missing), rounded to 2 decimals.
 * Weights come from GET /admin/settings (never hardcode in callers).
 */
export function NF(
  cc: number | null | undefined,
  cf: number | null | undefined,
  wCc = 0.4,
  wCf = 0.6
): number | null {
  if (cc == null || cf == null) return null;
  return Math.round((wCc * cc + wCf * cf) * 100) / 100;
}

/** Coefficient-weighted GPA: Σ(NF·coef) / Σcoef over non-null NFs. */
export function weightedGpa(rows: { noteFinale: number | null; coefficient: number }[]): number | null {
  let num = 0;
  let den = 0;
  for (const r of rows) {
    if (r.noteFinale == null) continue;
    num += r.noteFinale * r.coefficient;
    den += r.coefficient;
  }
  if (den === 0) return null;
  return Math.round((num / den) * 100) / 100;
}

/** Presence % → bar color tone by 75/85 thresholds (impl spec §12). */
export function presenceTone(pct: number | null | undefined): Tone {
  if (pct == null) return 'slate';
  if (pct < 75) return 'danger';
  if (pct < 85) return 'amber';
  return 'jade';
}

/** Grade display tone in students table: <10 danger, <12 amber, else ink. */
export function listGradeTone(gpa: number | null | undefined): 'danger' | 'amber' | 'ink' {
  if (gpa == null) return 'ink';
  if (gpa < 10) return 'danger';
  if (gpa < 12) return 'amber';
  return 'ink';
}

/** Sanitize grade cell input to [0-9.] and detect invalidity. */
export function sanitizeGradeInput(raw: string): string {
  return raw.replace(/[^0-9.]/g, '');
}

export function gradeInputInvalid(raw: string): boolean {
  if (raw.trim() === '') return false; // empty = "not entered", valid
  const n = Number(raw);
  return Number.isNaN(n) || n < 0 || n > 20;
}
