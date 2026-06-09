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

      CREATE TABLE IF NOT EXISTS course_notes (
        id TEXT PRIMARY KEY,
        subject_code TEXT NOT NULL,
        day_of_week INTEGER NOT NULL,
        note TEXT NOT NULL,
        created_at TEXT NOT NULL
      );
    `);
  });

  // --- Additive migrations: new columns on existing tables ---

  // schedules: coefficient, subject_name_ar
  await addColumnSafe(db, 'ALTER TABLE schedules ADD COLUMN coefficient REAL NOT NULL DEFAULT 0');
  await addColumnSafe(db, "ALTER TABLE schedules ADD COLUMN subject_name_ar TEXT NOT NULL DEFAULT ''");

  // grades: subject_name, subject_name_ar
  await addColumnSafe(db, "ALTER TABLE grades ADD COLUMN subject_name TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, "ALTER TABLE grades ADD COLUMN subject_name_ar TEXT NOT NULL DEFAULT ''");

  // attendance: subject_name, subject_name_ar, sessions_remaining, percentage
  await addColumnSafe(db, "ALTER TABLE attendance ADD COLUMN subject_name TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, "ALTER TABLE attendance ADD COLUMN subject_name_ar TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, 'ALTER TABLE attendance ADD COLUMN sessions_remaining INTEGER NOT NULL DEFAULT 0');
  await addColumnSafe(db, 'ALTER TABLE attendance ADD COLUMN percentage REAL NOT NULL DEFAULT 0');

  // news_cache: read_time_minutes, is_urgent, image_url, title_ar
  await addColumnSafe(db, 'ALTER TABLE news_cache ADD COLUMN read_time_minutes INTEGER NOT NULL DEFAULT 0');
  await addColumnSafe(db, 'ALTER TABLE news_cache ADD COLUMN is_urgent INTEGER NOT NULL DEFAULT 0');
  await addColumnSafe(db, 'ALTER TABLE news_cache ADD COLUMN image_url TEXT');
  await addColumnSafe(db, "ALTER TABLE news_cache ADD COLUMN title_ar TEXT NOT NULL DEFAULT ''");

  // student_profile: extended fields
  await addColumnSafe(db, "ALTER TABLE student_profile ADD COLUMN first_name TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, "ALTER TABLE student_profile ADD COLUMN last_name TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, "ALTER TABLE student_profile ADD COLUMN programme_name TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, "ALTER TABLE student_profile ADD COLUMN programme_name_ar TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, "ALTER TABLE student_profile ADD COLUMN programme_code TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, "ALTER TABLE student_profile ADD COLUMN faculty_name TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, "ALTER TABLE student_profile ADD COLUMN faculty_name_ar TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN level TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN semester INTEGER NOT NULL DEFAULT 0');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN status TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN gpa REAL');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN mention TEXT');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN attendance_percentage REAL');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN credits_earned INTEGER NOT NULL DEFAULT 0');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN credits_total INTEGER NOT NULL DEFAULT 0');

  // student_profile: extended contact + programme fields
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN email TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN faculty_code TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN faculty_email TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN faculty_phone TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN faculty_address TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN faculty_hours TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN programme_level TEXT NOT NULL DEFAULT \'\'');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN programme_duration_semesters INTEGER NOT NULL DEFAULT 0');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN programme_total_credits INTEGER NOT NULL DEFAULT 0');
  await addColumnSafe(db, 'ALTER TABLE student_profile ADD COLUMN current_semester INTEGER NOT NULL DEFAULT 0');

  // notifications: title_ar, body_ar
  await addColumnSafe(db, "ALTER TABLE notifications ADD COLUMN title_ar TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, "ALTER TABLE notifications ADD COLUMN body_ar TEXT NOT NULL DEFAULT ''");
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

// --- Course notes (user-authored, not cache — survives clearAllCache) ---

export interface CourseNote {
  id: string;
  note: string;
  createdAt: string;
}

export async function saveCourseNote(
  subjectCode: string,
  dayOfWeek: number,
  note: string,
): Promise<void> {
  const db = await getDb();
  const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  await db.runAsync(
    `INSERT INTO course_notes (id, subject_code, day_of_week, note, created_at)
     VALUES (?, ?, ?, ?, ?)`,
    [id, subjectCode, dayOfWeek, note, new Date().toISOString()],
  );
}

export async function getCourseNotes(
  subjectCode: string,
  dayOfWeek: number,
): Promise<CourseNote[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<{ id: string; note: string; created_at: string }>(
    `SELECT id, note, created_at FROM course_notes
     WHERE subject_code = ? AND day_of_week = ?
     ORDER BY created_at DESC`,
    [subjectCode, dayOfWeek],
  );
  return rows.map((r) => ({ id: r.id, note: r.note, createdAt: r.created_at }));
}

export async function deleteCourseNote(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('DELETE FROM course_notes WHERE id = ?', [id]);
}

// --- Write helpers ---

export async function upsertSchedules(items: Schedule[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO schedules
          (id, student_id, subject_name, subject_name_ar, subject_code, lecturer_name, room,
           day_of_week, start_time, end_time, semester, is_exam, coefficient, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.studentId,
          item.subjectName,
          item.subjectNameAr ?? '',
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
          (id, student_id, subject_code, subject_name, subject_name_ar, semester, cc_score,
           exam_score, final_score, coefficient, passed, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.studentId,
          item.subjectCode,
          item.subjectName,
          item.subjectNameAr ?? '',
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
        `INSERT INTO news_cache
          (id, title, title_ar, body, category, published_at, read_time_minutes, is_urgent,
           image_url, bookmarked, read, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           title             = excluded.title,
           title_ar          = excluded.title_ar,
           category          = excluded.category,
           published_at      = excluded.published_at,
           read_time_minutes = excluded.read_time_minutes,
           is_urgent         = excluded.is_urgent,
           image_url         = excluded.image_url,
           cached_at         = excluded.cached_at,
           -- bookmarked and read intentionally NOT updated → preserved
           -- body: only update if incoming value is non-empty
           body = CASE WHEN excluded.body != '' THEN excluded.body ELSE news_cache.body END`,
        [
          item.id,
          item.title,
          item.titleAr ?? '',
          item.body,
          item.category,
          item.publishedAt,
          item.readTimeMinutes,
          item.isUrgent ? 1 : 0,
          item.imageUrl,
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
      (student_id, first_name, last_name, name, email, programme, programme_name,
       programme_name_ar, faculty, faculty_name, faculty_name_ar, faculty_code,
       faculty_email, faculty_phone, faculty_address, faculty_hours, programme_level,
       programme_duration_semesters, programme_total_credits, current_semester, level,
       year, semester, status, photo_url, gpa, mention, attendance_percentage,
       credits_earned, credits_total, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.studentId,
      profile.firstName,
      profile.lastName,
      profile.name,
      profile.email,
      profile.programme,
      profile.programmeName,
      profile.programmeNameAr ?? '',
      profile.faculty,
      profile.facultyName,
      profile.facultyNameAr ?? '',
      profile.facultyCode,
      profile.facultyEmail,
      profile.facultyPhone,
      profile.facultyAddress,
      profile.facultyHours,
      profile.programmeLevel,
      profile.programmeDurationSemesters,
      profile.programmeTotalCredits,
      profile.currentSemester,
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
          (id, student_id, subject_code, subject_name, subject_name_ar, sessions_total,
           sessions_present, sessions_remaining, percentage, threshold, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.studentId,
          item.subjectCode,
          item.subjectName,
          item.subjectNameAr ?? '',
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

export async function markNotificationReadLocal(id: string): Promise<void> {
  const db = await getDb();
  await db.runAsync('UPDATE notifications SET is_read = 1 WHERE id = ?', [id]);
}

export async function upsertNotifications(items: CachedNotification[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO notifications
          (id, type, title_fr, title_ar, body_fr, body_ar, is_read, created_at, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(id) DO UPDATE SET
           type       = excluded.type,
           title_fr   = excluded.title_fr,
           title_ar   = excluded.title_ar,
           body_fr    = excluded.body_fr,
           body_ar    = excluded.body_ar,
           created_at = excluded.created_at,
           cached_at  = excluded.cached_at
           -- is_read intentionally NOT updated → preserves local read state`,
        [
          item.id,
          item.type,
          item.titleFr,
          item.titleAr ?? '',
          item.bodyFr,
          item.bodyAr ?? '',
          item.isRead ? 1 : 0,
          item.createdAt,
          item.cachedAt,
        ],
      );
    }
  });
}

