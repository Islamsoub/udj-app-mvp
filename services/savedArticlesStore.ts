/**
 * Saved news articles on the phone: the local copy of the server's saves, and
 * the one-time upload of saves made before the server stored them.
 *
 * The server (/student/saved-articles) is the source of truth. The
 * saved_articles table holds two kinds of rows:
 *
 *   server copy   state 'server'    a save the server has confirmed, cached
 *                                   for offline display; owner = the student
 *   pending       state 'pending'   a save made on the phone before saves
 *                                   were stored on the server (the old
 *                                   news_cache.bookmarked); waiting for its
 *                                   one-time upload
 *
 * `owner` is the student id. A legacy save carries '' until a signed-in
 * student claims it at the start of an upload run: the phone never recorded
 * who saved what, but until now every logout emptied news_cache (and its
 * bookmarked column) through clearAllCache, so any save still on the phone at
 * upgrade time belongs to the student signed in then.
 *
 * WHY A TABLE OF ITS OWN, and not only news_cache.bookmarked: news_cache is a
 * cache. clearAllCache (logout) and the storage screen empty it, and a list
 * sync prunes it. A save waiting for its upload exists nowhere else, so it
 * cannot live there. news_cache.bookmarked stays, as the DISPLAY flag the list
 * and the reader already read, recomputed from this table by
 * refreshBookmarkFlags and written by nothing else.
 *
 * Logout wipes the server copies and keeps the pending saves (they exist
 * nowhere else) until a later upload succeeds.
 *
 * This file has NO runtime imports on purpose: it runs unchanged under Node's
 * test runner against node:sqlite (tests/savedArticles.test.ts), and in the
 * app against expo-sqlite (services/db.ts passes its encrypted connection).
 */

/** The part of expo-sqlite's SQLiteDatabase used here (node:sqlite is wrapped to match in tests). */
export interface SqlDb {
  runAsync(sql: string, params: (string | number | null)[]): Promise<{ changes: number }>;
  getAllAsync<T>(sql: string, params: (string | number | null)[]): Promise<T[]>;
}

// ─── Migration ───────────────────────────────────────────────────────────────

/**
 * A NEW table, created with IF NOT EXISTS by runMigrations (services/db.ts).
 * No existing CREATE TABLE is edited and no column of an existing table
 * changes: it is additive.
 */
export const SAVED_ARTICLES_TABLE = `CREATE TABLE IF NOT EXISTS saved_articles (
  owner TEXT NOT NULL DEFAULT '',
  article_id TEXT NOT NULL,
  state TEXT NOT NULL,
  PRIMARY KEY (owner, article_id)
)`;

/** The schema_version at which the legacy saves were copied in (runs once). */
export const SAVED_ARTICLES_SCHEMA_VERSION = 1;

/**
 * One-time copy of the saves the phone made before the server stored them:
 * every news_cache row with bookmarked = 1 becomes a pending, unclaimed save.
 * Gated on schema_version (services/db.ts), because after this point
 * bookmarked is a flag derived from this table and copying it again would
 * turn server copies into pending saves.
 */
export const SEED_LEGACY_SAVES = `INSERT OR IGNORE INTO saved_articles (owner, article_id, state)
  SELECT '', id, 'pending' FROM news_cache WHERE bookmarked = 1`;

// ─── Local copy ──────────────────────────────────────────────────────────────

/**
 * Claims the unclaimed legacy saves for the signed-in student. A save that
 * student already has (a server copy of the same article) wins over the
 * legacy one, which is then dropped. Returns how many were claimed.
 */
export async function claimLegacySaves(db: SqlDb, studentId: string): Promise<number> {
  const { changes } = await db.runAsync(
    `INSERT OR IGNORE INTO saved_articles (owner, article_id, state)
     SELECT ?, article_id, 'pending' FROM saved_articles WHERE owner = ''`,
    [studentId],
  );
  await db.runAsync(`DELETE FROM saved_articles WHERE owner = ''`, []);
  return changes;
}

/** The ids this student has saved on this phone (server copies and pending). */
export async function savedIdsFor(db: SqlDb, studentId: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ article_id: string }>(
    `SELECT article_id FROM saved_articles WHERE owner = ? OR owner = '' ORDER BY article_id`,
    [studentId],
  );
  return rows.map((r) => r.article_id);
}

/**
 * The display flag: news_cache.bookmarked = 1 exactly for this student's saves
 * (and any unclaimed legacy one), 0 for every other row. With no student (after
 * logout) every flag is 0. The only writer of news_cache.bookmarked.
 */
export async function refreshBookmarkFlags(db: SqlDb, studentId: string | null): Promise<void> {
  await db.runAsync(
    `UPDATE news_cache SET bookmarked = CASE
       WHEN id IN (SELECT article_id FROM saved_articles WHERE owner = ? OR owner = '') THEN 1
       ELSE 0 END`,
    [studentId ?? '\u0000'],
  );
}

/**
 * After a successful GET /student/saved-articles: make this student's local
 * copy match the server. Every id the server holds becomes a server copy (a
 * pending save the server already has is simply confirmed); a server copy the
 * server no longer holds (unsaved on another device) is removed. Pending saves
 * the server does not hold yet are left for the upload.
 */
export async function replaceServerCopy(db: SqlDb, studentId: string, serverIds: string[]): Promise<void> {
  for (const id of serverIds) {
    await db.runAsync(
      `INSERT OR REPLACE INTO saved_articles (owner, article_id, state) VALUES (?, ?, 'server')`,
      [studentId, id],
    );
  }
  await db.runAsync(
    `DELETE FROM saved_articles WHERE owner = ? AND state = 'server'
       ${serverIds.length ? `AND article_id NOT IN (${serverIds.map(() => '?').join(', ')})` : ''}`,
    [studentId, ...serverIds],
  );
}

