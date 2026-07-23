/**
 * Shared TypeScript types — shaped 1:1 on the responses of the Pass A backend
 * route handlers (admin-backend-output/routes/admin/*.ts). No `any` anywhere.
 *
 * Pass C-2 updates (UX architecture change-set §30):
 *  - Grade / StudentGrade: `publishedAt` → `publishedCcAt` + `publishedNfAt`
 *  - AttendanceStatus: `LATE` removed, `PARTIAL` added (backend enum)
 *  - AttendanceRecord: `hoursAttended` (only set for PARTIAL)
 *  - `NewsCategory` model + `NotificationType` (adds `NEWS`)
 *  - `SystemSettings.justificationDeadlineDays`
 *  - `GradeChangeInput`, `AttendanceOverview` (per-subject rollup)
 */

// ─── Enums (Prisma) ──────────────────────────────────────────────────────────

export type AdminRole = 'SUPER_ADMIN' | 'FACULTY_ADMIN' | 'REGISTRAR' | 'NEWS_EDITOR';
export type StudentStatus = 'ACTIVE' | 'SUSPENDED' | 'GRADUATED';
/** Pass C-2: `LATE` dropped, `PARTIAL` added (mirrors the backend enum). */
export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'PARTIAL' | 'JUSTIFIED';
export type JustificationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED';
export type ProgrammeLevel = 'DUT' | 'LICENCE' | 'MASTER' | 'DOCTORAT';
export type ScheduleEntryType = 'CM' | 'TD' | 'TP' | 'EXAM';
/** Pass C-2: adds `NEWS` (urgent / opted-in article push). */
export type NotificationType = 'GRADES' | 'SCHEDULE' | 'ATTENDANCE' | 'GENERAL' | 'NEWS';

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AdminIdentity {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: AdminRole;
  facultyId: string | null;
}

/** The refresh token is absent by design — it arrives as an httpOnly cookie. */
export interface LoginResponse {
  accessToken: string;
  admin: AdminIdentity;
}

export interface RefreshResponse {
  accessToken: string;
}

// ─── Pagination envelope (students, audit) ───────────────────────────────────

export interface Pagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  data: T[];
  pagination: Pagination;
}

// ─── Academic structure ──────────────────────────────────────────────────────

export interface FacultyRef {
  id: string;
  nameFr: string;
  code: string;
}

export interface Faculty {
  id: string;
  nameFr: string;
  nameAr: string;
  code: string;
  email: string;
  phone: string;
  address: string;
  hours: string;
  _count?: { programmes: number };
}

export interface ProgrammeRef {
  id: string;
  nameFr: string;
  code: string;
  facultyId?: string;
}

export interface Programme {
  id: string;
  nameFr: string;
  nameAr: string;
  code: string;
  facultyId: string;
  level: ProgrammeLevel;
  durationSemesters: number;
  totalCredits: number;
  faculty?: FacultyRef;
  _count?: { students: number; subjects: number };
}

export interface SemesterRef {
  id: string;
  label: string;
}