// --- Cache management ---

export interface CacheStat {
  key: string;
  table: string;
  rows: number;
  estimatedBytes: number;
}

const CACHE_TABLES: Array<{ key: string; table: string; avgRowBytes: number }> = [
  { key: 'profile', table: 'student_profile', avgRowBytes: 400 },
  { key: 'schedule', table: 'schedules', avgRowBytes: 200 },
  { key: 'grades', table: 'grades', avgRowBytes: 200 },
  { key: 'news', table: 'news_cache', avgRowBytes: 500 },
  { key: 'notifications', table: 'notifications', avgRowBytes: 200 },
  { key: 'attendance', table: 'attendance', avgRowBytes: 200 },
];

export async function getCacheStats(): Promise<CacheStat[]> {
  const db = await getDb();
  const stats: CacheStat[] = [];
  for (const { key, table, avgRowBytes } of CACHE_TABLES) {
    const row = await db.getFirstAsync<{ count: number }>(
      `SELECT COUNT(*) as count FROM ${table}`,
    );
    const rows = row?.count ?? 0;
    stats.push({ key, table, rows, estimatedBytes: rows * avgRowBytes });
  }
  // Bookmarks (subset of news_cache)
  const bookmarkRow = await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM news_cache WHERE bookmarked = 1',
  );
  stats.push({
    key: 'bookmarks',
    table: 'news_cache',
    rows: bookmarkRow?.count ?? 0,
    estimatedBytes: (bookmarkRow?.count ?? 0) * 500,
  });
  return stats;
}

