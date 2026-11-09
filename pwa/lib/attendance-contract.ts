import type { AttendanceBand, AttendanceResponse } from './api-types';

/**
 * The contract check for GET /student/attendance.
 *
 * It lives in lib/ rather than beside the attendance components because lib/
 * must not import from components/, and the check belongs with the API layer
 * that receives the response.
 */

const BANDS: readonly AttendanceBand[] = ['ok', 'near', 'below'];

function isBand(v: unknown): v is AttendanceBand {
  return typeof v === 'string' && (BANDS as readonly string[]).includes(v);
}

/** Present, and either a non-negative integer or null (semester ended). */
function isAbsencesLeft(v: unknown): v is number | null {
  return v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0);
}

/**
 * Throws when a response lacks the rules or the verdict the attendance UI is
 * built on.
 *
 * NO LOCAL FALLBACK, deliberately. A default threshold here would be exactly the
 * hardcoded 75 this replaced, silently disagreeing with the admin portal the day
 * the setting moves; a missing `canSubmitJustification` read as falsy would mark
 * every absence expired. The same goes for `band` and `absencesLeft`: they are
 * computed once, on the server, so the PWA never derives a band from
 * `percentage` and the threshold. A response without these fields means the PWA
 * is talking to a backend older than 15ecfe7 (rules) or 7c929ec (band), a
 * deployment bug, so the missing fields are logged by name and the caller shows
 * its error state rather than guessing.
 *
 * `overall.band` / `overall.absencesLeft` are checked only when `overall` is
 * not null: with no current semester there is no overall figure to carry them.
 */
export function checkAttendanceContract(data: AttendanceResponse): AttendanceResponse {
  const missing: string[] = [];

  if (typeof data.attendanceThreshold !== 'number') missing.push('attendanceThreshold');
  if (typeof data.justificationDeadlineDays !== 'number') {
    missing.push('justificationDeadlineDays');
  }
  if (data.overall !== null) {
    if (!isBand(data.overall.band)) missing.push('overall.band');
    if (!isAbsencesLeft(data.overall.absencesLeft)) missing.push('overall.absencesLeft');
  }
  if (!data.subjects.every((s) => isBand(s.band))) missing.push('subjects[].band');
  if (!data.subjects.every((s) => isAbsencesLeft(s.absencesLeft))) {
    missing.push('subjects[].absencesLeft');
  }
  const recordsOk = data.subjects.every((entry) =>
    entry.absences.every((a) => typeof a.canSubmitJustification === 'boolean')
  );
  if (!recordsOk) missing.push('absences[].canSubmitJustification');

  if (missing.length > 0) {
    const message = `GET /student/attendance is missing ${missing.join(', ')}`;
    console.error(`[attendance] ${message}`);
    throw new Error(message);
  }

  return data;
}
