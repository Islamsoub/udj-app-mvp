import * as SQLite from 'expo-sqlite';
import type { Schedule, Grade, NewsItem, StudentProfileCache, Attendance } from './api';

let _db: SQLite.SQLiteDatabase | null = null;

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    _db = await SQLite.openDatabaseAsync('udj.db');
    await _db.execAsync('PRAGMA journal_mode = WAL;');
  }
  return _db;
}

export async function runMigrations(): Promise<void> {
  const db = await getDb();

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
    `);
  });
}

// --- Read helpers ---

export async function getScheduleForDay(dayOfWeek: number): Promise<Schedule[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM schedules WHERE day_of_week = ? ORDER BY start_time ASC',
    [dayOfWeek]
  );
  return rows.map(rowToSchedule);
}

export async function getFullSemesterSchedule(): Promise<Schedule[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM schedules ORDER BY day_of_week ASC, start_time ASC'
  );
  return rows.map(rowToSchedule);
}

export async function getGradesForSemester(semester: string): Promise<Grade[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM grades WHERE semester = ?',
    [semester]
  );
  return rows.map(rowToGrade);
}

export async function getCachedNews(limit: number): Promise<NewsItem[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM news_cache ORDER BY published_at DESC LIMIT ?',
    [limit]
  );
  return rows.map(rowToNews);
}

export async function getStudentProfile(): Promise<StudentProfileCache | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM student_profile LIMIT 1'
  );
  return row ? rowToProfile(row) : null;
}

export async function getAttendance(): Promise<Attendance[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM attendance'
  );
  return rows.map(rowToAttendance);
}

// --- Write helpers ---

export async function upsertSchedules(items: Schedule[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO schedules
          (id, student_id, subject_name, subject_code, lecturer_name, room,
           day_of_week, start_time, end_time, semester, is_exam, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
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
          item.cachedAt,
        ]
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
          (id, student_id, subject_code, semester, cc_score, exam_score,
           final_score, coefficient, passed, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.studentId,
          item.subjectCode,
          item.semester,
          item.ccScore,
          item.examScore,
          item.finalScore,
          item.coefficient,
          item.passed ? 1 : 0,
          item.cachedAt,
        ]
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
          (id, title, body, category, published_at, bookmarked, read, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.title,
          item.body,
          item.category,
          item.publishedAt,
          item.bookmarked ? 1 : 0,
          item.read ? 1 : 0,
          item.cachedAt,
        ]
      );
    }
  });
}

export async function upsertProfile(profile: StudentProfileCache): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT OR REPLACE INTO student_profile
      (student_id, name, programme, faculty, year, photo_url, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      profile.studentId,
      profile.name,
      profile.programme,
      profile.faculty,
      profile.year,
      profile.photoUrl,
      profile.cachedAt,
    ]
  );
}

export async function upsertAttendance(items: Attendance[]): Promise<void> {
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    for (const item of items) {
      await db.runAsync(
        `INSERT OR REPLACE INTO attendance
          (id, student_id, subject_code, sessions_total, sessions_present, threshold, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.studentId,
          item.subjectCode,
          item.sessionsTotal,
          item.sessionsPresent,
          item.threshold,
          item.cachedAt,
        ]
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
    cachedAt: row.cached_at as string,
  };
}

function rowToGrade(row: Record<string, SQLite.SQLiteBindValue>): Grade {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    subjectCode: row.subject_code as string,
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
    bookmarked: (row.bookmarked as number) === 1,
    read: (row.read as number) === 1,
    cachedAt: row.cached_at as string,
  };
}

function rowToProfile(row: Record<string, SQLite.SQLiteBindValue>): StudentProfileCache {
  return {
    studentId: row.student_id as string,
    name: row.name as string,
    programme: row.programme as string,
    faculty: row.faculty as string,
    year: row.year as number,
    photoUrl: row.photo_url as string | null,
    cachedAt: row.cached_at as string,
  };
}

function rowToAttendance(row: Record<string, SQLite.SQLiteBindValue>): Attendance {
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    subjectCode: row.subject_code as string,
    sessionsTotal: row.sessions_total as number,
    sessionsPresent: row.sessions_present as number,
    threshold: row.threshold as number,
    cachedAt: row.cached_at as string,
  };
}
