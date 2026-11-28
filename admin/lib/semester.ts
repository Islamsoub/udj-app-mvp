import type { Semester } from './types';

/**
 * Calendar days in Djibouti, as backend/src/utils/currentSemester.ts reads
 * them. A stored date may be 00:00 UTC (seed) or 21:00 UTC the day before (the
 * portal's date picker); both are the intended day in Djibouti, so dates are
 * compared as Djibouti days, never as instants.
 */
const DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Africa/Djibouti',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

const djiboutiDay = (d: string | Date) => DAY.format(new Date(d));

/**
 * True when the semester's last day is behind us.
 *
 * Between two semesters the backend keeps using the most recent one as "the
 * current semester" (rule 2 in currentSemester.ts), so timetables and grades
 * still have something to show. That is right for students, but the portal
 * labelled such a semester "En cours" long after it ended — S2 2024-2025 was
 * still "En cours" in November 2026, and nothing told the admin a new semester
 * was missing. This lets the portal say so.
 */
export function semesterHasEnded(s: Pick<Semester, 'endDate'>, now: Date = new Date()): boolean {
  return djiboutiDay(now) > djiboutiDay(s.endDate);
}
