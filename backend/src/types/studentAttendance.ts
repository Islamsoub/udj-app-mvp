import type { AttendanceBand } from '../utils/attendance';

/**
 * Response contract for GET /student/attendance.
 *
 * Both branches of the handler (no current semester, and the normal path) are
 * annotated with this type, so the contract cannot drift from what is sent.
 * Clients mirror it (pwa/lib/api-types.ts, the native app's API types) and
 * must treat every nullable field as nullable.
 */

export interface AttendanceSubjectInfo {
  id: string;
  nameFr: string;
  nameAr: string;
  code: string;
}

export interface AttendanceAbsenceEntry {
  id: string;
  date: string;
  status: 'ABSENT' | 'JUSTIFIED';
  subjectName: string;
  subjectNameAr: string;
  justificationUrl: string | null;
  justificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  justificationNote: string | null;
  /**
   * Whether POST .../justification would be accepted for this record right
   * now — the server's own verdict, not a hint.
   *
   * The client could in principle derive this from `date` and
   * `justificationDeadlineDays`, and that is precisely the problem: its
   * clock, its timezone handling and its idea of "a day" would all have to
   * match the server's, and any mismatch shows a student a form that is
   * guaranteed to be refused. Computed with the same function the POST
   * handler enforces with (utils/attendance.ts), so the two cannot disagree.
   */
  canSubmitJustification: boolean;
}

/** Fields shared by the overall figure and each subject. */
interface AttendanceBandFields {
  /** Computed server-side; clients only map it to a colour. */
  band: AttendanceBand;
  /**
   * Sessions the student can still miss and finish at or above the threshold.
   *
   * NULLABLE — null is not 0. It is null once the semester has ended (no
   * sessions remain, so there is nothing left to spend). A client must render
   * nothing for null, never "0 absences restantes".
   */
  absencesLeft: number | null;
}

export interface AttendanceOverall extends AttendanceBandFields {
  total: number;
  present: number;
  absent: number;
  justified: number;
  partial: number;
  /** Truncated whole percent; null when no hours have been held ("—"). */
  percentage: number | null;
}

export interface AttendanceSubject extends AttendanceBandFields {
  subject: AttendanceSubjectInfo;
  total: number;
  present: number;
  absent: number;
  justified: number;
  partial: number;
  /** Truncated whole percent. */
  percentage: number;
  absences: AttendanceAbsenceEntry[];
}

export interface StudentAttendanceResponse {
  /** Null when no semester is current. */
  overall: AttendanceOverall | null;
  /** Empty when no semester is current. */
  subjects: AttendanceSubject[];
  attendanceThreshold: number;
  justificationDeadlineDays: number;
}
