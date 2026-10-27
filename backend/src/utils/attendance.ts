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

/** Attended and held hours for a set of records. */
export interface HoursTotals {
  attendedHours: number;
  heldHours: number;
}

export function sumAttendanceHours(
  records: AttendanceInput[],
  resolveHours: SessionHoursResolver
): HoursTotals {
  let attended = 0;
  let held = 0;
  for (const r of records) {
    const sessionHours = resolveHours(r.subjectId, r.sessionDate);
    held += sessionHours;
    attended += attendedHours(r.status, r.hoursAttended, sessionHours);
  }
  return { attendedHours: attended, heldHours: held };
}

/**
 * Absorbs float error before a floor: hours are 2-dp decimals and PARTIAL
 * hoursAttended is a float, so e.g. 0.29 × 100 = 28.999999999999996 would
 * otherwise floor to 28.
 */
const FLOOR_EPSILON = 1e-9;

/**
 * The attendance rate as a whole number, TRUNCATED (not rounded).
 *
 * This one value is what the student sees, what the band is computed from and
 * what any attendance notification must quote. Truncating keeps them in step
 * with Design's template ("74.6 must show 74") and is the honest direction at a
 * threshold: 74.6 shown as 75 would tell a student they are safe when they are
 * not. Returns null when no hours were held (the "no data" dash).
 */
export function truncatedPercentage({ attendedHours: a, heldHours: h }: HoursTotals): number | null {
  if (h <= 0) return null;
  return Math.floor((a * 100) / h + FLOOR_EPSILON);
}

/**
 * Hours-based percentage for a set of records, truncated — see
 * truncatedPercentage. Shared by the student and admin routes so every surface
 * reports the same figure.
 */
export function hoursBasedPercentage(
  records: AttendanceInput[],
  resolveHours: SessionHoursResolver
): number | null {
  return truncatedPercentage(sumAttendanceHours(records, resolveHours));
}

/**
 * Longest scheduled slot (hours) per subject. A subject with no usable slot is
 * absent from the map; callers fall back to DEFAULT_SESSION_HOURS, the same
 * fallback the session-hours resolver uses.
 */
export function longestSlotBySubject(slots: ScheduleSlot[]): Map<string, number> {
  const out = new Map<string, number>();
  for (const s of slots) {
    const hours = slotHours(s.startTime, s.endTime);
    if (hours <= 0) continue;
    out.set(s.subjectId, Math.max(out.get(s.subjectId) ?? 0, hours));
  }
  return out;
}

// ── Recoverability (Design option 2) ─────────────────────────────────────────

