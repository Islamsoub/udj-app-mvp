import type { Palette } from '@/constants/theme';
import type { AttendanceBand } from '@/services/api';

/**
 * Maps the SERVER's attendance verdict to a colour and a sentence.
 *
 * Nothing here decides a verdict. `band` and `absencesLeft` come from
 * GET /student/attendance (backend 7c929ec); there is no threshold, rate
 * comparison or absence arithmetic in this file, and there must never be one.
 * A null band (a row cached before band existed) maps to neutral with no
 * sentence — it is never filled in locally.
 */

export type VerdictTone = AttendanceBand | 'neutral';

export function verdictTone(band: AttendanceBand | null): VerdictTone {
  return band ?? 'neutral';
}

export function toneColor(tone: VerdictTone, colors: Palette): string {
  switch (tone) {
    case 'ok':
      return colors.jade400;
    case 'near':
      return colors.warning;
    case 'below':
      return colors.danger;
    default:
      return colors.textTertiary;
  }
}

/** Hero badge key for the overall band; null (no badge) without a band. */
export function heroBadgeKey(band: AttendanceBand | null): string | null {
  switch (band) {
    case 'ok':
      return 'presence.badge_regular';
    case 'near':
      return 'presence.badge_warning';
    case 'below':
      return 'presence.badge_critical';
    default:
      return null;
  }
}

export interface Sentence {
  key: string;
  params?: Record<string, number>;
}

export interface SubjectVerdictInput {
  band: AttendanceBand | null;
  absencesLeft: number | null;
  /** The truncated rate the card already shows. */
  percentage: number;
  /** Every session PRESENT — a fact, not a verdict. */
  perfect: boolean;
}

/**
 * The sentence under a subject card.
 *
 * Wording is Design's Round 2 copy (shared with the web), adapted to the card,
 * whose title is already the subject name:
 *   below  "Sous le seuil ({rate} %)" / "دون الحد الأدنى ({rate}٪)"
 *   ok, near  "Encore {n} absence(s) avant le seuil" / "{n} غياب متبقٍ قبل الحد الأدنى"
 * ok and near share the sentence; the colour carries the difference.
 */
export function subjectSentence({
  band,
  absencesLeft,
  percentage,
  perfect,
}: SubjectVerdictInput): Sentence | null {
  if (band === null) return null;

  // Design's wording, whether or not the semester has ended: it quotes the
  // rate, not a count, so it is true at any point in the term.
  if (band === 'below') return { key: 'presence.proj_below', params: { rate: percentage } };

  // PROVISIONAL, awaiting Design's confirmation: semester ended (ok or near).
  // The server sends absencesLeft null because no sessions remain, so there is
  // nothing left to spend — a count (even 0) would be wrong. State the outcome.
  if (absencesLeft === null) return { key: 'presence.proj_final_met' };

  if (band === 'ok' && perfect) return { key: 'presence.proj_perfect' };

  // PROVISIONAL, awaiting Design's confirmation: recoverable, but not one more
  // full session can be missed.
  if (absencesLeft === 0) return { key: 'presence.proj_none' };

  return { key: 'presence.proj_left', params: { count: absencesLeft } };
}
