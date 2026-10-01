import type { ScheduleEntry } from '@/lib/api-types';
import {
  addDays,
  isTeachingDay,
  minutesOf,
  startOfDay,
} from '@/lib/teaching-week';

/**
 * Block geometry and the schedule screen's own grouping. No React, no strings,
 * no formatting.
 *
 * The calendar arithmetic — which weekday is which, what date a weekday falls
 * on — is NOT here: it lives in lib/teaching-week, shared with the dashboard's
 * next-class card so the two cannot answer the question differently.
 */

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
