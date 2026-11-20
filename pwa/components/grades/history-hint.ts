import type { SemesterSummary } from '@/lib/api-types';

/**
 * Whether "Historique GPA" has anything to show: two or more semesters with a
 * published average. One point is not a history, and the card is not drawn.
 */
export function showsHistory(semesters: SemesterSummary[]): boolean {
  return semesters.filter((s) => s.gpa !== null).length >= 2;
}

/*
 * The first-load skeleton has to choose a layout before the semester list has
 * arrived: the hero beside the history card, or the hero alone and wider. This
 * remembers the answer from the last time the list loaded in this page session
 * — on the Notes screen itself, or on the dashboard, which fetches the same
 * list for its average card and is where most visits start.
 *
 * In memory only, never stored: it is derived from the student's grades, and
 * the PWA keeps grade data only in the consent-gated offline cache. Unknown (a
 * direct load of /grades) assumes the card shows, the prototype's layout.
 */
let known: boolean | null = null;

export function rememberHistory(semesters: SemesterSummary[]): void {
  known = showsHistory(semesters);
}

export function expectHistory(): boolean {
  return known ?? true;
}
