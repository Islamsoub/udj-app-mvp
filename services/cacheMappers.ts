import type {
  Schedule,
  Grade,
  NewsItem,
  StudentProfileCache,
  Attendance,
  CachedNotification,
  ScheduleEntry,
  GradeItem,
  NewsArticleSummary,
  AttendanceSubject,
  ApiNotification,
} from './api';
import type { StudentProfile } from '@/stores/authStore';

const NOW = () => new Date().toISOString();

// ─── Profile ─────────────────────────────────────────────────────────────────

export function mapProfileToCache(student: StudentProfile): StudentProfileCache {
  const academicYearStart =
    new Date().getMonth() < 7 ? new Date().getFullYear() - 1 : new Date().getFullYear();
  const year = academicYearStart;

  return {
    studentId: student.studentIdDisplay,
    firstName: student.firstName,
    lastName: student.lastName,
    name: `${student.firstName} ${student.lastName}`,
    email: student.email,
    programme: student.programme.code,
    programmeName: student.programme.nameFr,
    programmeNameAr: student.programme.nameAr,
    faculty: student.faculty.code,
    facultyName: student.faculty.nameFr,
    facultyNameAr: student.faculty.nameAr,
    facultyCode: student.faculty.code,
    facultyEmail: student.faculty.email ?? '',
    facultyPhone: student.faculty.phone ?? '',
    facultyAddress: student.faculty.address ?? '',
    facultyHours: student.faculty.hours ?? '',
    programmeLevel: student.programme.level,
    programmeDurationSemesters: student.programme.durationSemesters ?? 0,
    programmeTotalCredits: student.programme.totalCredits ?? 0,
    currentSemester: student.currentSemester,
    level: student.programme.level,
    year,
    semester: student.currentSemester,
    status: student.status,
    photoUrl: student.photoUrl,
    gpa: student.stats?.gpa ?? null,
    mention: student.stats?.mention ?? null,
    attendancePercentage: student.stats?.attendancePercentage ?? null,
    creditsEarned: student.stats?.semesterCredits?.earned ?? 0,
    creditsTotal: student.stats?.semesterCredits?.total ?? 0,
    cachedAt: NOW(),
  };
}

// ─── Schedule ─────────────────────────────────────────────────────────────────

export function mapScheduleToCache(
  entries: ScheduleEntry[],
  studentId: string,
  semesterId: string,
): Schedule[] {
  return entries.map((entry) => ({
    id: entry.id,
    studentId,
    subjectName: entry.subject.nameFr,
    subjectNameAr: entry.subject.nameAr,
    subjectCode: entry.subject.code,
    lecturerName: entry.professorName,
    room: entry.room,
    dayOfWeek: entry.dayOfWeek,
    startTime: entry.startTime,
    endTime: entry.endTime,
    semester: semesterId,
    isExam: entry.type === 'EXAM',
    coefficient: entry.subject.coefficient,
    cachedAt: NOW(),
  }));
}

// ─── Grades ───────────────────────────────────────────────────────────────────

export function mapGradesToCache(
  grades: GradeItem[],
  studentId: string,
  semesterId: string,
): Grade[] {
  return grades.map((g) => ({
    id: g.id,
    studentId,
    subjectCode: g.subject.code,
    subjectName: g.subject.nameFr,
    subjectNameAr: g.subject.nameAr,
    semester: semesterId,
    ccScore: g.noteCc,
    examScore: g.noteCf,
    finalScore: g.noteFinale,
    coefficient: g.subject.coefficient,
    passed: g.isValidated,
    cachedAt: NOW(),
  }));
}

// ─── News ─────────────────────────────────────────────────────────────────────

export function mapNewsToCache(articles: NewsArticleSummary[]): NewsItem[] {
  return articles.map((a) => ({
    id: a.id,
    title: a.titleFr,
    titleAr: a.titleAr,
    body: '',
    category: a.category,
    publishedAt: a.publishedAt,
    readTimeMinutes: a.readTimeMinutes,
    isUrgent: a.isUrgent,
    imageUrl: a.heroImageUrl,
    bookmarked: false,
    read: false,
    cachedAt: NOW(),
  }));
}

// ─── Attendance ───────────────────────────────────────────────────────────────

export function mapAttendanceToCache(
  subjects: AttendanceSubject[],
  studentId: string,
): Attendance[] {
  return subjects.map((s) => ({
    id: `${studentId}-${s.subject.code}`,
    studentId,
    subjectCode: s.subject.code,
    subjectName: s.subject.nameFr,
    subjectNameAr: s.subject.nameAr,
    sessionsTotal: s.total,
    sessionsPresent: s.present,
    sessionsRemaining: 0,
    percentage: s.percentage,
    threshold: 0.75,
    cachedAt: NOW(),
  }));
}

// ─── Notifications ────────────────────────────────────────────────────────────

export function mapNotificationsToCache(
  notifications: ApiNotification[],
): CachedNotification[] {
  const now = NOW();
  return notifications.map((n) => ({
    id: n.id,
    type: n.type,
    titleFr: n.titleFr,
    titleAr: n.titleAr,
    bodyFr: n.bodyFr,
    bodyAr: n.bodyAr,
    isRead: n.isRead,
    createdAt: n.createdAt,
    cachedAt: now,
  }));
}
