import type { ScheduleEntry } from '@/lib/api-types';

/**
 * Finding the next class from a weekly timetable.
 *
 * The schedule is recurring, not dated: an entry says "Sunday at 08:00", so the
 * next occurrence has to be projected onto the calendar. `dayOfWeek` is 0-6 with
 * 0 = Sunday, matching Date.getDay() (and DAYS_LONG_FR in the native app's
 * utils/dateFormat.ts, which starts at 'Dimanche').
 */

export interface NextClass {
  entry: ScheduleEntry;
  /** Epoch ms of the next start. A deadline, never a duration — see below. */
  startsAt: number;
}

/** Minutes past midnight for an "HH:MM" string, or null if it is malformed. */
function minutesOf(time: string): number | null {
  const match = /^(\d{1,2}):(\d{2})$/.exec(time.trim());
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours > 23 || minutes > 59) return null;

  return hours * 60 + minutes;
}

/**
 * The next occurrence of one entry at or after `now`.
 *
 * Built from a local Date rather than by adding milliseconds to midnight, so the
 * projection stays correct across a DST change — Djibouti does not observe one,
 * but a student travelling does, and "add 86400000" silently shifts the hour.
 */
function nextOccurrence(entry: ScheduleEntry, now: number): number | null {
  const startMinutes = minutesOf(entry.startTime);
  if (startMinutes === null) return null;
  if (!Number.isInteger(entry.dayOfWeek) || entry.dayOfWeek < 0 || entry.dayOfWeek > 6) return null;

  const reference = new Date(now);
  const daysAhead = (entry.dayOfWeek - reference.getDay() + 7) % 7;

  const candidate = new Date(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate() + daysAhead,
    0,
    startMinutes
  );

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
  | { kind: 'hours'; hours: number }
  | { kind: 'hoursMinutes'; hours: number; minutes: number }
  | { kind: 'days'; count: number };

/**
 * Splits the remaining time into the shape the copy needs.
 *
 * Takes a deadline and the current time rather than a countdown it decrements,
 * which is what §9 means by not drifting: a background tab throttles timers, so
 * a 60s interval can fire late, or not at all, and a decrementing counter would
 * be wrong by however long the tab was asleep. Re-reading the clock each tick
 * self-corrects — the tick is only a prompt to recompute, never the source of
 * the number.
 */
export function countdownParts(startsAt: number, now: number): CountdownParts {
  const totalMinutes = Math.floor((startsAt - now) / 60000);

  if (totalMinutes < 1) return { kind: 'now' };
  if (totalMinutes < 60) return { kind: 'minutes', count: totalMinutes };

  const totalHours = Math.floor(totalMinutes / 60);

  if (totalHours < 24) {
    const minutes = totalMinutes % 60;
    return minutes === 0
      ? { kind: 'hours', hours: totalHours }
      : { kind: 'hoursMinutes', hours: totalHours, minutes };
  }

  return { kind: 'days', count: Math.floor(totalHours / 24) };
}

/** Milliseconds until the next whole minute, so ticks land on the change. */
export function msToNextMinute(now: number): number {
  return 60000 - (now % 60000);
}
