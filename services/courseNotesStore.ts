/**
 * Course notes on the phone: the local copy of the server's notes, and the
 * one-time upload of notes written before the server stored them.
 *
 * The server (/student/course-notes) is the source of truth. The course_notes
 * table holds three kinds of rows:
 *
 *   server copy   server_id set                      a cached copy of a server note
 *   pending       server_id NULL, upload_failed = 0  written on the phone before notes
 *                                                    were stored on the server; waiting
 *                                                    for its one-time upload
 *   device only   server_id NULL, upload_failed = 1  the server refused it (404: the
 *                                                    subject is not in the current
 *                                                    semester, or 400); kept on the phone
 *
 * Logout wipes server copies and keeps the other two (they exist nowhere else).
 *
 * This file has NO runtime imports on purpose: it runs unchanged under Node's
 * test runner against node:sqlite (tests/courseNotes.test.ts), and in the app
 * against expo-sqlite (services/db.ts passes its encrypted connection).
 *
 * PRIVACY: note text never goes to a log or to Sentry. Nothing here logs, and
 * errors are classified by HTTP status only, never printed.
 */

/** The part of expo-sqlite's SQLiteDatabase used here (node:sqlite is wrapped to match in tests). */
export interface SqlDb {
  runAsync(sql: string, params: (string | number | null)[]): Promise<{ changes: number }>;
  getAllAsync<T>(sql: string, params: (string | number | null)[]): Promise<T[]>;
}

/**
 * Additive migration for course_notes, applied with addColumnSafe in
 * services/db.ts runMigrations (the base CREATE TABLE is never edited).
 * Existing rows get server_id NULL, upload_failed 0, student_id NULL:
 * exactly "pending", so every note already on a phone is uploaded once.
 */
export const COURSE_NOTES_MIGRATIONS = [
  // The server's id once the note is on the server. NULL = not on the server.
  'ALTER TABLE course_notes ADD COLUMN server_id TEXT',
  // 1 = the server refused the upload for good (404/400). Not retried; kept on the phone.
  'ALTER TABLE course_notes ADD COLUMN upload_failed INTEGER NOT NULL DEFAULT 0',
  // Who the server copy belongs to. NULL for notes written before this column existed.
  'ALTER TABLE course_notes ADD COLUMN student_id TEXT',
] as const;

/** A note as GET/POST /student/course-notes return it. */
export interface ServerNote {
  id: string;
  subjectCode: string;
  dayOfWeek: number;
  body: string;
  createdAt: string;
  updatedAt?: string;
}

/** A note as the class sheet shows it. */
export interface LocalNote {
  /** Row id in course_notes (equals serverId for notes that came from the server). */
  localId: string;
  serverId: string | null;
  body: string;
  createdAt: string;
  /** Not on the server: the label "Sur cet appareil uniquement", delete is local only. */
  deviceOnly: boolean;
  /** Written before the server stored notes, upload not done yet. Delete is local only. */
  pending: boolean;
}

interface Row {
  id: string;
  server_id: string | null;
  upload_failed: number;
  note: string;
  created_at: string;
}

const toLocal = (r: Row): LocalNote => ({
  localId: r.id,
  serverId: r.server_id,
  body: r.note,
  createdAt: r.created_at,
  deviceOnly: r.server_id === null && r.upload_failed === 1,
  pending: r.server_id === null && r.upload_failed !== 1,
});

/**
 * One class's notes on this phone, newest first: this student's server copies,
 * plus the notes that are not on the server (pending or device only).
 */
export async function readClassNotes(
  db: SqlDb,
  studentId: string,
  subjectCode: string,
  dayOfWeek: number,
): Promise<LocalNote[]> {
  const rows = await db.getAllAsync<Row>(
    `SELECT id, server_id, upload_failed, note, created_at FROM course_notes
     WHERE subject_code = ? AND day_of_week = ?
       AND (server_id IS NULL OR student_id = ?)
     ORDER BY created_at DESC, id DESC`,
    [subjectCode, dayOfWeek, studentId],
  );
  return rows.map(toLocal);
}

/** Store (or refresh) one server note in the local copy. A row already carrying that server id is updated, not duplicated. */
export async function putServerNote(db: SqlDb, studentId: string, n: ServerNote): Promise<void> {
  const { changes } = await db.runAsync(
    `UPDATE course_notes SET subject_code = ?, day_of_week = ?, note = ?, created_at = ?, student_id = ?, upload_failed = 0
     WHERE server_id = ?`,
    [n.subjectCode, n.dayOfWeek, n.body, n.createdAt, studentId, n.id],
  );
  if (changes > 0) return;
  await db.runAsync(
    `INSERT OR REPLACE INTO course_notes (id, subject_code, day_of_week, note, created_at, server_id, upload_failed, student_id)
     VALUES (?, ?, ?, ?, ?, ?, 0, ?)`,
    [n.id, n.subjectCode, n.dayOfWeek, n.body, n.createdAt, n.id, studentId],
  );
}

/**
 * After a successful GET for one class: make the local copy of that class match
 * the server. Server copies the server no longer has are removed; rows that are
 * not on the server (pending, device only) are never touched.
 */
export async function replaceClassCopy(
  db: SqlDb,
  studentId: string,
  subjectCode: string,
  dayOfWeek: number,
  notes: ServerNote[],
): Promise<void> {
  for (const n of notes) await putServerNote(db, studentId, n);
  const keep = notes.map((n) => n.id);
  await db.runAsync(
    `DELETE FROM course_notes
     WHERE server_id IS NOT NULL AND subject_code = ? AND day_of_week = ?
       AND (student_id = ? OR student_id IS NULL)
       ${keep.length ? `AND server_id NOT IN (${keep.map(() => '?').join(', ')})` : ''}`,
    [subjectCode, dayOfWeek, studentId, ...keep],
  );
}

