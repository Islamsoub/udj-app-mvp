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

/**
 * Where the chart draws, in PHYSICAL pixels from the chart's left edge.
 *
 * An SVG coordinate is physical: it never follows the layout direction on its
 * own, while a flex row does (forceRTL mirrors it). Mixing the two put Arabic
 * labels under the wrong points. So the points, their labels and the y-axis
 * gutter all come from here, and the sheet places every one of them in a
 * `direction: 'ltr'` box, where nothing is flipped behind its back.
 *
 * Semesters run oldest to newest in the reading direction: left to right in
 * French, right to left in Arabic (the PWA's GpaHistory rule). The y-axis gutter
 * (`padStart`) is on the reading side too: left in French, right in Arabic.
 */
export interface GpaChartFrame {
  /** The chart's measured width. */
  width: number;
  /** The gutter on the reading-start side (the y-axis labels). */
  padStart: number;
  /** The gutter on the reading-end side. */
  padEnd: number;
  rtl: boolean;
}

export interface GpaChartLayout {
  /** The plot band's physical edges: grid lines run between them. */
  plotLeft: number;
  plotRight: number;
  /** Per semester, in data order (oldest first). */
  slots: { x: number; labelLeft: number }[];
}

/**
 * Each semester's x: its point is drawn at `x`, and its label, `labelWidth`
 * wide with centred text, starts at `labelLeft`, so the label's centre is the
 * point. Evenly spaced with the ends on the plot's edges; a single semester sits
 * in the middle.
 */
export function gpaChartLayout(
  count: number,
  frame: GpaChartFrame,
  labelWidth: number
): GpaChartLayout {
  const { width, padStart, padEnd, rtl } = frame;
  const plotLeft = rtl ? padEnd : padStart;
  const plotRight = width - (rtl ? padStart : padEnd);
  const inner = Math.max(plotRight - plotLeft, 0);

  const slots = Array.from({ length: count }, (_, i) => {
    const t = count <= 1 ? 0.5 : i / (count - 1);
    const x = rtl ? plotRight - t * inner : plotLeft + t * inner;
    return { x, labelLeft: x - labelWidth / 2 };
  });
  return { plotLeft, plotRight, slots };
}