/** After the server's 204 on PUT: a confirmed save. */
export async function recordSaved(db: SqlDb, studentId: string, articleId: string): Promise<void> {
  await db.runAsync(
    `INSERT OR REPLACE INTO saved_articles (owner, article_id, state) VALUES (?, ?, 'server')`,
    [studentId, articleId],
  );
}

/** After the server's 204 on DELETE: no save left, server copy or pending. */
export async function recordUnsaved(db: SqlDb, studentId: string, articleId: string): Promise<void> {
  await db.runAsync(
    `DELETE FROM saved_articles WHERE article_id = ? AND (owner = ? OR owner = '')`,
    [articleId, studentId],
  );
}

/**
 * Logout: wipe every server copy (they come back from the server at the next
 * sign-in). Keep every pending save, claimed or not: it exists nowhere else,
 * and stays until a later upload succeeds. Returns how many rows were wiped.
 */
export async function wipeServerCopies(db: SqlDb): Promise<number> {
  const { changes } = await db.runAsync(`DELETE FROM saved_articles WHERE state = 'server'`, []);
  return changes;
}

// ─── One-time upload ────────────────────────────────────────────────────────

export async function listPendingSaves(db: SqlDb, studentId: string): Promise<string[]> {
  const rows = await db.getAllAsync<{ article_id: string }>(
    `SELECT article_id FROM saved_articles WHERE owner = ? AND state = 'pending' ORDER BY article_id`,
    [studentId],
  );
  return rows.map((r) => r.article_id);
}

/** Under the server's 60 PUT/min: one every 1.1 s is at most 55 a minute. */
export const UPLOAD_INTERVAL_MS = 1100;

export interface UploadDeps {
  db: SqlDb;
  /** PUT /student/saved-articles/:id, no body (the phone never stored a save
   *  date). Resolves on 204; rejects with the HTTP error. */
  put: (articleId: string) => Promise<void>;
  /** HTTP status of a rejected put, or undefined when no response came back (network error, timeout). */
  statusOf: (err: unknown) => number | undefined;
  /** The signed-in student right now, or null. Checked before every PUT so a logout stops the upload. */
  currentStudentId: () => string | null;
  isOnline: () => boolean;
  sleep: (ms: number) => Promise<void>;
  now: () => number;
  intervalMs?: number;
}

export type UploadStop = 'done' | 'offline' | 'network' | 'server' | 'rate_limited' | 'signed_out';

export interface UploadResult {
  uploaded: number;
  /** 404 (the article was deleted or is not published): unmarked on the phone. */
  dropped: number;
  stop: UploadStop;
}

/**
 * Upload each pending save once, paced under 60 a minute.
 *
 * - First, the unclaimed legacy saves are claimed for this student.
 * - 204: the row becomes a server copy at once, before the next PUT, so a crash
 *   part-way through never sends it again (PUT is idempotent anyway).
 * - 404: the article is gone or unpublished. The save is removed from the
 *   phone (unmarked) and not retried.
 * - No response or 5xx: stop; the rest wait for a later launch or reconnect.
 * - 429: stop (the caller retries in a minute). 401 / 403, or a different
 *   student signed in: stop.
 */
export async function uploadPendingSaves(deps: UploadDeps, studentId: string): Promise<UploadResult> {
  const interval = deps.intervalMs ?? UPLOAD_INTERVAL_MS;
  const result: UploadResult = { uploaded: 0, dropped: 0, stop: 'done' };

  await claimLegacySaves(deps.db, studentId);
  const pending = await listPendingSaves(deps.db, studentId);
  let lastPutAt: number | null = null;

  for (const articleId of pending) {
    if (lastPutAt !== null) {
      const wait = lastPutAt + interval - deps.now();
      if (wait > 0) await deps.sleep(wait);
    }
    // Checked after the wait, right before sending: a logout during the wait stops here.
    if (deps.currentStudentId() !== studentId) return { ...result, stop: 'signed_out' };
    if (!deps.isOnline()) return { ...result, stop: 'offline' };
    // Still pending? The student may have unsaved it meanwhile, or a GET may
    // already have confirmed it.
    const still = await deps.db.getAllAsync<{ article_id: string }>(
      `SELECT article_id FROM saved_articles WHERE owner = ? AND article_id = ? AND state = 'pending'`,
      [studentId, articleId],
    );
    if (!still.length) continue;
    lastPutAt = deps.now();

    try {
      await deps.put(articleId);
    } catch (err) {
      const status = deps.statusOf(err);
      if (status === 404) {
        await deps.db.runAsync(
          `DELETE FROM saved_articles WHERE owner = ? AND article_id = ? AND state = 'pending'`,
          [studentId, articleId],
        );
        result.dropped++;
        continue;
      }
      if (status === undefined) return { ...result, stop: 'network' };
      if (status === 429) return { ...result, stop: 'rate_limited' };
      if (status === 401 || status === 403) return { ...result, stop: 'signed_out' };
      return { ...result, stop: 'server' };
    }

    // Recorded at once, one save at a time. Kept even if a logout happened
    // during the PUT: the save IS on the server now.
    await deps.db.runAsync(
      `UPDATE saved_articles SET state = 'server' WHERE owner = ? AND article_id = ?`,
      [studentId, articleId],
    );
    result.uploaded++;
  }
  return result;
}
