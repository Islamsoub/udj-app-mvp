import * as SQLite from 'expo-sqlite';
import type {
  Schedule,
  Grade,
  NewsItem,
  StudentProfileCache,
  Attendance,
  CachedNotification,
} from './api';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('udj.db');
    await _db.execAsync('PRAGMA journal_mode = WAL;');
  }
  return _db;
}

// Add a column if it doesn't already exist (SQLite has no ADD COLUMN IF NOT EXISTS)
async function addColumnSafe(
  db: SQLite.SQLiteDatabase,
  sql: string,
): Promise<void> {
  try {
    await db.execAsync(sql);
  } catch {
    // Column already exists — ignore
  }
}

export async function runMigrations(): Promise<void> {
  const db = await getDb();

  // --- Create base tables ---
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER NOT NULL
      );

      CREATE TABLE IF NOT EXISTS schedules (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        subject_name TEXT NOT NULL,
        subject_code TEXT NOT NULL,
        lecturer_name TEXT NOT NULL,
        room TEXT NOT NULL,
        day_of_week INTEGER NOT NULL,
        start_time TEXT NOT NULL,
        end_time TEXT NOT NULL,
        semester TEXT NOT NULL,
        is_exam INTEGER NOT NULL DEFAULT 0,
        cached_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS grades (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        subject_code TEXT NOT NULL,
        semester TEXT NOT NULL,
        cc_score REAL,
        exam_score REAL,
        final_score REAL,
        coefficient REAL NOT NULL,
        passed INTEGER NOT NULL,
        cached_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS news_cache (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        body TEXT NOT NULL,
        category TEXT NOT NULL,
        published_at TEXT NOT NULL,
        bookmarked INTEGER NOT NULL DEFAULT 0,
        read INTEGER NOT NULL DEFAULT 0,
        cached_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS student_profile (
        student_id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        programme TEXT NOT NULL,
        faculty TEXT NOT NULL,
        year INTEGER NOT NULL,
        photo_url TEXT,
        cached_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        subject_code TEXT NOT NULL,
        sessions_total INTEGER NOT NULL,
        sessions_present INTEGER NOT NULL,
        threshold REAL NOT NULL DEFAULT 0.75,
        cached_at TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        title_fr TEXT NOT NULL,
        body_fr TEXT NOT NULL,
        is_read INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        cached_at TEXT NOT NULL
      );
    `);
  });

  // --- Additive migrations: new columns on existing tables ---

  // schedules: coefficient
  await addColumnSafe(db, 'ALTER TABLE schedules ADD COLUMN coefficient REAL NOT NULL DEFAULT 0');

  // grades: subject_name
  await addColumnSafe(db, 'ALTER TABLE grades ADD COLUMN subject_name TEXT NOT NULL DEFAULT \'\'');

  // attendance: subject_name, sessions_remaining, percentage
  await addColumnSafe(db, 'ALTER TABLE attendance ADD COLUMN subject_name TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE attendance ADD COLUMN sessions_remaining INTEGER NOT NULL DEFAULT 0');
  await addColumnSafe(db, 'ALTER TABLE attendance ADD COLUMN percentage REAL NOT NULL DEFAULT 0');

  // news_cache: read_time_minutes, is_urgent
  await addColumnSafe(db, 'ALTER TABLE news_cache ADD COLUMN read_time_minutes INTEGER NOT NULL DEFAULT 0');
  await addColumnSafe(db, 'ALTER TABLE news_cache ADD COLUMN is_urgent INTEGER NOT NULL DEFAULT 0');

  // student_profile: extended fields
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN first_name TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN last_name TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN programme_name TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN programme_code TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN faculty_name TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN level TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN semester INTEGER NOT NULL DEFAULT 0');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN status TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN gpa REAL');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN mention TEXT');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN attendance_percentage REAL');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN credits_earned INTEGER NOT NULL DEFAULT 0');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN credits_total INTEGER NOT NULL DEFAULT 0');
}

// --- Read helpers ---

export async function getScheduleForDay(dayOfWeek: number): Promise<Schedule[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM schedules WHERE day_of_week = ? ORDER BY start_time ASC',
    [dayOfWeek],
  );
  return rows.map(rowToSchedule);
}

export async function getFullSemesterSchedule(): Promise<Schedule[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM schedules ORDER BY day_of_week ASC, start_time ASC',
  );
  return rows.map(rowToSchedule);
}

export async function getGradesForSemester(semester: string): Promise<Grade[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM grades WHERE semester = ?',
    [semester],
  );
  return rows.map(rowToGrade);
}

export async function getAllCachedGrades(): Promise<Grade[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM grades ORDER BY semester ASC',
  );
  return rows.map(rowToGrade);
}

export async function getCachedNews(limit: number, category?: string): Promise<NewsItem[]> {
  const db = await getDb();
  const rows = category
    ? await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
        'SELECT * FROM news_cache WHERE LOWER(category) = LOWER(?) ORDER BY published_at DESC LIMIT ?',
        [category, limit],
      )
    : await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
        'SELECT * FROM news_cache ORDER BY published_at DESC LIMIT ?',
        [limit],
      );
  return rows.map(rowToNews);
}

export async function getSavedArticles(limit: number): Promise<NewsItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM news_cache WHERE bookmarked = 1 ORDER BY published_at DESC LIMIT ?',
    [limit],
  );
  return rows.map(rowToNews);
}

export async function toggleNewsBookmark(id: string, bookmarked: boolean): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    'UPDATE news_cache SET bookmarked = ? WHERE id = ?',
    [bookmarked ? 1 : 0, id],
  );
}

export async function isArticleBookmarked(id: string): Promise<boolean> {
  const db = await getDb();
  const row = await db.getFirstAsync<{ bookmarked: number }>(
    'SELECT bookmarked FROM news_cache WHERE id = ?',
    [id],
  );
  return (row?.bookmarked ?? 0) === 1;
}

export async function getStudentProfile(): Promise<StudentProfileCache | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM student_profile LIMIT 1',
  );
  return row ? rowToProfile(row) : null;
}

export async function getAttendance(): Promise<Attendance[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM attendance',
  );
  return rows.map(rowToAttendance);
}

export async function getCachedNotifications(): Promise<CachedNotification[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM notifications ORDER BY created_at DESC',
  );
  return rows.map(rowToNotification);
}

// --- Write helpers ---

export async function upsertSchedules(items: Schedule[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO schedules
          (id, student_id, subject_name, subject_code, lecturer_name, room,
           day_of_week, start_time, end_time, semester, is_exam, coefficient, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.studentId,
          item.subjectName,
          item.subjectCode,
          item.lecturerName,
          item.room,
          item.dayOfWeek,
          item.startTime,
          item.endTime,
          item.semester,
          item.isExam ? 1 : 0,
          item.coefficient,
          item.cachedAt,
        ],
      );
    }
  });
}

export async function upsertGrades(items: Grade[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO grades
          (id, student_id, subject_code, subject_name, semester, cc_score, exam_score,
           final_score, coefficient, passed, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.studentId,
          item.subjectCode,
          item.subjectName,
          item.semester,
          item.ccScore,
          item.examScore,
          item.finalScore,
          item.coefficient,
          item.passed ? 1 : 0,
          item.cachedAt,
        ],
      );
    }
  });
}

export async function upsertNews(items: NewsItem[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO news_cache
          (id, title, body, category, published_at, read_time_minutes, is_urgent,
           bookmarked, read, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.title,
          item.body,
          item.category,
          item.publishedAt,
          item.readTimeMinutes,
          item.isUrgent ? 1 : 0,
          item.bookmarked ? 1 : 0,
          item.read ? 1 : 0,
          item.cachedAt,
        ],
      );
    }
  });
}

export async function upsertProfile(profile: StudentProfileCache): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO student_profile
      (student_id, first_name, last_name, name, programme, programme_name,
       faculty, faculty_name, level, year, semester, status, photo_url,
       gpa, mention, attendance_percentage, credits_earned, credits_total, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.studentId,
      profile.firstName,
      profile.lastName,
      profile.name,
      profile.programme,
      profile.programmeName,
      profile.faculty,
      profile.facultyName,
      profile.level,
      profile.year,
      profile.semester,
      profile.status,
      profile.photoUrl,
      profile.gpa,
      profile.mention,
      profile.attendancePercentage,
      profile.creditsEarned,
      profile.creditsTotal,
      profile.cachedAt,
    ],
  );
}

export async function upsertAttendance(items: Attendance[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO attendance
          (id, student_id, subject_code, subject_name, sessions_total, sessions_present,
           sessions_remaining, percentage, threshold, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.studentId,
          item.subjectCode,
          item.subjectName,
          item.sessionsTotal,
          item.sessionsPresent,
          item.sessionsRemaining,
          item.percentage,
          item.threshold,
          item.cachedAt,
        ],
      );
    }
  });
}

export async function upsertNotifications(items: CachedNotification[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO notifications
          (id, type, title_fr, body_fr, is_read, created_at, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.type,
          item.titleFr,
          item.bodyFr,
          item.isRead ? 1 : 0,
          item.createdAt,
          item.cachedAt,
        ],
      );
    }
  });
}

// --- Row mappers ---

function rowToSchedule(row: Record<string, SQLite.SQLiteBindValue>): Schedule {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    subjectName: row.subject_name as string,
    subjectCode: row.subject_code as string,
    lecturerName: row.lecturer_name as string,
    room: row.room as string,
    dayOfWeek: row.day_of_week as number,
    startTime: row.start_time as string,
    endTime: row.end_time as string,
    semester: row.semester as string,
    isExam: (row.is_exam as number) === 1,
    coefficient: (row.coefficient as number | null) ?? 0,
    cachedAt: row.cached_at as string,
  };
}

function rowToGrade(row: Record<string, SQLite.SQLiteBindValue>): Grade {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    subjectCode: row.subject_code as string,
    subjectName: (row.subject_name as string | null) ?? '',
    semester: row.semester as string,
    ccScore: row.cc_score as number | null,
    examScore: row.exam_score as number | null,
    finalScore: row.final_score as number | null,
    coefficient: row.coefficient as number,
    passed: (row.passed as number) === 1,
    cachedAt: row.cached_at as string,
  };
}

function rowToNews(row: Record<string, SQLite.SQLiteBindValue>): NewsItem {
  return {
    id: row.id as string,
    title: row.title as string,
    body: row.body as string,
    category: row.category as string,
    publishedAt: row.published_at as string,
    readTimeMinutes: (row.read_time_minutes as number | null) ?? 0,
    isUrgent: (row.is_urgent as number | null) === 1,
    bookmarked: (row.bookmarked as number) === 1,
    read: (row.read as number) === 1,
    cachedAt: row.cached_at as string,
  };
}

function rowToProfile(row: Record<string, SQLite.SQLiteBindValue>): StudentProfileCache {
  return {
    studentId: row.student_id as string,
    firstName: (row.first_name as string | null) ?? '',
    lastName: (row.last_name as string | null) ?? '',
    name: row.name as string,
    programme: row.programme as string,
    programmeName: (row.programme_name as string | null) ?? '',
    faculty: row.faculty as string,
    facultyName: (row.faculty_name as string | null) ?? '',
    level: (row.level as string | null) ?? '',
    year: row.year as number,
    semester: (row.semester as number | null) ?? 0,
    status: (row.status as string | null) ?? '',
    photoUrl: row.photo_url as string | null,
    gpa: row.gpa as number | null,
    mention: row.mention as string | null,
    attendancePercentage: row.attendance_percentage as number | null,
    creditsEarned: (row.credits_earned as number | null) ?? 0,
    creditsTotal: (row.credits_total as number | null) ?? 0,
    cachedAt: row.cached_at as string,
  };
}

function rowToAttendance(row: Record<string, SQLite.SQLiteBindValue>): Attendance {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    subjectCode: row.subject_code as string,
    subjectName: (row.subject_name as string | null) ?? '',
    sessionsTotal: row.sessions_total as number,
    sessionsPresent: row.sessions_present as number,
    sessionsRemaining: (row.sessions_remaining as number | null) ?? 0,
    percentage: (row.percentage as number | null) ?? 0,
    threshold: row.threshold as number,
    cachedAt: row.cached_at as string,
  };
}

function rowToNotification(row: Record<string, SQLite.SQLiteBindValue>): CachedNotification {
  return {
    id: row.id as string,
    type: row.type as string,
    titleFr: row.title_fr as string,
    bodyFr: row.body_fr as string,
    isRead: (row.is_read as number) === 1,
    createdAt: row.created_at as string,
    cachedAt: row.cached_at as string,
  };
}
