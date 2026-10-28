import type { AttendanceApiResponse, AttendanceBand } from '@/services/api';

const BANDS: readonly AttendanceBand[] = ['ok', 'near', 'below'];

function isBand(v: unknown): v is AttendanceBand {
  return typeof v === 'string' && (BANDS as readonly string[]).includes(v);
}

/** absencesLeft must be present: a non-negative integer, or null (semester ended). */
function isAbsencesLeft(v: unknown): v is number | null {
  return v === null || (typeof v === 'number' && Number.isInteger(v) && v >= 0);
}

/**
 * Throws when GET /student/attendance lacks the verdict this screen is built on.
 *
 * NO LOCAL FALLBACK, deliberately — the same rule as the PWA
 * (pwa/components/attendance/model.ts). The band is computed once, on the
 * server, so the phone and the web cannot disagree about the same student. A
 * locally computed band here would be exactly the hardcoded 0.85 this
 * replaced. A response without these fields means the app is talking to a
 * backend older than 7c929ec — a deployment bug — so the missing fields are
 * logged by name and the fetch fails. Call this BEFORE writing anything to
 * SQLite, so a bad response never overwrites the last good cache.
 */
export function checkAttendanceContract(data: AttendanceApiResponse): AttendanceApiResponse {
  const missing: string[] = [];

  if (typeof data.attendanceThreshold !== 'number') missing.push('attendanceThreshold');
  if (data.overall !== null) {
    if (!isBand(data.overall.band)) missing.push('overall.band');
    if (!isAbsencesLeft(data.overall.absencesLeft)) missing.push('overall.absencesLeft');
  }
  if (!data.subjects.every((s) => isBand(s.band))) missing.push('subjects[].band');
  if (!data.subjects.every((s) => isAbsencesLeft(s.absencesLeft))) {
    missing.push('subjects[].absencesLeft');
  }

  if (missing.length > 0) {
    const message = `GET /student/attendance is missing ${missing.join(', ')}`;
    console.error(`[attendance] ${message}`);
    throw new Error(message);
  }
  return data;
}
