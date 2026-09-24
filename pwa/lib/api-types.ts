/**
 * Response shapes for the nine endpoints reachable through /api/backend.
 *
 * Derived from what the Express handlers actually send (backend/src/routes/
 * student.ts and news.ts), not from the SQLite cache shapes the native app
 * flattens them into — the PWA has no local database, so it consumes the API
 * shapes directly.
 */

// ── Shared ────────────────────────────────────────────────────────────────────

export interface CreditTally {
  earned: number;
  total: number;
}

export interface SemesterRef {
  id: string;
  label: string;
  academicYear: string;
}

export interface SubjectRef {
  id: string;
  nameFr: string;
  nameAr: string;
  code: string;
}

/** The trimmed student object /auth/login returns alongside the tokens. */
export interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  studentIdDisplay: string;
  email: string;
  photoUrl: string | null;
  currentSemester: number;
  status: string;
  programme: {
    id: string;
    nameFr: string;
    nameAr: string;
    code: string;
    level: string;
  };
  faculty: {
    id: string;
    nameFr: string;
    nameAr: string;
    code: string;
  };
}

// ── GET /student/me ───────────────────────────────────────────────────────────

export interface StudentPreferences {
  notifGrades: boolean;
  notifCourses: boolean;
  notifAttendance: boolean;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
}

export interface StudentStats {
  gpa: number | null;
  mention: string | null;
  semesterCredits: CreditTally;
  totalCredits: CreditTally;
  /** Hours-based. Null when the student has no attendance records yet. */
  attendancePercentage: number | null;
}

/** Richer than StudentSummary: /student/me adds stats, preferences and the full
 *  programme/faculty records the profile and info screens render. */
export interface MeResponse {
  id: string;
  firstName: string;
  lastName: string;
  studentIdDisplay: string;
  email: string;
  photoUrl: string | null;
  currentSemester: number;
  status: string;
  programme: {
    id: string;
    nameFr: string;
    nameAr: string;
    code: string;
    level: string;
    durationSemesters: number;
    totalCredits: number;
  };
  faculty: {
    id: string;
    nameFr: string;
    nameAr: string;
    code: string;
    email: string;
    phone: string;
    address: string;
    hours: string;
  };
  stats: StudentStats;
  preferences: StudentPreferences;
}

// ── GET /student/schedule ─────────────────────────────────────────────────────

export interface ScheduleEntry {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string;
  professorName: string;
  type: string;
  subject: SubjectRef & { coefficient: number };
}

export interface ScheduleResponse {
  semesterId: string;
  entries: ScheduleEntry[];
}

// ── GET /student/grades ───────────────────────────────────────────────────────

/**
 * Two-phase publication: a grade appears only once CC is published, and noteCf /
 * noteFinale stay null (with isValidated false) until NF is published too. Null
 * therefore means "not published yet", never "zero".
 */
export interface GradeItem {
  id: string;
  noteCc: number | null;
  noteCf: number | null;
  noteFinale: number | null;
  isValidated: boolean;
  subject: SubjectRef & { coefficient: number; credits: number };
}

export interface GradesResponse {
  semester: SemesterRef;
  gpa: number | null;
  mention: string | null;
  credits: CreditTally;
  ccPublished: boolean;
  nfPublished: boolean;
  grades: GradeItem[];
}

export interface SemesterSummary extends SemesterRef {
  gpa: number | null;
  mention: string | null;
  credits: CreditTally;
}

/** Same endpoint, entirely different shape — `allSemesters=true` returns the
 *  per-semester history instead of one semester's grade list. */
export interface AllSemestersResponse {
  semesters: SemesterSummary[];
}

// ── GET /student/attendance ───────────────────────────────────────────────────

export interface AbsenceRecord {
  id: string;
  date: string;
  status: 'ABSENT' | 'JUSTIFIED';
  subjectName: string;
  subjectNameAr: string;
  /** Time-limited signed Storage URL, minted per request. Do not cache it. */
  justificationUrl: string | null;
  justificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  justificationNote: string | null;
  /**
   * Whether POST .../justification would be accepted for this record right now:
   * ABSENT and still inside the deadline window. The server's verdict, computed
   * with the same helper its POST handler enforces with, so the client never
   * re-derives it from `date` and its own clock.
   */
  canSubmitJustification: boolean;
}

export interface AttendanceSubject {
  subject: SubjectRef;
  total: number;
  present: number;
  absent: number;
  justified: number;
  partial: number;
  percentage: number;
  absences: AbsenceRecord[];
}

export interface AttendanceOverall {
  total: number;
  present: number;
  absent: number;
  justified: number;
  partial: number;
  /** Hours-based, so null when no session lengths could be resolved. */
  percentage: number | null;
}

/** `overall` is null when no semester is marked current. The two rules are
 *  sent on that branch too, so they are never optional. */
export interface AttendanceResponse {
  overall: AttendanceOverall | null;
  subjects: AttendanceSubject[];
  /** Minimum presence, a whole number out of 100 (`SystemSettings`, admin-editable). */
  attendanceThreshold: number;
  /** Days after the session during which a justification is accepted (1-30). */
  justificationDeadlineDays: number;
}

// ── GET /student/notifications ────────────────────────────────────────────────

export interface ApiNotification {
  id: string;
  type: string;
  titleFr: string;
  titleAr: string;
  bodyFr: string;
  bodyAr: string;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationsResponse {
  /** Across all notifications, not just the page returned. */
  unreadCount: number;
  notifications: ApiNotification[];
}

export interface MarkAllReadResponse {
  updated: number;
}

// ── PATCH /student/preferences ────────────────────────────────────────────────

/** Every field optional: the endpoint is a partial update. Quiet hours are
 *  "HH:MM" strings, and null clears them. */
export type PreferencesPayload = Partial<StudentPreferences>;

// ── News ──────────────────────────────────────────────────────────────────────

export interface NewsArticleSummary {
  id: string;
  titleFr: string;
  titleAr: string;
  category: string;
  heroImageUrl: string | null;
  readTimeMinutes: number;
  isUrgent: boolean;
  publishedAt: string;
}

export interface NewsListResponse {
  articles: NewsArticleSummary[];
}

/** The detail endpoint returns the whole row, so it carries the bodies and the
 *  audit timestamps the list summaries omit. */
export interface NewsArticleDetail extends NewsArticleSummary {
  bodyFr: string;
  bodyAr: string;
  categoryId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NewsQuery {
  category?: string;
  limit?: number;
  offset?: number;
}

// ── POST /student/attendance/:recordId/justification ──────────────────────────

/**
 * What the backend answers on a successful upload.
 *
 * `justificationStatus` is always 'PENDING' here — the handler writes that
 * literal, and only an admin review can move it on — but it is typed as the full
 * union so the value can be spliced straight into an AbsenceRecord without a
 * cast or a re-fetch.
 *
 * `justificationUrl` is a FRESH signed Supabase Storage URL, minted in the same
 * request with a one-hour life. Like the ones on the attendance response it must
 * be used exactly as received and never cached.
 */
export interface UploadJustificationResponse {
  success: true;
  justificationUrl: string;
  justificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  justificationNote: string | null;
}

/**
 * The backend's error body. `error` is a human sentence in whatever language the
 * thrower wrote it and is never shown to a student. `code` is present only on
 * errors the backend declares deliberately (backend/src/utils/AppError.ts) —
 * today the two 409s of the upload above — and is absent on older deployments,
 * so every reader must handle it missing.
 */
export interface ApiErrorBody {
  error: string;
  code?: 'NOT_ABSENT' | 'DEADLINE_PASSED';
}
