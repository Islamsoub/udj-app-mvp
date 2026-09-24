import type { TranslationKey } from '@/lib/i18n-types';

/**
 * PATCH /student/preferences, as backend/src/routes/student.ts validates it:
 *
 *   notifGrades, notifCourses, notifAttendance   boolean, optional
 *   quietHoursStart, quietHoursEnd              string matching /^\d{2}:\d{2}$/,
 *                                               or null, optional
 *
 * Any subset is a valid partial update; anything else is a 400 "Invalid
 * preferences". It answers 200 with all five fields as stored, which is what
 * this screen adopts afterwards — the server's copy, not the value it sent.
 *
 * THE BACKEND'S TIME CHECK IS FORMAT-ONLY. `\d{2}:\d{2}` accepts "99:99", and
 * the native app would then parse that into a range that never matches. The
 * control below cannot produce such a value, and `isValidTime` is the guard for
 * anything already stored that is.
 */

export type BooleanPref = 'notifGrades' | 'notifCourses' | 'notifAttendance';
export type TimePref = 'quietHoursStart' | 'quietHoursEnd';

/** The three toggles, in the order the native app's Settings shows them. The
 *  mapping to push categories is backend/src/utils/push.ts: GRADES, SCHEDULE,
 *  ATTENDANCE. News and general notices have no toggle and always arrive. */
export const BOOLEAN_PREFS: { key: BooleanPref; label: TranslationKey; hint: TranslationKey }[] = [
  { key: 'notifGrades', label: 'profile.notifs.grades', hint: 'profile.notifs.grades_hint' },
  { key: 'notifCourses', label: 'profile.notifs.courses', hint: 'profile.notifs.courses_hint' },
  {
    key: 'notifAttendance',
    label: 'profile.notifs.attendance',
    hint: 'profile.notifs.attendance_hint',
  },
];

/** A real 24-hour clock time, which the backend's regex does not check. */
export function isValidTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/**
 * The options for a quiet-hours select: every whole hour, as the native app's
 * picker offers — plus the stored value if it is a valid time that is not on
 * the hour, so a "22:30" set elsewhere is shown as itself rather than silently
 * rounded the next time the student touches the other field.
 */
export function timeOptions(current: string | null): string[] {
  const hours = Array.from({ length: 24 }, (_, h) => `${String(h).padStart(2, '0')}:00`);
  if (current !== null && isValidTime(current) && !hours.includes(current)) {
    return [...hours, current].sort();
  }
  return hours;
}