/**
 * Most recent sync time across the profile cache, as epoch milliseconds.
 * `cached_at` is stored as an ISO-8601 string, which sorts lexicographically,
 * so MAX() yields the latest timestamp. Returns null when nothing is cached.
 */
export async function getLastSyncTime(): Promise<number | null> {
  const db = await getDb();
  const result = await db.getFirstAsync<{ latest: string | null }>(
    'SELECT MAX(cached_at) as latest FROM student_profile',
  );
  return result?.latest ? new Date(result.latest).getTime() : null;
}

export async function clearAllCache(): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const { table } of CACHE_TABLES) {
      await db.execAsync(`DELETE FROM ${table}`);
    }
  });
}

export async function clearTableCache(table: string): Promise<void> {
  const allowedTables = CACHE_TABLES.map((t) => t.table);
  if (!allowedTables.includes(table)) return;
  const db = await getDb();
  await db.execAsync(`DELETE FROM ${table}`);
}

// --- Row mappers ---

function rowToSchedule(row: Record<string, SQLite.SQLiteBindValue>): Schedule {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    subjectName: row.subject_name as string,
    subjectNameAr: (row.subject_name_ar as string | null) ?? '',
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
    subjectNameAr: (row.subject_name_ar as string | null) ?? '',
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
    titleAr: (row.title_ar as string | null) ?? '',
    body: row.body as string,
    category: row.category as string,
    publishedAt: row.published_at as string,
    readTimeMinutes: (row.read_time_minutes as number | null) ?? 0,
    isUrgent: (row.is_urgent as number | null) === 1,
    imageUrl: (row.image_url as string | null) ?? null,
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
    email: (row.email as string | null) ?? '',
    programme: row.programme as string,
    programmeName: (row.programme_name as string | null) ?? '',
    programmeNameAr: (row.programme_name_ar as string | null) ?? '',
    faculty: row.faculty as string,
    facultyName: (row.faculty_name as string | null) ?? '',
    facultyNameAr: (row.faculty_name_ar as string | null) ?? '',
    facultyCode: (row.faculty_code as string | null) ?? '',
    facultyEmail: (row.faculty_email as string | null) ?? '',
    facultyPhone: (row.faculty_phone as string | null) ?? '',
    facultyAddress: (row.faculty_address as string | null) ?? '',
    facultyHours: (row.faculty_hours as string | null) ?? '',
    programmeLevel: (row.programme_level as string | null) ?? '',
    programmeDurationSemesters: (row.programme_duration_semesters as number | null) ?? 0,
    programmeTotalCredits: (row.programme_total_credits as number | null) ?? 0,
    currentSemester: (row.current_semester as number | null) ?? 0,
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
    subjectNameAr: (row.subject_name_ar as string | null) ?? '',
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
    titleAr: (row.title_ar as string | null) ?? '',
    bodyFr: row.body_fr as string,
    bodyAr: (row.body_ar as string | null) ?? '',
    isRead: (row.is_read as number) === 1,
    createdAt: row.created_at as string,
    cachedAt: row.cached_at as string,
  };
}
