import type { ScheduleEntry } from '@/lib/api-types';
import {
  addDays,
  calendarDaysBetween,
  isTeachingDay,
  minutesOf,
  startOfDay,
} from '@/lib/teaching-week';

/**
 * Finding the next class from a weekly timetable.
 *
 * The schedule is recurring, not dated: an entry says "Sunday at 08:00", so the
 * next occurrence has to be projected onto the calendar. What a weekday index
 * means, and which days teach at all, comes from lib/teaching-week — the same
 * module the schedule screen reads — so this card and that screen cannot place
 * the same entry on different days.
 */

export interface NextClass {
  entry: ScheduleEntry;
  /** Epoch ms of the next start. A deadline, never a duration — see below. */
  startsAt: number;
}

/**
 * The next occurrence of one entry at or after `now`.
 *
 * Built from a local Date rather than by adding milliseconds to midnight, so the
 * projection stays correct across a DST change — Djibouti does not observe one,
 * but a student travelling does, and "add 86400000" silently shifts the hour.
 *
 * An entry on a day the schedule screen does not draw is skipped: the card must
 * never announce a class the student cannot then find on the timetable.
 */
function nextOccurrence(entry: ScheduleEntry, now: number): number | null {
  const startMinutes = minutesOf(entry.startTime);
  if (startMinutes === null) return null;
  if (!isTeachingDay(entry.dayOfWeek)) return null;

  const today = startOfDay(new Date(now));
  const daysAhead = (entry.dayOfWeek - today.getDay() + 7) % 7;
  const day = addDays(today, daysAhead);

  const candidate = new Date(day.getFullYear(), day.getMonth(), day.getDate(), 0, startMinutes);

  // daysAhead is 0 for "today", which is in the past once the class has already
  // started. The same slot next week is then the next occurrence.
  if (candidate.getTime() < now) candidate.setDate(candidate.getDate() + 7);

  return candidate.getTime();
}

/**
 * The soonest upcoming class, or null when the timetable is empty.
 *
 * "Upcoming" means the next START. A class that is running right now has already
 * started, so the card points at the one after it — the pill answers "when do I
 * next have to be somewhere", and a countdown to a class the student is sitting
 * in answers nothing.
 */
export function findNextClass(entries: readonly ScheduleEntry[], now: number): NextClass | null {
  let best: NextClass | null = null;

  for (const entry of entries) {
    const startsAt = nextOccurrence(entry, now);
    if (startsAt === null) continue;
    if (best === null || startsAt < best.startsAt) best = { entry, startsAt };
  }

  return best;
}

/** How the countdown pill should be phrased, as a key plus its interpolations. */
export type CountdownParts =
  | { kind: 'now' }
  | { kind: 'minutes'; count: number }
  | { kind: 'today' }
  | { kind: 'days'; count: number };

/**
 * Chooses how the pill should phrase the wait.
 *
 * Takes a deadline and the current time rather than a countdown it decrements,
 * which is what §9 means by not drifting: a background tab throttles timers, so
 * a 60s interval can fire late, or not at all, and a decrementing counter would
 * be wrong by however long the tab was asleep. Re-reading the clock each tick
 * self-corrects — the tick is only a prompt to recompute, never the source of
 * the number.
 *
 *   under a minute   "now"
 *   under an hour    minutes — the one span where a live count is worth having
 *   later today      today, and the caller shows the start TIME, not a duration
 *   another day      CALENDAR days: 1 for tomorrow, whatever the hour
 *
 * The day count is a difference of dates, not elapsed time divided by 24h.
 * Dividing made Thursday afternoon to Sunday morning — two days nineteen hours —
 * read "in 2 days" for a class three days away.
 */
export function countdownParts(startsAt: number, now: number): CountdownParts {
  const totalMinutes = Math.floor((startsAt - now) / 60000);

  if (totalMinutes < 1) return { kind: 'now' };
  if (totalMinutes < 60) return { kind: 'minutes', count: totalMinutes };

  const days = calendarDaysBetween(new Date(now), new Date(startsAt));

  return days === 0 ? { kind: 'today' } : { kind: 'days', count: days };
}

/** Milliseconds until the next whole minute, so ticks land on the change. */
export function msToNextMinute(now: number): number {
  return 60000 - (now % 60000);
}
