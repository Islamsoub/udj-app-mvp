import type { GradeItem, GradesResponse, SemesterSummary } from '@/lib/api-types';
import type { Lang } from '@/lib/i18n-shared';
import type { TranslationKey } from '@/lib/i18n-types';

/**
 * Pure data shaping for the grades screen — no React, no fetching.
 *
 * Everything here exists because the API's shape and the screen's shape differ
 * in three ways that are easy to get subtly wrong: null means "not published"
 * rather than zero, the semester list is not ordered, and the mention arrives
 * as a French string from the backend.
 */

// ── Publication ───────────────────────────────────────────────────────────────

/**
 * Which halves of the semester's results are out.
 *
 * `published_cc_at` and `published_nf_at` are independent columns, so CC can be
 * out while NF is not — that is the normal mid-semester state, not an edge case.
 * The API reports them per semester (`some()` over the visible rows), and the
 * screen gates whole columns on them rather than reading each row's own marks:
 * showing a CC figure for a semester the faculty has not published CC for would
 * be publishing it on their behalf.
 */
export interface Published {
  cc: boolean;
  nf: boolean;
}

/**
 * The value a cell should render, or null for "not published yet".
 *
 * The gate is what makes null trustworthy downstream: every consumer — the cell,
 * the sort comparator, the mobile card — asks this rather than reading
 * `grade.noteCc` directly, so there is one place where "hidden" is decided.
 */
export function visibleMark(
  grade: GradeItem,
  column: 'cc' | 'cf' | 'final',
  published: Published
): number | null {
  if (column === 'cc') return published.cc ? grade.noteCc : null;
  return published.nf ? (column === 'cf' ? grade.noteCf : grade.noteFinale) : null;
}

export type RowStatus = 'validated' | 'failed' | 'pending';

/**
 * A subject's outcome.
 *
 * `isValidated` is false both for a failed subject and for one whose finals are
 * not published — the API sets it to false whenever NF is unpublished — so it
 * cannot be read alone. Without the NF gate every ungraded subject on the screen
 * would be labelled "Non validée", which reads as a fail for work that has not
 * been marked.
 */
export function rowStatus(grade: GradeItem, published: Published): RowStatus {
  if (!published.nf || grade.noteFinale === null) return 'pending';
  return grade.isValidated ? 'validated' : 'failed';
}

// ── Mention ───────────────────────────────────────────────────────────────────

/**
 * The backend computes the mention itself and sends the French label ("Très
 * Bien", "Assez Bien", …). Rendering that string straight through would leave
 * French words in the Arabic UI, so it is mapped back to a key here.
 *
 * Unknown values fall back to the raw string: a mention the backend adds later
 * should appear untranslated rather than vanish.
 */
const MENTION_KEYS: Record<string, TranslationKey> = {
  'très bien': 'grades.mention.tres_bien',
  bien: 'grades.mention.bien',
  'assez bien': 'grades.mention.assez_bien',
  passable: 'grades.mention.passable',
  insuffisant: 'grades.mention.insuffisant',
};

export function mentionKey(mention: string): TranslationKey | null {
  return MENTION_KEYS[mention.trim().toLowerCase()] ?? null;
}

// ── Semesters ─────────────────────────────────────────────────────────────────

/**
 * The tab list.
 *
 * Two corrections to what the API returns:
 *
 *   • ORDER. `allSemesters=true` derives its list from the student's grade rows
 *     and returns them in whatever order the database produced, so the tabs
 *     would otherwise be S2-then-S1 for one student and the reverse for the
 *     next. Sorted by academic year then label, which puts S1 before S2.
 *   • COMPLETENESS. That list only contains semesters the student has grade rows
 *     in. The current semester is where the screen opens, so it must have a tab
 *     even in the first days of a term when nothing has been recorded yet;
 *     otherwise the screen opens on a tab that is not in its own tab strip.
 */
export function orderSemesters(
  current: GradesResponse,
  semesters: SemesterSummary[]
): SemesterSummary[] {
  const merged = semesters.some((s) => s.id === current.semester.id)
    ? [...semesters]
    : [
        ...semesters,
        {
          ...current.semester,
          gpa: current.gpa,
          mention: current.mention,
          credits: current.credits,
        },
      ];

  return merged.sort((a, b) =>
    a.academicYear === b.academicYear
      ? a.label.localeCompare(b.label)
      : a.academicYear.localeCompare(b.academicYear)
  );
}

/**
 * The semester to point an empty state at.
 *
 * One student in the database has published results, in S1 — and S2 is the
 * current semester, so she opens on an empty screen with her only results one
 * tab away. Preferring a semester that actually has a GPA means the empty state
 * can name it ("vos résultats du S1 sont disponibles") instead of offering a
 * neutral list of tabs she has no reason to try.
 */
export function suggestedSemester(
  semesters: SemesterSummary[],
  selectedId: string
): SemesterSummary | null {
  const others = semesters.filter((s) => s.id !== selectedId);
  return others.find((s) => s.gpa !== null) ?? others[0] ?? null;
}

// ── Sorting ───────────────────────────────────────────────────────────────────

export type SortKey =
  | 'subject'
  | 'code'
  | 'coefficient'
  | 'credits'
  | 'cc'
  | 'cf'
  | 'final'
  | 'status';

export type SortDir = 'asc' | 'desc';

export interface Sort {
  key: SortKey;
  dir: SortDir;
}

/** Subject names are bilingual; the active language decides which one sorts. */
export function subjectName(grade: GradeItem, lang: Lang): string {
  return lang === 'ar' ? grade.subject.nameAr : grade.subject.nameFr;
}

/** Worst first when ascending: validated, then failed, then not-yet-published. */
const STATUS_RANK: Record<RowStatus, number> = { validated: 0, failed: 1, pending: 2 };

/**
 * Sorts a copy of the rows.
 *
 * UNPUBLISHED VALUES ALWAYS SINK, in both directions. Treating them as 0 would
 * sort a student's unmarked subjects below her failures, and treating them as 20
 * would float them above her best result; either reading turns "not published"
 * into a mark, which is the one thing this screen must never do. So they leave
 * the ordered comparison entirely and are appended in their original order.
 */
export function sortGrades(
  grades: GradeItem[],
  sort: Sort,
  lang: Lang,
  published: Published
): GradeItem[] {
  const sign = sort.dir === 'asc' ? 1 : -1;

  const value = (grade: GradeItem): number | string | null => {
    switch (sort.key) {
      case 'subject':
        return subjectName(grade, lang);
      case 'code':
        return grade.subject.code;
      case 'coefficient':
        return grade.subject.coefficient;
      case 'credits':
        return grade.subject.credits;
      case 'status':
        return STATUS_RANK[rowStatus(grade, published)];
      default:
        return visibleMark(grade, sort.key, published);
    }
  };

  const ranked: GradeItem[] = [];
  const unranked: GradeItem[] = [];
  for (const grade of grades) {
    (value(grade) === null ? unranked : ranked).push(grade);
  }

  ranked.sort((a, b) => {
    const left = value(a);
    const right = value(b);
    if (typeof left === 'string' || typeof right === 'string') {
      return sign * String(left).localeCompare(String(right), lang);
    }
    return sign * (Number(left) - Number(right));
  });

  return [...ranked, ...unranked];
}
