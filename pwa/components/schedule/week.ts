import type { ScheduleEntry } from '@/lib/api-types';

/**
 * Weeks, days and block geometry. No React, no strings, no formatting.
 *
 * NO DATE LIBRARY. Everything here is a week offset, a weekday index or a
 * minutes-past-midnight arithmetic, which the built-in Date already does; the
 * only formatting that needs locale knowledge is the month name, and Intl does
 * that at the call site.
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

// ── Grid geometry ─────────────────────────────────────────────────────────────

/** One hour's height in the week grid. The only place the scale is decided. */
export const HOUR_PX = 64;

export interface TimeBounds {
  /** Minutes past midnight, floored to the hour. */
  startMin: number;
  /** Minutes past midnight, ceiled to the hour. */
  endMin: number;
}

/** Shown when the timetable is empty, so the grid still has a shape to draw. */
const FALLBACK_BOUNDS: TimeBounds = { startMin: 8 * 60, endMin: 18 * 60 };

/**
 * The hours the grid has to cover, taken from the entries themselves.
 *
 * A FIXED 08:00-18:00 GRID WOULD BE WRONG IN BOTH DIRECTIONS: it wastes a third
 * of the height on a programme that finishes at 16:00, and it silently clips a
 * class that runs to 19:00. Rounding out to whole hours keeps the hour rules
 * meaningful while still containing every block exactly.
 */
export function timeBounds(entries: readonly ScheduleEntry[]): TimeBounds {
  let earliest = Number.POSITIVE_INFINITY;
  let latest = Number.NEGATIVE_INFINITY;

  for (const entry of entries) {
    const start = minutesOf(entry.startTime);
    const end = minutesOf(entry.endTime);
    if (start === null || end === null || end <= start) continue;

    earliest = Math.min(earliest, start);
    latest = Math.max(latest, end);
  }

  if (!Number.isFinite(earliest) || !Number.isFinite(latest)) return FALLBACK_BOUNDS;

  return {
    startMin: Math.floor(earliest / 60) * 60,
    endMin: Math.ceil(latest / 60) * 60,
  };
}

/** Every whole hour the grid rules, as minutes past midnight. */
export function hourMarks(bounds: TimeBounds): number[] {
  const marks: number[] = [];
  for (let minute = bounds.startMin; minute <= bounds.endMin; minute += 60) marks.push(minute);
  return marks;
}

export interface BlockBox {
  /** Offset from the top of the grid, in px. */
  top: number;
  /** The block's own height, in px. */
  height: number;
}

/**
 * Where one entry sits in the grid, in pixels.
 *
 * PROPORTIONAL TO REAL MINUTES, which is the whole point: the timetable mixes
 * 90- and 120-minute slots and starts them on both the hour and the half-hour
 * (08:00-09:30 beside 08:00-10:00, 10:30-12:00). A row-per-hour grid cannot
 * express any of that — it would either round every class to an hour boundary or
 * draw two visibly different lengths at the same size.
 *
 * Returns null for a malformed or non-positive slot rather than a zero-height
 * box, so a bad row is left out instead of drawn as a sliver nobody can click.
 */
export function blockBox(entry: ScheduleEntry, bounds: TimeBounds): BlockBox | null {
  const start = minutesOf(entry.startTime);
  const end = minutesOf(entry.endTime);
  if (start === null || end === null || end <= start) return null;

  return {
    top: ((start - bounds.startMin) / 60) * HOUR_PX,
    height: ((end - start) / 60) * HOUR_PX,
  };
}

// ── Grouping ──────────────────────────────────────────────────────────────────

/** Entries for one weekday, earliest first. */
export function entriesForDay(
  entries: readonly ScheduleEntry[],
  day: number
): ScheduleEntry[] {
  return entries
    .filter((entry) => entry.dayOfWeek === day)
    .sort((a, b) => (minutesOf(a.startTime) ?? 0) - (minutesOf(b.startTime) ?? 0));
}

/**
 * The DATE the screen should open on — today when today teaches, otherwise the
 * next day that does.
 *
 * A DATE, NOT A WEEKDAY, and that is the whole point. Returning just "Sunday"
 * leaves the caller to pair it with a week, and the obvious pairing — the week
 * containing today — is wrong on exactly the days it matters: opened on a
 * Saturday it shows LAST Sunday, six days past, because Saturday belongs to the
 * week that has just finished. Resolving to a real date makes the week and the
 * day come from one decision, so they cannot disagree.
 *
 * A student opening this on a Friday wants Sunday's classes, not an empty Friday
 * explaining that Friday is a weekend. Falls back to today when the timetable
 * has nothing at all, so the screen always has a date to name.
 */
export function defaultFocus(entries: readonly ScheduleEntry[], today: Date): Date {
  for (let step = 0; step < 7; step += 1) {
    const candidate = addDays(today, step);
    const day = candidate.getDay();
    if (!isTeachingDay(day)) continue;
    if (entries.some((entry) => entry.dayOfWeek === day)) return candidate;
  }

  return startOfDay(today);
}
