/**
 * The GPA history's data: real published averages only.
 *
 * Every value here comes from the server (`/student/grades?allSemesters=true`).
 * Nothing is estimated, interpolated or padded: a student with one average has
 * no history to show, and the screen does not offer one (showsGpaHistory). This
 * is the PWA's rule (pwa/components/grades/GpaHistory.tsx and history-hint.ts).
 *
 * A semester whose average is not published yet stays in the list with a null
 * value: the chart draws no point for it and breaks the line there. Null means
 * "not published", never 0.
 *
 * Pure, with no React Native import, so tests/gpaHistory.test.ts can run it
 * under plain `node --test`.
 */

export interface GpaHistorySemester {
  label: string;
  academicYear: string;
  gpa: number | null;
}

export interface GPADataPoint {
  label: string;
  /** The published average, or null: not published, no point, a gap. */
  value: number | null;
}

/** Oldest first: by academic year, then by label (S1 before S2) — the PWA's order. */
function bySemester(a: GpaHistorySemester, b: GpaHistorySemester): number {
  return a.academicYear === b.academicYear
    ? a.label.localeCompare(b.label)
    : a.academicYear.localeCompare(b.academicYear);
}

/** Every semester, in order, each with its published average or null. */
export function gpaHistoryPoints(semesters: readonly GpaHistorySemester[]): GPADataPoint[] {
  return [...semesters].sort(bySemester).map((s) => ({ label: s.label, value: s.gpa }));
}

/** The history needs two published averages: one point is not a history. */
export function showsGpaHistory(semesters: readonly GpaHistorySemester[]): boolean {
  return semesters.filter((s) => s.gpa !== null).length >= 2;
}

/**
 * The runs of consecutive published points, as indexes into `points`. The line
 * (and its area fill) is drawn per run, so it never crosses an unpublished
 * semester. A run of one is a lone dot.
 */
export function publishedRuns(points: readonly GPADataPoint[]): number[][] {
  const runs: number[][] = [];
  let run: number[] = [];
  points.forEach((p, i) => {
    if (p.value === null) {
      if (run.length > 0) runs.push(run);
      run = [];
    } else {
      run.push(i);
    }
  });
  if (run.length > 0) runs.push(run);
  return runs;
}
