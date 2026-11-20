import type { PrismaClient, Semester } from '@prisma/client';

/**
 * THE CURRENT SEMESTER — decided by the calendar, and only here.
 *
 * Every backend read of "the current semester" goes through
 * resolveCurrentSemester. Nothing else in src/ may decide it, and nothing may
 * read the `is_current` column to decide it: that column was a manual switch,
 * set by hand in the admin portal, and it is kept in the schema only so no
 * migration or `db push` is needed. It is no longer written or read for this.
 * Every API response that carries a semester's `isCurrent` carries the value
 * computed here instead (withComputedCurrent), so the clients keep reading the
 * same field.
 *
 * THE RULE, in order:
 *   1. The semester whose start date <= today <= end date.
 *   2. None (a break between semesters): the most recent one that has started.
 *   3. None has started yet: the earliest upcoming one.
 *   4. Several match rule 1 (overlapping dates): the one that started most
 *      recently. The database has no constraint against overlaps, and the admin
 *      portal only warns about one, so this case is reachable.
 * Ties on the start date (two semesters starting the same day) go to the later
 * end date, then the id, so the answer never depends on row order.
 *
 * DAYS, IN DJIBOUTI. "Today" and both dates are calendar days in
 * Africa/Djibouti (UTC+3, no daylight saving), and the end date is inclusive:
 * a semester ending on 31 January is current until midnight in Djibouti, not
 * until 03:00 the next morning, which is what comparing UTC instants would give.
 * The stored dates are read as Djibouti days too. The seed writes them at
 * 00:00 UTC and the admin portal's date picker at local midnight (21:00 UTC the
 * day before, from Djibouti); both are the intended day in Djibouti.
 */

export const ACADEMIC_TIME_ZONE = 'Africa/Djibouti';

/** en-CA formats as YYYY-MM-DD, which compares correctly as a string. */
const DAY = new Intl.DateTimeFormat('en-CA', {
  timeZone: ACADEMIC_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

/** The calendar day an instant falls on in Djibouti, as "YYYY-MM-DD". */
export function djiboutiDay(instant: Date): string {
  return DAY.format(instant);
}

export interface DatedSemester {
  id: string;
  startDate: Date;
  endDate: Date;
}

/** Most recent start first; then later end, then id, for a stable answer. */
function latestStartFirst(a: DatedSemester, b: DatedSemester): number {
  return (
    b.startDate.getTime() - a.startDate.getTime() ||
    b.endDate.getTime() - a.endDate.getTime() ||
    (a.id < b.id ? 1 : a.id > b.id ? -1 : 0)
  );
}

/** The rule above, on semesters already loaded. Pure: `now` is a parameter. */
export function pickCurrentSemester<T extends DatedSemester>(semesters: readonly T[], now: Date): T | null {
  const today = djiboutiDay(now);

  const started = semesters.filter((s) => djiboutiDay(s.startDate) <= today).sort(latestStartFirst);

  // 1 and 4: in progress today, the most recently started first.
  const inProgress = started.find((s) => today <= djiboutiDay(s.endDate));
  if (inProgress) return inProgress;

  // 2: a break — the most recent one that has started.
  if (started.length > 0) return started[0];

  // 3: nothing has started — the earliest upcoming one.
  const upcoming = [...semesters].sort((a, b) => -latestStartFirst(a, b));
  return upcoming[0] ?? null;
}

/**
 * The current semester, from the database. The semesters table is a handful of
 * rows (two per academic year), so all of them are read and the rule is applied
 * here rather than in SQL, where "today in Djibouti" and the fallbacks would be
 * much harder to read and to test.
 */
export async function resolveCurrentSemester(
  db: Pick<PrismaClient, 'semester'>,
  now: Date = new Date()
): Promise<Semester | null> {
  const semesters = await db.semester.findMany();
  return pickCurrentSemester(semesters, now);
}

/**
 * The semesters with `isCurrent` set to the computed answer, for every response
 * that returns semester rows. The whole table must be passed: "current" is a
 * property of the set, not of one row.
 */
export function withComputedCurrent<T extends DatedSemester & { isCurrent: boolean }>(
  semesters: readonly T[],
  now: Date = new Date()
): T[] {
  const current = pickCurrentSemester(semesters, now);
  return semesters.map((s) => ({ ...s, isCurrent: s.id === current?.id }));
}
