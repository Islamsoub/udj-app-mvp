import type { AbsenceRecord, AttendanceSubject } from '@/lib/api-types';

/**
 * The attendance rules the screen needs and the API does not send.
 *
 * ── THE THRESHOLD ────────────────────────────────────────────────────────────
 *
 * 75%, and it is a constant here because it cannot be anything else yet.
 *
 * The real value lives on the server: `SystemSettings.attendanceThreshold`,
 * `Int @default(75)` in backend/prisma/schema.prisma, changeable by an admin
 * through PATCH /admin/settings/attendance-threshold within 50-100. The live row
 * currently holds exactly the default. But GET /student/attendance does not
 * return it — only the admin routes read it (routes/admin/attendance.ts and
 * routes/admin/dashboard.ts, both `settings?.attendanceThreshold ?? 75`), so a
 * student client has no way to ask.
 *
 * THIS WILL DRIFT. The moment an admin moves that slider, the admin portal and
 * this screen disagree about who is at risk, and nothing here will notice. The
 * fix is one field on the student response, which is a backend change and does
 * not belong in a screen commit; until then the constant is kept in one place
 * with the server named as its source, so there is exactly one line to change.
 */
export const ATTENDANCE_THRESHOLD = 75;

/**
 * Which of the justification panel's four sub-states a record is in.
 *
 * Mutually exclusive SERVER states, not something the student toggles — which is
 * why §9 has the panel route straight to one of them with no transition between.
 */
export type JustificationState = 'none' | 'pending' | 'approved' | 'rejected';

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
      return record.status === 'JUSTIFIED' ? 'approved' : 'none';
  }
}

/**
 * "Is this one still on the student's plate?"
 *
 * Nothing filed yet, or filed and turned down. Pending is off the list because
 * the student has already done their part and is waiting on the faculty, and
 * approved is off it because it is settled.
 *
 * NOT DEADLINE-AWARE, and that is a known gap. The server enforces a submission
 * window — `SystemSettings.justificationDeadlineDays`, 8 by default, checked in
 * POST /student/attendance/:recordId/justification — after which an absence can
 * no longer be justified at all. That field is not in the attendance response
 * either, so the filter cannot tell a still-actionable absence from one that has
 * timed out. It over-counts rather than under-counts, which is the safer
 * direction: the student sees the absence and can ask, instead of it quietly
 * disappearing from the list.
 */
export function needsAction(record: AbsenceRecord): boolean {
  const state = justificationState(record);
  return state === 'none' || state === 'rejected';
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