/** A schedule slot with its validity window, for counting future occurrences. */
export interface DatedScheduleSlot extends ScheduleSlot {
  effectiveDate: Date;
  expiryDate: Date | null;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * UTC calendar day number (days since 1970-01-01). The same day convention the
 * session-hours resolver uses (`getUTCDay()` on sessionDate), so a session and
 * a slot occurrence are compared on the same calendar.
 */
function utcDayNumber(d: Date): number {
  return Math.floor(d.getTime() / DAY_MS);
}

/**
 * Whether the semester is over: its end date (inclusive) is a UTC day before
 * `now`'s UTC day. An ended semester has no remaining hours, so the
 * recoverability test reduces to rate < T.
 *
 * `now` is a parameter so this stays pure. It is the ONLY clock-dependent
 * input to the band: the held/remaining boundary is the latest recorded
 * session, never today. Without this check an ended term whose last registers
 * are late would keep reporting hours to come, and no student could reach
 * "below" at exactly the point the band matters most.
 */
export function semesterHasEnded(semesterEnd: Date, now: Date): boolean {
  return utcDayNumber(semesterEnd) < utcDayNumber(now);
}

/** How many days in [from, to] (inclusive day numbers) fall on `dayOfWeek` (0=Sun). */
function countWeekday(from: number, to: number, dayOfWeek: number): number {
  if (to < from) return 0;
  const fromDow = (from + 4) % 7; // day 0 (1970-01-01) was a Thursday
  const first = from + ((dayOfWeek - fromDow + 7) % 7);
  return first > to ? 0 : Math.floor((to - first) / 7) + 1;
}

/**
 * Timetable hours still to come for one subject: every occurrence of its slots
 * on a day STRICTLY AFTER `lastRecordedSession` and up to `semesterEnd`
 * inclusive, honouring each slot's effectiveDate / expiryDate.
 *
 * THE BOUNDARY IS THE SUBJECT'S LATEST RECORDED SESSION, NOT TODAY.
 * Held hours are the subject's records, all dated on or before that day;
 * remaining hours start the day after it. The two sets cannot overlap, by
 * construction, whatever the clock or timezone says. Reading "today" instead
 * would need a timezone (Djibouti vs the server's UTC), would double-count a
 * record dated after today, and would silently drop every past slot whose
 * register has not been entered yet — counting it neither held nor remaining,
 * which pushes a student towards "below" just because the register is late.
 *
 * Days are UTC calendar days of the stored dates (sessionDate, semester
 * endDate, slot windows), matching the resolver. A second slot on the same day
 * as the latest record but left unrecorded counts in neither set: it
 * under-counts remaining, which can only make the band stricter.
 */
export function remainingScheduledHours(
  slots: DatedScheduleSlot[],
  lastRecordedSession: Date,
  semesterEnd: Date
): number {
  const from = utcDayNumber(lastRecordedSession) + 1;
  const to = utcDayNumber(semesterEnd);
  let hours = 0;
  for (const s of slots) {
    const len = slotHours(s.startTime, s.endTime);
    if (len <= 0) continue;
    const lo = Math.max(from, utcDayNumber(s.effectiveDate));
    const hi = s.expiryDate ? Math.min(to, utcDayNumber(s.expiryDate)) : to;
    hours += len * countWeekday(lo, hi, s.dayOfWeek);
  }
  return hours;
}

/** Snaps float noise (e.g. 1e-15) to the nearest micro-hour so sign tests are exact. */
function snapHours(h: number): number {
  return Math.round(h * 1e6) / 1e6;
}

export interface AttendanceRecovery {
  /**
   * Hours the student could still miss and finish at or above T, assuming
   * everything else is attended. Negative once T is out of reach.
   */
  hoursLeft: number;
  /**
   * hoursLeft as whole sessions, never negative. Null once the semester has
   * ended (no sessions remain, so there is nothing left to spend) or without a
   * slot length. Null is not 0: a client must not print "0 absences restantes"
   * at the end of term.
   */
  absencesLeft: number | null;
}

/**
 * Recoverability test — counts the same hours as the rate (held, from the
 * timetable) plus the timetable hours still to come.
 *
 *   bestCase  = (attendedH + remainingH) / (heldH + remainingH) × 100
 *   hoursLeft = attendedH + remainingH − T/100 × (heldH + remainingH)
 *
 * hoursLeft < 0 is the same test as bestCase < T. With remainingH = 0 it
 * reduces to attended/held < T, which for an integer T agrees with the
 * truncated rate the student sees.
 *
 * Sessions = hoursLeft / the LONGEST slot. Design said "standard session
 * length"; the longest slot under-reports, which is the safe direction for a
 * warning: missing any N sessions, whatever their lengths, stays recoverable.
 *
 * `semesterOver` (see semesterHasEnded): remaining hours are 0, so the test is
 * the plain rate < T, and absencesLeft is null — no sessions remain, so there
 * is nothing left to spend. That also keeps the W clause out of the band.
 */
export function attendanceRecovery(
  { attendedHours, heldHours }: HoursTotals,
  remainingHours: number,
  threshold: number,
  longestSlotHours: number,
  semesterOver: boolean
): AttendanceRecovery {
  const remaining = semesterOver ? 0 : remainingHours;
  const hoursLeft = snapHours(
    attendedHours + remaining - (threshold / 100) * (heldHours + remaining)
  );
  const absencesLeft =
    !semesterOver && longestSlotHours > 0
      ? Math.max(0, Math.floor(hoursLeft / longestSlotHours + FLOOR_EPSILON))
      : null;
  return { hoursLeft, absencesLeft };
}

export type AttendanceBand = 'below' | 'near' | 'ok';

export interface AttendanceBandRules {
  threshold: number;
  warnMargin: number;
  warnAbsences: number;
}

/**
 * The attendance band — computed once, here, so the native app and the PWA
 * only map it to a colour and cannot disagree.
 *
 *   below  if hoursLeft < 0  — T is out of reach even with perfect attendance
 *                              from here. Under T but recoverable is "near".
 *   near   if rate < T + M, or absencesLeft ≤ W
 *   ok     otherwise
 *
 * rate null means no hours held yet (the "—" case): "ok", per Design.
 * `rate` must be the truncated percentage the student sees.
 */
export function attendanceBand(
  rate: number | null,
  { hoursLeft, absencesLeft }: AttendanceRecovery,
  { threshold, warnMargin, warnAbsences }: AttendanceBandRules
): AttendanceBand {
  if (rate == null) return 'ok';
  if (hoursLeft < 0) return 'below';
  if (rate < threshold + warnMargin) return 'near';
  if (absencesLeft != null && absencesLeft <= warnAbsences) return 'near';
  return 'ok';
}

// ── Justification deadline (Pass C §4.4) ──────────────────────────────────────

/**
 * Fallback when SystemSettings has not been seeded. Matches the Prisma default
 * on `SystemSettings.justificationDeadlineDays`, so a missing row behaves like a
 * default one rather than like no deadline at all.
 */
export const DEFAULT_JUSTIFICATION_DEADLINE_DAYS = 8;

/**
 * Minimum attendance percentage, as a whole number out of 100.
 *
 * Matches the Prisma default on `SystemSettings.attendanceThreshold` and the
 * `?? 75` the two admin routes already fall back to; naming it here means the
 * three places that need it stop repeating a literal.
 *
 * NOT A NEW RULE AND NOT A NEW VALUE — the threshold is still whatever the
 * settings row says, and this is only what to use when that row is missing.
 */
export const DEFAULT_ATTENDANCE_THRESHOLD = 75;

/** Matches the Prisma default on `SystemSettings.attendanceWarnMargin`. */
export const DEFAULT_ATTENDANCE_WARN_MARGIN = 10;

/** Matches the Prisma default on `SystemSettings.attendanceWarnAbsences`. */
export const DEFAULT_ATTENDANCE_WARN_ABSENCES = 2;

/**
 * The instant after which a justification for `sessionDate` is refused.
 *
 * EXTRACTED SO THE TWO CALLERS CANNOT DISAGREE. The POST handler enforces this
 * deadline and the GET handler now reports whether it has passed; if each did
 * its own date arithmetic, a client could be told a record is still submittable
 * and then be refused by the very next request. One function, both callers.
 *
 * Deliberately the same millisecond arithmetic the POST handler has always
 * used — `getTime() + days * 86_400_000` — rather than a calendar-aware
 * addition. Switching to calendar days would move the boundary across a DST
 * change and would be a behaviour change, not a refactor; this is additive work
 * and the existing rule is left exactly as it was.
 */
export function justificationDeadline(sessionDate: Date, deadlineDays: number): Date {
  return new Date(sessionDate.getTime() + deadlineDays * 24 * 60 * 60 * 1000);
}

/**
 * Whether a student may still upload a justification for one record.
 *
 * Both conditions the POST handler applies, in the same order: the record has to
 * be an absence, and it has to be inside the window. A JUSTIFIED record is
 * already excused and a PRESENT one was never missed, so neither is submittable
 * — which is what the POST's 409 says.
 *
 * `now` is injectable so this stays a pure function and can be reasoned about
 * without freezing the clock.
 */
export function canSubmitJustification(
  status: AttendanceStatus,
  sessionDate: Date,
  deadlineDays: number,
  now: Date = new Date()
): boolean {
  if (status !== AttendanceStatus.ABSENT) return false;
  return now <= justificationDeadline(sessionDate, deadlineDays);
}
