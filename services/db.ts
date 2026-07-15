import * as SQLite from 'expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { File } from 'expo-file-system';
import type {
  Schedule,
  Grade,
  NewsItem,
  StudentProfileCache,
  Attendance,
  CachedNotification,
} from './api';

const DB_NAME = 'udj.db';
const ENC_TMP_NAME = 'udj_enc.db';

// SecureStore keys. The 256-bit SQLCipher key and the one-time migration flag.
const ENCRYPTION_KEY_KEY = 'db_encryption_key';
const MIGRATED_FLAG_KEY = 'db_encrypted_v1';

// Survives reboot (so background sync works) but never leaves this device and
// is not restored to a different device — see CLAUDE.md security decisions.
const SECURE_OPTS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK_THIS_DEVICE_ONLY,
};

let _db: SQLite.SQLiteDatabase | null = null;

/**
 * Returns the hex-encoded 256-bit SQLCipher key, generating and persisting one
 * in SecureStore on first run. Used as a raw key (`x'<hex>'`) so SQLCipher skips
 * PBKDF2 derivation on a value that is already cryptographically random.
 */
async function getEncryptionKey(): Promise<string> {
  const existing = await SecureStore.getItemAsync(ENCRYPTION_KEY_KEY);
  if (existing) return existing;

  const bytes = await Crypto.getRandomBytesAsync(32); // 256-bit
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  await SecureStore.setItemAsync(ENCRYPTION_KEY_KEY, hex, SECURE_OPTS);
  return hex;
}

/**
 * The directory expo-sqlite resolves database names against. Deriving both the
 * ATTACH path (plain filesystem path, consumed by the SQLCipher C layer) and the
 * expo-file-system URIs from this single source guarantees they reference the
 * exact files expo-sqlite opens.
 */
function dbDirectoryPath(): string {
  const dir = SQLite.defaultDatabaseDirectory;
  if (!dir) throw new Error('defaultDatabaseDirectory unavailable on this platform');
  return dir.replace(/\/*$/, '');
}

function dbFilePath(name: string): string {
  return `${dbDirectoryPath()}/${name}`;
}

function dbFile(name: string): File {
  const dir = dbDirectoryPath();
  const uri = dir.startsWith('file://') ? dir : `file://${dir}`;
  return new File(uri, name);
}

/**
 * One-time conversion of a legacy plaintext `udj.db` (shipped on beta devices
 * before SQLCipher) into an encrypted database, preserving all rows including
 * user-authored course_notes, bookmarks and read states.
 *
 * Runs before the encrypted database is opened. Uses SQLCipher's `sqlcipher_export`
 * to copy the plaintext `main` schema into a freshly-keyed attached database, then
 * swaps the encrypted copy into place.
 */
async function migratePlaintextIfNeeded(): Promise<void> {
  if ((await SecureStore.getItemAsync(MIGRATED_FLAG_KEY)) === 'true') return;

  // Fresh install: no legacy plaintext db to convert. openEncrypted() creates an
  // encrypted db directly. Mark migrated so we never treat it as plaintext later.
  if (!dbFile(DB_NAME).exists) {
    await SecureStore.setItemAsync(MIGRATED_FLAG_KEY, 'true', SECURE_OPTS);
    return;
  }

  const key = await getEncryptionKey();
  const encPath = dbFilePath(ENC_TMP_NAME);

  // Clear any half-written temp from a previously interrupted migration.
  const encTmp = dbFile(ENC_TMP_NAME);
  if (encTmp.exists) encTmp.delete();

  const plain = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    // main (plaintext, no key) → encrypted attachment keyed with the raw hex key.
    await plain.execAsync(
      `ATTACH DATABASE '${encPath}' AS encrypted KEY "x'${key}'";` +
        `SELECT sqlcipher_export('encrypted');` +
        `DETACH DATABASE encrypted;`,
    );
  } finally {
    await plain.closeAsync();
  }

  // Drop the plaintext db and its WAL/SHM sidecars so no plaintext page or stale
  // journal sits next to the new encrypted file.
  for (const name of [DB_NAME, `${DB_NAME}-wal`, `${DB_NAME}-shm`]) {
    const f = dbFile(name);
    if (f.exists) f.delete();
  }

  // Promote the encrypted copy to the canonical name expo-sqlite opens.
  encTmp.move(dbFile(DB_NAME));

  await SecureStore.setItemAsync(MIGRATED_FLAG_KEY, 'true', SECURE_OPTS);
}

/**
 * Deletes the encrypted database and its WAL/SHM sidecars. Used by the key-loss
 * recovery path when the stored key can no longer decrypt the file.
 */
function wipeEncryptedDb(): void {
  for (const name of [DB_NAME, `${DB_NAME}-wal`, `${DB_NAME}-shm`]) {
    const f = dbFile(name);
    if (f.exists) f.delete();
  }
}

/**
 * Opens `udj.db`, applies the SQLCipher key as the very first statement, and
 * verifies it can decrypt. If the key no longer matches the file (e.g. SecureStore
 * was cleared by a restore), the cache is unrecoverable: wipe it, mint a fresh key,
 * and return a new empty encrypted db. Cached data re-syncs from the API on next
 * load; locally-authored course notes are the only non-recoverable loss.
 */
async function openEncrypted(): Promise<SQLite.SQLiteDatabase> {
  const key = await getEncryptionKey();
  let db = await SQLite.openDatabaseAsync(DB_NAME);
  try {
    // PRAGMA key MUST precede any other statement (including WAL) on the connection.
    await db.execAsync(`PRAGMA key = "x'${key}'";`);
    // Force a read of the database header to validate the key.
    await db.execAsync('SELECT count(*) FROM sqlite_master;');
  } catch {
    console.warn('[db] SQLCipher key invalid — cache unrecoverable, resetting database');
    await db.closeAsync().catch(() => {});
    wipeEncryptedDb();
    await SecureStore.deleteItemAsync(ENCRYPTION_KEY_KEY);
    await SecureStore.deleteItemAsync(MIGRATED_FLAG_KEY);

    const freshKey = await getEncryptionKey(); // regenerates and stores a new key
    db = await SQLite.openDatabaseAsync(DB_NAME);
    await db.execAsync(`PRAGMA key = "x'${freshKey}'";`);
    // The fresh file is already encrypted; record it as migrated so the legacy
    // plaintext path never tries to re-open it as plaintext.
    await SecureStore.setItemAsync(MIGRATED_FLAG_KEY, 'true', SECURE_OPTS);
  }

  await db.execAsync('PRAGMA journal_mode = WAL;');
  return db;
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!_db) {
    await migratePlaintextIfNeeded();
    _db = await openEncrypted();
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
        threshold REAL NOT NULL DEFAULT 0.85,
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

  // grades: dual-publish markers (Pass C). Nullable timestamps — a non-null
  // value means that phase is published; null means still pending.
  await addColumnSafe(db, 'ALTER TABLE grades ADD COLUMN published_cc_at TEXT');
  await addColumnSafe(db, 'ALTER TABLE grades ADD COLUMN published_nf_at TEXT');

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

  // news_cache: article-detail fields (body is bilingual; author from detail).
  // Populated when an article is opened in the reader — the news list summaries
  // carry no body, so these stay '' until the full article is fetched once.
  await addColumnSafe(db, "ALTER TABLE news_cache ADD COLUMN body_ar TEXT NOT NULL DEFAULT ''");
  await addColumnSafe(db, "ALTER TABLE news_cache ADD COLUMN author TEXT NOT NULL DEFAULT ''");

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

export async function getCachedArticle(id: string): Promise<NewsItem | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<Record<string, SQLite.SQLiteBindValue>>(
    'SELECT * FROM news_cache WHERE id = ?',
    [id],
  );
  return row ? rowToNews(row) : null;
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
    await db.runAsync('DELETE FROM schedules');
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO schedules
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
  if (items.length === 0) return;
  const { studentId, semester } = items[0];
  const db = await getDb();
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM grades WHERE student_id = ? AND semester = ?', [studentId, semester]);
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO grades
          (id, student_id, subject_code, subject_name, subject_name_ar, semester, cc_score,
           exam_score, final_score, coefficient, passed, published_cc_at, published_nf_at, cached_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          item.id,
          item.studentId,
          item.subjectCode,
          item.subjectName,
          item.subjectNameAr ?? '',
          item.semester,
          // null scores bind as SQL NULL — never coerced to 0.
          item.ccScore,
          item.examScore,
          item.finalScore,
          item.coefficient,
          item.passed ? 1 : 0,
          // Presence encodes the publication flag; we only hold booleans, so
          // stamp the sync time when published and leave NULL when pending.
          item.ccPublished ? item.cachedAt : null,
          item.nfPublished ? item.cachedAt : null,
          item.cachedAt,
        ],
      );
    }
  });
}

