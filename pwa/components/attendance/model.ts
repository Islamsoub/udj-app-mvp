import type {
  AbsenceRecord,
  AttendanceBand,
  AttendanceOverall,
  AttendanceSubject,
} from '@/lib/api-types';
import type { Lang } from '@/lib/i18n-shared';

/**
 * The attendance rules — the threshold and the justification window — are NOT
 * defined here. Both are admin-editable on the server and arrive on every
 * GET /student/attendance response; `checkAttendanceContract` in
 * lib/attendance-contract.ts refuses a response that lacks them rather than
 * substituting a local value. The same holds for `band` and `absencesLeft`.
 */

/**
 * Which of the justification panel's sub-states a record is in.
 *
 * Mutually exclusive SERVER states, not something the student toggles — which is
 * why §9 has the panel route straight to one of them with no transition between.
 *
 * `expired` is §9's upload-form state with the server's `canSubmitJustification`
 * verdict against it: nothing was filed and the window has closed, so the panel
 * explains that instead of offering a form the POST is certain to refuse.
 */
export type JustificationState = 'none' | 'expired' | 'pending' | 'approved' | 'rejected';

/**
 * Reads the sub-state off a record.
 *
 * THE AWKWARD CASE IS `JUSTIFIED` WITH NO `justificationStatus`, and it is not
 * hypothetical — every justified absence in the database today looks like that.
 * It means the absence was excused at source (a lecturer or the registrar marked
 * the session JUSTIFIED) rather than through a request the student filed:
 * PATCH /admin/attendance/:id/justification refuses to approve without a
 * document, so a genuine APPROVED always carries one.
 *
 * It routes to `approved` because that is what it is — the absence does not
 * count against the student, and there is nothing to upload. What it must NOT
 * do is route to `none`, which would offer to justify an absence that is already
 * excused, or claim a review that never happened; the approved body says which
 * of the two it is looking at by whether a document is attached.
 */
export function justificationState(record: AbsenceRecord): JustificationState {
  switch (record.justificationStatus) {
    case 'PENDING':
      return 'pending';
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    default:
      if (record.status === 'JUSTIFIED') return 'approved';
      return record.canSubmitJustification ? 'none' : 'expired';
  }
}

/**
 * "Is this one still on the student's plate?"
 *
 * Nothing filed yet, or filed and turned down — AND the server still accepts a
 * submission for it. Pending is off the list because the student has already
 * done their part, approved because it is settled, and anything past its window
 * because there is nothing left the student can do in the app; its panel says so
 * and points to the faculty.
 */
export function needsAction(record: AbsenceRecord): boolean {
  const state = justificationState(record);
  return (state === 'none' || state === 'rejected') && record.canSubmitJustification;
}

/** A record plus the subject it belongs to — the absence list is flat and
 *  chronological, while the API nests absences under their subject. */
export interface FlatAbsence {
  record: AbsenceRecord;
  subjectCode: string;
}

/**
 * Every absence across every subject, newest first.
 *
 * The API already sorts records by session date descending, but it does so
 * WITHIN each subject; flattening loses that ordering, so the sort is redone
 * here over the whole set. Dates are ISO-8601 from the server, which sorts
 * lexicographically, but they are parsed anyway — a string compare would be
 * correct only for as long as the format never changes.
 */
export function flattenAbsences(subjects: AttendanceSubject[]): FlatAbsence[] {
  const flat: FlatAbsence[] = [];

  for (const entry of subjects) {
    for (const record of entry.absences) {
      flat.push({ record, subjectCode: entry.subject.code });
    }
  }

  return flat.sort(
    (a, b) => new Date(b.record.date).getTime() - new Date(a.record.date).getTime()
  );
}

/**
 * A subject's presence figure, or null when it has none.
 *
 * NULL IS NOT 0. A subject with no session on record has no rate, and the
 * screen says so in words ("Aucune séance enregistrée") rather than drawing a
 * 0% that reads as "you missed everything". The server sends null when no
 * session hours could be counted, the same as for the overall figure.
 */
export function subjectRate(entry: AttendanceSubject): number | null {
  if (entry.total === 0) return null;
  const rate = entry.percentage;
  return typeof rate === 'number' && Number.isFinite(rate) ? rate : null;
}

/**
 * The level a subject is drawn in: the prototype's validated / limite / risque,
 * read off the SERVER's band (ROUND2-CLOSEOUT §4), never off the percentage.
 *
 * Term over (`absencesLeft === null`) is checked first, as on every other
 * surface: a term-over `near` is no longer "close to the limit", since no
 * absence can be added; a term-over `below` stays below.
 *
 * Null for a subject with no figure: its band was computed from nothing, so it
 * is shown in no level and counted in none.
 */
export type SubjectLevel = AttendanceBand;

export function subjectLevel(entry: AttendanceSubject): SubjectLevel | null {
  if (subjectRate(entry) === null) return null;
  if (entry.absencesLeft === null && entry.band === 'near') return 'ok';
  return entry.band;
}

/** How many subjects sit in each level — the hero's three counts. Subjects
 *  with no figure are in none of them. */
