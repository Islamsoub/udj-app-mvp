/**
 * The teaching week and the calendar arithmetic around it. No React, no strings.
 *
 * ONE PLACE, because "which day is this" was being answered twice — once by the
 * schedule screen and once by the dashboard's next-class card — and two answers
 * to that question is how two screens come to disagree about the same timetable.
 * Everything that maps a stored weekday or an "HH:MM" onto the calendar lives
 * here; the schedule's grid geometry stays in components/schedule/week.ts.
 *
 * NO DATE LIBRARY. Everything here is a weekday index, a day offset or a
 * minutes-past-midnight arithmetic, which the built-in Date already does.
 */

/**
 * The teaching week, as weekday indices.
 *
 * `dayOfWeek` IS the JavaScript weekday index. backend/src/utils/attendance.ts
 * says so outright — "Djibouti week: Date.getUTCDay() (0=Sun … 4=Thu) aligns
 * with ScheduleEntry.dayOfWeek" — and looks slots up by `getUTCDay()`, so 0 is
 * SUNDAY, not Monday. Friday and Saturday are the Djibouti weekend and carry no
 * entries, which is why the array stops at 4.
 *
 * Hard-coded rather than derived from the entries on screen: a week in which
 * nothing happens to fall on Sunday would otherwise lose its column, and the
 * grid would change shape as the student paged through the term.
 */
export const TEACHING_DAYS = [0, 1, 2, 3, 4] as const;

export type TeachingDay = (typeof TEACHING_DAYS)[number];

export function isTeachingDay(day: number): day is TeachingDay {
  return TEACHING_DAYS.includes(day as TeachingDay);
}

// ── Times ─────────────────────────────────────────────────────────────────────

/** Minutes past midnight for an "HH:MM" string, or null if it is malformed. */
export function minutesOf(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/** "08:00", from minutes past midnight. Always two digits, always 24h. */
export function formatTime(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

// ── Dates ─────────────────────────────────────────────────────────────────────

/** Local midnight, so two dates compare by calendar day and not by instant. */
export function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/**
 * Built by constructing a new local Date rather than by adding milliseconds, so
 * the result stays correct across a DST change. Djibouti does not observe one,
 * but a student travelling does, and "add 86400000" silently shifts the hour.
 */
export function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/**
 * The Sunday that opens the teaching week containing `date`.
 *
 * `getDay()` is already the same index the timetable is stored in, so the number
 * of days back to the start of the week is simply that index — no +1/-1 fudge,
 * which is exactly the fudge a Monday-based week would have needed.
 */
export function startOfWeek(date: Date): Date {
  return addDays(startOfDay(date), -date.getDay());
}

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** The calendar date a weekday index falls on within a given week. */
export function dateForDay(weekStart: Date, day: number): Date {
  return addDays(weekStart, day);
}

/**
 * How many CALENDAR days lie between two dates — 0 for the same day, 1 for
 * tomorrow — whatever the hour on either side.
 *
 * Not `(to - from) / 86400000`, floored: that counts elapsed 24-hour periods,
 * and Thursday afternoon to Sunday morning is two of those and a bit, which is
 * how a class three days away came to be announced as "in 2 days". Counted
 * between the two local midnights instead, through Date.UTC so a DST change in
 * between cannot stretch or shrink a day.
 */
export function calendarDaysBetween(from: Date, to: Date): number {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / 86400000);
}