/** Remove one row from the phone (after the server confirmed the delete, or for a note that is not on the server). */
export async function removeLocalNote(db: SqlDb, localId: string): Promise<void> {
  await db.runAsync('DELETE FROM course_notes WHERE id = ?', [localId]);
}

/**
 * Logout: wipe every note that is on the server (it comes back from the server
 * at the next sign-in). Keep every note that is not on the server: pending ones
 * (their upload is still to come) and device-only ones (the phone holds the
 * only copy). Returns how many rows were wiped.
 */
export async function wipeServerCopies(db: SqlDb): Promise<number> {
  const { changes } = await db.runAsync('DELETE FROM course_notes WHERE server_id IS NOT NULL', []);
  return changes;
}

// ─── One-time upload ────────────────────────────────────────────────────────

export interface PendingNote {
  localId: string;
  subjectCode: string;
  dayOfWeek: number;
  body: string;
  createdAt: string;
}

export async function listPendingUploads(db: SqlDb): Promise<PendingNote[]> {
  const rows = await db.getAllAsync<{ id: string; subject_code: string; day_of_week: number; note: string; created_at: string }>(
    `SELECT id, subject_code, day_of_week, note, created_at FROM course_notes
     WHERE server_id IS NULL AND upload_failed = 0
     ORDER BY created_at ASC, id ASC`,
    [],
  );
  return rows.map((r) => ({ localId: r.id, subjectCode: r.subject_code, dayOfWeek: r.day_of_week, body: r.note, createdAt: r.created_at }));
}

/** Uploads stay under the server's 60 POST/min: one every 1.1 s is at most 55 a minute. */
export const UPLOAD_INTERVAL_MS = 1100;

export interface UploadDeps {
  db: SqlDb;
  /** POST /student/course-notes. Resolves with the created note (201); rejects with the HTTP error. */
  post: (n: { subjectCode: string; dayOfWeek: number; body: string; createdAt: string }) => Promise<ServerNote>;
  /** HTTP status of a rejected post, or undefined when no response came back (network error, timeout). */
  statusOf: (err: unknown) => number | undefined;
  /** The signed-in student right now, or null. Checked before every POST so a logout stops the upload. */
  currentStudentId: () => string | null;
  isOnline: () => boolean;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  intervalMs?: number;
}

export type UploadStop = 'done' | 'offline' | 'network' | 'server' | 'rate_limited' | 'signed_out';

export interface UploadResult {
  uploaded: number;
  /** Refused for good (404/400): marked device only. */
  keptOnDevice: number;
  stop: UploadStop;
}

/**
 * Upload each pending note once, oldest first, with its original date.
 *
 * - 201: the server id is stored on that row right away, before the next POST,
 *   so a crash part-way through never sends an uploaded note again.
 * - 404 / 400: marked upload_failed (not retried at every launch), kept on the phone.
 * - No response, 5xx, 429: stop; the rest wait for a later launch or reconnect.
 * - 401 / 403 or a different student signed in: stop.
 *
 * The only window left for a duplicate is a crash between the server's 201 and
 * the local write that records it (the API has no idempotency key).
 */
export async function uploadPendingNotes(deps: UploadDeps, studentId: string): Promise<UploadResult> {
  const interval = deps.intervalMs ?? UPLOAD_INTERVAL_MS;
  const result: UploadResult = { uploaded: 0, keptOnDevice: 0, stop: 'done' };
  const pending = await listPendingUploads(deps.db);
  let lastPostAt: number | null = null;

  for (const note of pending) {
    if (lastPostAt !== null) {
      const wait = lastPostAt + interval - deps.now();
      if (wait > 0) await deps.sleep(wait);
    }
    // Checked after the wait, right before sending: a logout during the wait stops here.
    if (deps.currentStudentId() !== studentId) return { ...result, stop: 'signed_out' };
    if (!deps.isOnline()) return { ...result, stop: 'offline' };
    // Still pending? The student may have deleted it from the sheet meanwhile.
    const still = await deps.db.getAllAsync<{ id: string }>(
      'SELECT id FROM course_notes WHERE id = ? AND server_id IS NULL AND upload_failed = 0',
      [note.localId],
    );
    if (!still.length) continue;
    lastPostAt = deps.now();

    let created: ServerNote;
    try {
      created = await deps.post({ subjectCode: note.subjectCode, dayOfWeek: note.dayOfWeek, body: note.body, createdAt: note.createdAt });
    } catch (err) {
      const status = deps.statusOf(err);
      if (status === 404 || status === 400) {
        await deps.db.runAsync('UPDATE course_notes SET upload_failed = 1 WHERE id = ? AND server_id IS NULL', [note.localId]);
        result.keptOnDevice++;
        continue;
      }
      if (status === undefined) return { ...result, stop: 'network' };
      if (status === 429) return { ...result, stop: 'rate_limited' };
      if (status === 401 || status === 403) return { ...result, stop: 'signed_out' };
      return { ...result, stop: 'server' };
    }

    // Recorded at once, one note at a time. Kept even if a logout happened during
    // the POST: the note IS on the server now, and forgetting that would upload it twice.
    await deps.db.runAsync(
      'UPDATE course_notes SET server_id = ?, student_id = ?, upload_failed = 0 WHERE id = ?',
      [created.id, studentId, note.localId],
    );
    result.uploaded++;
  }
  return result;
}
