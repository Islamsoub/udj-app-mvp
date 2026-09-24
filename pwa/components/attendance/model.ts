import type { AbsenceRecord, AttendanceResponse, AttendanceSubject } from '@/lib/api-types';

/**
 * The attendance rules — the threshold and the justification window — are NOT
 * defined here. Both are admin-editable on the server and arrive on every
 * GET /student/attendance response; `checkAttendanceContract` below refuses a
 * response that lacks them rather than substituting a local value.
 */

/**
 * Which of the justification panel's sub-states a record is in.
 *
 * Mutually exclusive SERVER states, not something the student toggles — which is
 * why §9 has the panel route straight to one of them with no transition between.
 *
 * `expired` is §9's upload-form state with the server's `canSubmitJustification`
 * verdict against it: nothing was filed and the window has closed, so the panel
 * explains that instead of offering a form the POST is certain to refuse.
 */
export type JustificationState = 'none' | 'expired' | 'pending' | 'approved' | 'rejected';

/**
 * Reads the sub-state off a record.
 *
 * THE AWKWARD CASE IS `JUSTIFIED` WITH NO `justificationStatus`, and it is not
 * hypothetical — every justified absence in the database today looks like that.
 * It means the absence was excused at source (a lecturer or the registrar marked
 * the session JUSTIFIED) rather than through a request the student filed:
 * PATCH /admin/attendance/:id/justification refuses to approve without a
 * document, so a genuine APPROVED always carries one.
 *
 * It routes to `approved` because that is what it is — the absence does not
 * count against the student, and there is nothing to upload. What it must NOT
 * do is route to `none`, which would offer to justify an absence that is already
 * excused, or claim a review that never happened; the approved body says which
 * of the two it is looking at by whether a document is attached.
 */
export function justificationState(record: AbsenceRecord): JustificationState {
  switch (record.justificationStatus) {
    case 'PENDING':
      return 'pending';
    case 'APPROVED':
      return 'approved';
    case 'REJECTED':
      return 'rejected';
    default:
      if (record.status === 'JUSTIFIED') return 'approved';
      return record.canSubmitJustification ? 'none' : 'expired';
  }
}

/**
 * "Is this one still on the student's plate?"
 *
 * Nothing filed yet, or filed and turned down — AND the server still accepts a
 * submission for it. Pending is off the list because the student has already
 * done their part, approved because it is settled, and anything past its window
 * because there is nothing left the student can do in the app; its panel says so
 * and points to the faculty.
 */
export function needsAction(record: AbsenceRecord): boolean {
  const state = justificationState(record);
  return (state === 'none' || state === 'rejected') && record.canSubmitJustification;
}

/**
 * Throws when a response lacks the rules this screen is built on.
 *
 * NO LOCAL FALLBACK, deliberately. A default threshold here would be exactly the
 * hardcoded 75 this replaced, silently disagreeing with the admin portal the day
 * the setting moves; a missing `canSubmitJustification` read as falsy would mark
 * every absence expired. A response without these fields means the PWA is
 * talking to a backend older than 15ecfe7 — a deployment bug — so it is logged
 * by name and the screen shows its error state rather than guessing.
 */
export function checkAttendanceContract(data: AttendanceResponse): AttendanceResponse {
  const missing: string[] = [];

  if (typeof data.attendanceThreshold !== 'number') missing.push('attendanceThreshold');
  if (typeof data.justificationDeadlineDays !== 'number') {
    missing.push('justificationDeadlineDays');
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

/** A record plus the subject it belongs to — the absence list is flat and
 *  chronological, while the API nests absences under their subject. */
export interface FlatAbsence {
  record: AbsenceRecord;
  subjectCode: string;
}

/**
 * Every absence across every subject, newest first.
 *
 * The API already sorts records by session date descending, but it does so
 * WITHIN each subject; flattening loses that ordering, so the sort is redone
 * here over the whole set. Dates are ISO-8601 from the server, which sorts
 * lexicographically, but they are parsed anyway — a string compare would be
 * correct only for as long as the format never changes.
 */
export function flattenAbsences(subjects: AttendanceSubject[]): FlatAbsence[] {
  const flat: FlatAbsence[] = [];

  for (const entry of subjects) {
    for (const record of entry.absences) {
      flat.push({ record, subjectCode: entry.subject.code });
    }
  }

  return flat.sort(
    (a, b) => new Date(b.record.date).getTime() - new Date(a.record.date).getTime()
  );
}

/** Subjects worst first, so a student who is at risk sees why without scrolling.
 *  Ties break on the subject code, which keeps the order stable across renders
 *  rather than leaving it to the sort's implementation. */
export function sortSubjects(subjects: AttendanceSubject[]): AttendanceSubject[] {
  return [...subjects].sort(
    (a, b) => a.percentage - b.percentage || a.subject.code.localeCompare(b.subject.code)
  );
}
