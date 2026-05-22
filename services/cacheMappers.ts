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
    programme: student.programme.code,
    programmeName: student.programme.nameFr,
    faculty: student.faculty.code,
    facultyName: student.faculty.nameFr,
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
    body: '',
    category: a.category,
    publishedAt: a.publishedAt,
    readTimeMinutes: a.readTimeMinutes,
    isUrgent: a.isUrgent,
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
    bodyFr: n.bodyFr,
    isRead: n.isRead,
    createdAt: n.createdAt,
    cachedAt: now,
  }));
}