export interface Semester {
  id: string;
  label: string;
  academicYear: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface SubjectRef {
  id: string;
  code: string;
  nameFr: string;
  coefficient?: number;
}

export interface Subject {
  id: string;
  nameFr: string;
  nameAr: string;
  code: string;
  programmeId: string;
  semesterId: string;
  coefficient: number;
  credits: number;
  hoursCm: number;
  hoursTd: number;
  hoursTp: number;
  professorName?: string | null;
  programme?: { id: string; code: string; nameFr: string; facultyId: string };
  semester?: SemesterRef;
  _count?: { grades: number };
}

// ─── Students ────────────────────────────────────────────────────────────────

export interface StudentRef {
  id: string;
  studentIdDisplay: string;
  firstName: string;
  lastName: string;
}

/** Row shape of GET /admin/students. */
export interface StudentRow {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  photoUrl: string | null;
  currentSemester: number;
  status: StudentStatus;
  programme: {
    id: string;
    nameFr: string;
    code: string;
    faculty: FacultyRef;
  };
  gpa: number | null;
  presence: number | null;
}

export interface StudentGrade {
  id: string;
  studentId: string;
  subjectId: string;
  semesterId: string;
  noteCc: number | null;
  noteCf: number | null;
  noteFinale: number | null;
  isValidated: boolean;
  /** Pass C-2: dual publication timestamps replace the single `publishedAt`. */
  publishedCcAt: string | null;
  publishedNfAt: string | null;
  subject: { id: string; code: string; nameFr: string; coefficient: number };
  semester: SemesterRef;
}

export interface StudentAttendanceRecord {
  id: string;
  studentId: string;
  subjectId: string;
  sessionDate: string;
  status: AttendanceStatus;
  /** Pass C-2: hours attended when status = PARTIAL (null otherwise). */
  hoursAttended: number | null;
  justificationStatus: JustificationStatus | null;
  justificationReason?: string | null;
  justificationDocUrl?: string | null;
  justificationNote?: string | null;
  subject: { id: string; code: string; nameFr: string };
}

export interface StudentScheduleEntry {
  id: string;
  subjectId: string;
  semesterId: string;
  professorName: string;
  room: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: ScheduleEntryType;
  subject: { id: string; code: string; nameFr: string };
  semester: SemesterRef;
}

/** GET /admin/students/:id */
export interface StudentDetail {
  id: string;
  matricule: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  /** Optional — not yet returned by GET /admin/students/:id; row hidden when absent. */
  phone?: string | null;
  photoUrl: string | null;
  currentSemester: number;
  status: StudentStatus;
  programme: Programme & { faculty: Faculty };
  faculty: Faculty;
  gpa: number | null;
  presence: number | null;
  /** Validated credits earned. Optional — falls back to programme total when absent. */
  creditsEarned?: number | null;
  grades: StudentGrade[];
  attendance: StudentAttendanceRecord[];
  schedule: StudentScheduleEntry[];
}

export interface CreateStudentInput {
  firstName: string;
  lastName: string;
  matricule: string;
  email: string;
  programmeId: string;
  currentSemester: number;
  status?: StudentStatus;
  password: string;
}

export interface UpdateStudentInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  programmeId?: string;
  currentSemester?: number;
  status?: StudentStatus;
}

export interface ResetPasswordResponse {
  id: string;
  matricule: string;
  newPassword: string;
  message: string;
}

export interface StudentImportRow {
  matricule: string;
  prenom: string;
  nom: string;
  email: string;
  programme_code: string;
  semestre: string | number;
  mot_de_passe?: string;
}

export interface ImportReportRow {
  row: number;
  matricule: string;
  status: 'created' | 'error';
  error?: string;
}

export interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  report: ImportReportRow[];
}

export interface StudentFilters {
  search?: string;
  faculty?: string;
  programme?: string;
  semester?: string;
  status?: StudentStatus;
  gpaMin?: number;
  page?: number;
  pageSize?: number;
}

// ─── Grades ──────────────────────────────────────────────────────────────────

/** Row shape of GET /admin/grades (grade + joined refs + computed fields). */
export interface GradeRow {
  id: string;
  studentId: string;
  subjectId: string;
  semesterId: string;
  noteCc: number | null;
  noteCf: number | null;
  noteFinale: number | null;
  isValidated: boolean;
  /** Pass C-2: dual publication timestamps replace the single `publishedAt`. */
  publishedCcAt: string | null;
  publishedNfAt: string | null;
  student: StudentRef;
  subject: { id: string; code: string; nameFr: string; coefficient: number };
  semester: SemesterRef;
  mention: string | null;
  passed: boolean;
}

export interface BulkGradeRow {
  matricule?: string;
  studentId?: string;
  noteCc?: number | null;
  noteCf?: number | null;
}

export interface BulkGradeInput {
  subjectId: string;
  semesterId: string;
  rows: BulkGradeRow[];
}

export interface BulkGradeResult {
  total: number;
  saved: number;
  skipped: number;
  report: {
    studentId?: string;
    matricule?: string;
    status: 'saved' | 'error';
    error?: string;
  }[];
}

/** POST /admin/grades/publish — two-phase publication (Pass C-2, AD §3.3). */
export type PublishType = 'cc' | 'nf';

export interface PublishGradesInput {
  type: PublishType;
  semesterId: string;
  /** Target one subject… */
  subjectId?: string;
  /** …or every subject in a programme (within the current semester). */
  programmeId?: string;
}

export interface PublishGradesResult {
  type: PublishType;
  semesterId: string;
  subjectIds: string[];
  published: number;
  notified: number;
  message: string;
}