export async function upsertNews(items: NewsItem[]): Promise<void> {
  if (items.length === 0) return;
  const db = await getDb();
  const freshIds = items.map((n) => n.id);
  const placeholders = freshIds.map(() => '?').join(',');
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM news_cache WHERE id NOT IN (${placeholders})`, freshIds);
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

/**
 * Caches a single article's full detail (bilingual body + author) without
 * touching the rest of the news cache. Unlike upsertNews it does NOT prune
 * other rows, and it preserves the local bookmarked/read state. Non-empty
 * body/body_ar/author overwrite; empty incoming values leave the stored value
 * intact (so a later list sync can't wipe a fetched body).
 */
export async function upsertArticle(item: NewsItem): Promise<void> {
  const db = await getDb();
  await db.runAsync(
    `INSERT INTO news_cache
      (id, title, title_ar, body, body_ar, author, category, published_at,
       read_time_minutes, is_urgent, image_url, bookmarked, read, cached_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
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
       body    = CASE WHEN excluded.body    != '' THEN excluded.body    ELSE news_cache.body    END,
       body_ar = CASE WHEN excluded.body_ar != '' THEN excluded.body_ar ELSE news_cache.body_ar END,
       author  = CASE WHEN excluded.author  != '' THEN excluded.author  ELSE news_cache.author  END`,
    [
      item.id,
      item.title,
      item.titleAr ?? '',
      item.body,
      item.bodyAr ?? '',
      item.author ?? '',
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
    await db.runAsync('DELETE FROM attendance');
    for (const item of items) {
      await db.runAsync(
        `INSERT INTO attendance
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
  if (items.length === 0) return;
  const db = await getDb();
  const freshIds = items.map((n) => n.id);
  const placeholders = freshIds.map(() => '?').join(',');
  await db.withTransactionAsync(async () => {
    await db.runAsync(`DELETE FROM notifications WHERE id NOT IN (${placeholders})`, freshIds);
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
    ccPublished: (row.published_cc_at as string | null) != null,
    nfPublished: (row.published_nf_at as string | null) != null,
    cachedAt: row.cached_at as string,
  };
}

function rowToNews(row: Record<string, SQLite.SQLiteBindValue>): NewsItem {
  return {
    id: row.id as string,
    title: row.title as string,
    titleAr: (row.title_ar as string | null) ?? '',
    body: row.body as string,
    bodyAr: (row.body_ar as string | null) ?? '',
    author: (row.author as string | null) ?? '',
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
