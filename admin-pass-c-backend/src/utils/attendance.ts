import { AttendanceStatus } from '@prisma/client';

/**
 * Hours-based attendance math (architecture doc §4.3).
 *
 * Attendance percentage = (Σ attended hours / Σ session hours) × 100 where:
 *   PRESENT   → full session hours
 *   PARTIAL   → hoursAttended value
 *   JUSTIFIED → full session hours (a justified absence doesn't penalise)
 *   ABSENT    → 0
 *
 * "Full session hours" for a subject is derived from its ScheduleEntry
 * (start/end time). A subject can have several entries (CM / TD / TP on
 * different days), so we resolve by subject + weekday of the session date,
 * falling back to the subject's average entry duration, then to
 * DEFAULT_SESSION_HOURS when the subject has no schedule at all.
 *
 * Shared by the admin attendance overview and the student attendance/profile
 * routes so both compute the exact same percentage.
 */

// Fallback used only when a subject has no matching ScheduleEntry. The prototype
// models a standard 1.5h slot (implementation spec §30 · change 5).
export const DEFAULT_SESSION_HOURS = 1.5;

export interface ScheduleSlot {
  subjectId: string;
  dayOfWeek: number;
  startTime: string; // "HH:MM" 24h
  endTime: string; // "HH:MM" 24h
}

/** Minutes since midnight for a "HH:MM" 24h string. */
function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map((n) => parseInt(n, 10));
  return (Number.isFinite(h) ? h : 0) * 60 + (Number.isFinite(m) ? m : 0);
}

/** Duration of a slot in hours (2-dp); 0 for a malformed / non-positive slot. */
export function slotHours(startTime: string, endTime: string): number {
  const mins = toMinutes(endTime) - toMinutes(startTime);
  return mins > 0 ? Math.round((mins / 60) * 100) / 100 : 0;
}

/** Resolves the session length (hours) for a subject on a given calendar date. */
export type SessionHoursResolver = (subjectId: string, sessionDate: Date) => number;

/**
 * Builds a resolver from a set of schedule slots.
 *
 * Djibouti week: `Date.getUTCDay()` (0=Sun … 4=Thu) aligns with
 * `ScheduleEntry.dayOfWeek`. If the weekday lookup misses (e.g. timezone drift
 * on the stored session date), we fall back to the subject's average slot
 * length so the session length stays sensible.
 */
export function buildSessionHoursResolver(
  slots: ScheduleSlot[],
  fallback = DEFAULT_SESSION_HOURS
): SessionHoursResolver {
  const bySubjectDay = new Map<string, number>(); // `${subjectId}:${day}` -> hours
  const bySubject = new Map<string, number[]>(); // subjectId -> [hours, ...]

  for (const s of slots) {
    const hours = slotHours(s.startTime, s.endTime);
    if (hours <= 0) continue;
    bySubjectDay.set(`${s.subjectId}:${s.dayOfWeek}`, hours);
    const list = bySubject.get(s.subjectId) ?? [];
    list.push(hours);
    bySubject.set(s.subjectId, list);
  }

  return (subjectId, sessionDate) => {
    const day = sessionDate.getUTCDay();
    const exact = bySubjectDay.get(`${subjectId}:${day}`);
    if (exact != null) return exact;

    const list = bySubject.get(subjectId);
    if (list && list.length > 0) {
      return Math.round((list.reduce((a, b) => a + b, 0) / list.length) * 100) / 100;
    }
    return fallback;
  };
}

/** Hours counted toward attendance for one record, given its session length. */
export function attendedHours(
  status: AttendanceStatus,
  hoursAttended: number | null,
  sessionHours: number
): number {
  switch (status) {
    case AttendanceStatus.PRESENT:
    case AttendanceStatus.JUSTIFIED:
      return sessionHours;
    case AttendanceStatus.PARTIAL:
      return hoursAttended ?? 0;
    case AttendanceStatus.ABSENT:
    default:
      return 0;
  }
}

export interface AttendanceInput {
  subjectId: string;
  sessionDate: Date;
  status: AttendanceStatus;
  hoursAttended: number | null;
}

/**
 * Hours-based percentage for a set of records. Returns null when there are no
 * counted session hours (e.g. no records), matching the "no data" case the
 * screens render as a dash.
 */
export function hoursBasedPercentage(
  records: AttendanceInput[],
  resolveHours: SessionHoursResolver
): number | null {
  let attended = 0;
  let total = 0;
  for (const r of records) {
    const sessionHours = resolveHours(r.subjectId, r.sessionDate);
    total += sessionHours;
    attended += attendedHours(r.status, r.hoursAttended, sessionHours);
  }
  if (total <= 0) return null;
  return Math.round((attended / total) * 100);
}