/** POST /admin/grades/:id/change — post-publication correction (Pass C-2, AD §3.4). */
export interface GradeChangeInput {
  field: 'cc' | 'cf';
  value: number;
  reason: string;
}

export interface GradeChangeResult {
  id: string;
  studentId: string;
  subjectId: string;
  semesterId: string;
  noteCc: number | null;
  noteCf: number | null;
  noteFinale: number | null;
  publishedCcAt: string | null;
  publishedNfAt: string | null;
  isValidated: boolean;
  mention: string | null;
  passed: boolean;
  reason: string;
  correction: { field: 'cc' | 'cf'; oldValue: number | null; newValue: number; reason: string };
}

// ─── Attendance ──────────────────────────────────────────────────────────────

export interface AttendanceRecordRow {
  id: string;
  studentId: string;
  subjectId: string;
  sessionDate: string;
  status: AttendanceStatus;
  /** Pass C-2: hours attended when status = PARTIAL (null otherwise). */
  hoursAttended: number | null;
  justificationStatus: JustificationStatus | null;
  justificationReason?: string | null;
  justificationDocUrl?: string | null;
  justificationDocType?: string | null;
  justificationNote?: string | null;
  createdAt?: string;
  student: StudentRef;
  subject: { id: string; code: string; nameFr: string };
}

/**
 * GET /admin/attendance response (records + pending count + status tally).
 * Renamed from `AttendanceOverview` in Pass C-2 so the name can carry the new
 * per-subject rollup below (change-set §30.6).
 */
export interface AttendanceSummary {
  records: AttendanceRecordRow[];
  pendingJustifications: number;
  statusCounts: { status: AttendanceStatus; count: number }[];
}

/** One row of GET /admin/attendance/overview (per-subject rollup, AD §4.7). */
export interface AttendanceOverview {
  subjectId: string;
  subjectName: string;
  subjectCode: string;
  totalSessions: number;
  completedSessions: number;
  classAveragePercentage: number | null;
  studentsAtRisk: number;
  belowThreshold: boolean;
}

/** GET /admin/attendance/overview?programmeId= envelope. */
export interface AttendanceOverviewResponse {
  programmeId: string;
  threshold: number;
  subjects: AttendanceOverview[];
}

/** One student's mark in a session roster (PARTIAL carries hoursAttended). */
export interface AttendanceMark {
  studentId: string;
  status: AttendanceStatus;
  hoursAttended?: number | null;
}

export interface RecordSessionInput {
  subjectId: string;
  sessionDate: string;
  records: AttendanceMark[];
}

export interface RecordSessionResult {
  subjectId: string;
  sessionDate: string;
  sessionHours: number;
  saved: number;
}

export interface JustificationDecisionInput {
  id: string;
  decision: 'approve' | 'reject';
  note?: string;
}

// ─── News ────────────────────────────────────────────────────────────────────