export function levelCounts(subjects: AttendanceSubject[]): Record<SubjectLevel, number> {
  const counts: Record<SubjectLevel, number> = { ok: 0, near: 0, below: 0 };
  for (const entry of subjects) {
    const level = subjectLevel(entry);
    if (level !== null) counts[level] += 1;
  }
  return counts;
}

/** The student's overall status for the hero pill, by the same rule as
 *  subjectLevel: the server's overall band, a term-over `near` read as ok. */
export function overallLevel(overall: AttendanceOverall): SubjectLevel {
  if (overall.absencesLeft === null && overall.band === 'near') return 'ok';
  return overall.band;
}

/**
 * Band rank, worst first. The order is ROUND2-CLOSEOUT §3's, not a severity the
 * PWA infers: the band itself is the server's verdict.
 */
const BAND_RANK: Record<AttendanceBand, number> = { below: 0, near: 1, ok: 2 };

/** The subject's name in the display language — the same pick SubjectBreakdown
 *  renders, so the order a student sees matches the names they read. */
function displayName(entry: AttendanceSubject, lang: Lang): string {
  return lang === 'ar' ? entry.subject.nameAr : entry.subject.nameFr;
}

/**
 * ROUND2-CLOSEOUT §3's ordering, the one definition of "worst subject":
 *   1. band, worst first: below, near, ok;
 *   2. fewest `absencesLeft`, null last (null is "term over", not 0);
 *   3. lowest `percentage` (§3's "rate");
 *   4. subject name in the display language, `localeCompare(b, lang)`.
 *
 * `percentage` is only compared with another subject's `percentage`, never with
 * the threshold: whether a subject is in trouble is `band`, from the server.
 *
 * A fifth key, the subject code, only separates two subjects whose names are
 * identical in the display language, so the order never depends on the order
 * the server happened to send them in. It is not part of §3.
 */
function compareSubjects(a: AttendanceSubject, b: AttendanceSubject, lang: Lang): number {
  const band = BAND_RANK[a.band] - BAND_RANK[b.band];
  if (band !== 0) return band;

  if (a.absencesLeft !== b.absencesLeft) {
    if (a.absencesLeft === null) return 1;
    if (b.absencesLeft === null) return -1;
    return a.absencesLeft - b.absencesLeft;
  }

  const rateA = subjectRate(a);
  const rateB = subjectRate(b);
  if (rateA !== rateB) {
    // No figure sorts after every real one: it is unknown, not zero.
    if (rateA === null) return 1;
    if (rateB === null) return -1;
    return rateA - rateB;
  }

  return (
    displayName(a, lang).localeCompare(displayName(b, lang), lang) ||
    a.subject.code.localeCompare(b.subject.code)
  );
}

/** Subjects worst first, by §3's order (see compareSubjects). Does not mutate
 *  its input. Used by the attendance page and by attendanceLine below, so the
 *  page's first row and the dashboard's named subject are always the same one. */
export function sortSubjects(subjects: AttendanceSubject[], lang: Lang): AttendanceSubject[] {
  return [...subjects].sort((a, b) => compareSubjects(a, b, lang));
}

/**
 * Which row of §3's table the dashboard card's line under the ring shows.
 * State only — no strings; the copy lives in the locale files.
 *
 * - `subject` is the worst subject after sortSubjects.
 * - `n` is that subject's `absencesLeft` (non-null by construction).
 * - `others` is how many OTHER subjects share its band; 0 means no "+ {k}".
 */
export type AttendanceLine =
  | { kind: 'ok' }
  | { kind: 'near'; subject: AttendanceSubject; n: number; others: number }
  | { kind: 'below'; subject: AttendanceSubject; others: number }
  | { kind: 'ended-below'; subject: AttendanceSubject; others: number }
  | { kind: 'ended-ok' };

/**
 * Derives the line's state from §3's rules:
 *   - the first subject after the sort is the candidate;
 *   - if its `absencesLeft` is null the term is over, and the term-over rows
 *     apply whatever the band: `ended-below` for `below`, else `ended-ok`;
 *   - if the worst band is `ok`, the line is `ok` and names no subject;
 *   - otherwise `near` or `below`, naming the candidate.
 *
 * Pure, and deliberately takes no threshold: every verdict here is `band`.
 *
 * Returns null for an empty list. §3 has no row for "no subjects", and `ok`
 * ("Toutes les matières au-dessus du seuil") would claim something about
 * subjects that do not exist; the caller shows its empty state instead.
 */
export function attendanceLine(subjects: AttendanceSubject[], lang: Lang): AttendanceLine | null {
  const ordered = sortSubjects(subjects, lang);
  const subject = ordered[0];
  if (subject === undefined) return null;

  const others = ordered.filter((s) => s.band === subject.band).length - 1;

  if (subject.absencesLeft === null) {
    return subject.band === 'below' ? { kind: 'ended-below', subject, others } : { kind: 'ended-ok' };
  }

  switch (subject.band) {
    case 'ok':
      return { kind: 'ok' };
    case 'near':
      return { kind: 'near', subject, n: subject.absencesLeft, others };
    case 'below':
      return { kind: 'below', subject, others };
  }
}