/** Admin-managed news category (Pass C-2, AD §7.2). */
export interface NewsCategory {
  id: string;
  nameFr: string;
  slug: string;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface NewsArticle {
  id: string;
  titleFr: string;
  titleAr: string;
  bodyFr: string;
  bodyAr: string;
  /** Legacy category slug (kept, dual-written with `categoryId`). */
  category: string;
  categoryId?: string | null;
  categoryRel?: NewsCategory | null;
  isUrgent: boolean;
  heroImageUrl: string | null;
  readTimeMinutes: number;
  publishedAt: string | null;
  viewsCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateNewsInput {
  titleFr: string;
  titleAr?: string;
  bodyFr: string;
  bodyAr?: string;
  category: string;
  categoryId?: string | null;
  isUrgent?: boolean;
  /** Pass C-2: send a push notification on publish (or implied by urgent). */
  sendNotification?: boolean;
  heroImageUrl?: string | null;
  publishedAt?: string;
}

/** POST /admin/news + PATCH — includes the urgent-limit unpin + notify count. */
export interface NewsMutationResult extends NewsArticle {
  unpinned?: { id: string; titleFr: string } | null;
  notified?: number;
}

export interface CreateCategoryInput {
  nameFr: string;
  displayOrder?: number;
}

export interface UpdateCategoryInput {
  nameFr?: string;
  displayOrder?: number;
}

export interface ReorderCategoryInput {
  id: string;
  displayOrder: number;
}

// ─── Schedule ────────────────────────────────────────────────────────────────

export interface ScheduleEntry {
  id: string;
  subjectId: string;
  semesterId: string;
  professorName: string;
  room: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: ScheduleEntryType;
  effectiveDate?: string;
  subject: {
    id: string;
    code: string;
    nameFr: string;
    programme: { id: string; code: string; nameFr: string; facultyId: string };
  };
  semester: SemesterRef;
  warning?: string | null;
  notified?: number;
}

export interface ScheduleEntryInput {
  subjectId: string;
  semesterId: string;
  professorName: string;
  room: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  type: ScheduleEntryType;
  effectiveDate?: string;
}

/** GET /admin/schedule filters (Pass C-2 adds room / professorName modes). */
export interface ScheduleFilters {
  programme?: string;
  semester?: string;
  day?: number;
  room?: string;
  professorName?: string;
}

/** One clashing entry from GET /admin/schedule/conflicts (Pass C-2, AD §5.2). */
export interface ScheduleConflict {
  id: string;
  room: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  semesterId: string;
  semesterLabel: string;
  subjectCode: string;
  subjectName: string;
  programmeCode: string;
  programmeName: string;
}

export interface ScheduleConflictsResult {
  count: number;
  conflicts: ScheduleConflict[];
}

// ─── Notifications ───────────────────────────────────────────────────────────

export type NotificationTarget = 'all' | 'faculty' | 'programme' | 'students';

export interface SendNotificationInput {
  target: NotificationTarget;
  facultyId?: string;
  programmeId?: string;
  studentIds?: string[];
  title: string;
  body: string;
}

export interface SendNotificationResult {
  target: NotificationTarget;
  facultyId: string | null;
  programmeId: string | null;
  title: string;
  body: string;
  count: number;
  sentAt: string;
  status: string;
  message: string;
}

export interface NotificationHistoryItem {
  id: string;
  title: string | null;
  body: string | null;
  target: NotificationTarget | null;
  count: number;
  sentBy: string;
  when: string;
  status: string;
}

// ─── Admin users ─────────────────────────────────────────────────────────────

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
  role: AdminRole;
  facultyId: string | null;
  isActive: boolean;
  lastLoginAt: string | null;
  faculty?: FacultyRef | null;
}

export interface CreateAdminInput {
  firstName: string;
  lastName: string;
  email: string;
  role: AdminRole;
  facultyId?: string | null;
  password: string;
}

export interface UpdateAdminInput {
  firstName?: string;
  lastName?: string;
  role?: AdminRole;
  facultyId?: string | null;
  isActive?: boolean;
}

// ─── Audit ───────────────────────────────────────────────────────────────────

export interface AuditEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  who: string;
  role: AdminRole;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ipAddress: string | null;
  when: string;
}

export interface AuditFilters {
  admin?: string;
  entityType?: string;
  action?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

// ─── Dashboard ───────────────────────────────────────────────────────────────

export interface GradeDistributionBucket {
  range: string;
  count: number;
}

export interface DashboardStats {
  studentsCount: number;
  studentsAtRisk: number;
  studentsSuspended: number;
  attendancePercentage: number;
  attendanceThreshold: number;
  averageGpa: number;
  gpaScale: number;
  gpaMention: string | null;
  currentSemester: string | null;
  pendingJustifications: number;
  gradeDistribution: GradeDistributionBucket[];
}

export interface ActivityEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  who: string;
  role: AdminRole;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  when: string;
}

// ─── Settings ────────────────────────────────────────────────────────────────

export interface SystemSettings {
  id: string;
  gradeWeightCc: number;
  gradeWeightCf: number;
  attendanceThreshold: number;
  /** Pass C-2: window (days) after which students can no longer justify (AD §4.4). */
  justificationDeadlineDays: number;
  /** @deprecated Pass C-2 — kept for compatibility, no longer affects behaviour. */
  autoPublishGrades: boolean;
  /** @deprecated Pass C-2 — automated notifications are always-on. */
  notifyOnPublish: boolean;
  /** @deprecated Pass C-2 — reserved for future use, not wired. */
  weeklyRecap: boolean;
  createdAt: string;
  updatedAt: string;
}

// ─── API error shape ─────────────────────────────────────────────────────────

export interface ApiError {
  error: string;
}
