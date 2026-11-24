// Unit tests for saved news articles: the local copy, the one-time upload of the
// saves made on the phone before the server stored them, and the logout rule.
// Real SQL on node:sqlite (same SQLite as the app, minus the encryption), a fake
// server and a fake clock. Run: npm test  (node --test, Node 22.18+ / 23.6+).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  SAVED_ARTICLES_TABLE,
  SEED_LEGACY_SAVES,
  UPLOAD_INTERVAL_MS,
  listPendingSaves,
  recordSaved,
  recordUnsaved,
  refreshBookmarkFlags,
  replaceServerCopy,
  savedIdsFor,
  uploadPendingSaves,
  wipeServerCopies,
  type SqlDb,
  type UploadDeps,
} from '../services/savedArticlesStore.ts';

const ME = 'student-1';
const OTHER = 'student-2';

// news_cache as services/db.ts has it, reduced to the columns these queries use.
const NEWS_CACHE = `CREATE TABLE news_cache (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL DEFAULT '',
  bookmarked INTEGER NOT NULL DEFAULT 0
);`;

function wrap(d: DatabaseSync): SqlDb {
  return {
    async runAsync(sql, params) {
      const r = d.prepare(sql).run(...params);
      return { changes: Number(r.changes) };
    },
    async getAllAsync<T>(sql: string, params: (string | number | null)[]) {
      return d.prepare(sql).all(...params) as T[];
    },
  };
}

/**
 * A phone from before this change: `saved` articles bookmarked in news_cache,
 * `others` cached but not saved. Then the migration, as runMigrations runs it
 * the first time (the new table, then the once-only seed).
 */
function upgradedPhone(saved: string[], others: string[] = []) {
  const d = new DatabaseSync(':memory:');
  d.exec(NEWS_CACHE);
  const ins = d.prepare('INSERT INTO news_cache (id, title, bookmarked) VALUES (?, ?, ?)');
  for (const id of saved) ins.run(id, `title ${id}`, 1);
  for (const id of others) ins.run(id, `title ${id}`, 0);
  d.exec(SAVED_ARTICLES_TABLE);
  d.exec(SEED_LEGACY_SAVES);
  return { d, db: wrap(d) };
}

/** node:sqlite returns null-prototype rows; copied into plain objects so
 *  deepStrictEqual compares the values only. */
function rows(d: DatabaseSync) {
  return (
    d.prepare('SELECT owner, article_id, state FROM saved_articles ORDER BY owner, article_id').all() as {
      owner: string;
      article_id: string;
      state: string;
    }[]
  ).map((r) => ({ ...r }));
}

function flags(d: DatabaseSync): Record<string, number> {
  const out: Record<string, number> = {};
  for (const r of d.prepare('SELECT id, bookmarked FROM news_cache ORDER BY id').all() as { id: string; bookmarked: number }[]) {
    out[r.id] = r.bookmarked;
  }
  return out;
}

/** Error shapes the app's httpStatusOf reads. */
const httpError = (status: number) => Object.assign(new Error(`HTTP ${status}`), { status });
const networkError = () => new Error('Network Error');

/**
 * A fake server and clock. `respond(id, call)` decides each PUT: return to
 * resolve (204), throw to reject. Records every PUT and every sleep.
 */
function deps(db: SqlDb, opts: {
  respond?: (id: string, call: number) => void;
  student?: () => string | null;
  online?: () => boolean;
  sleep?: (ms: number) => Promise<void>;
} = {}) {
  let clock = 0;
  const puts: string[] = [];
  const sleeps: number[] = [];
  const d: UploadDeps = {
    db,
    put: async (id) => {
      puts.push(id);
      opts.respond?.(id, puts.length);
    },
    statusOf: (err) => (err as { status?: number }).status,
    currentStudentId: opts.student ?? (() => ME),
    isOnline: opts.online ?? (() => true),
    sleep:
      opts.sleep ??
      (async (ms) => {
        sleeps.push(ms);
        clock += ms;
      }),
    now: () => clock,
  };
  return { d, puts, sleeps };
}

// ── Migration ────────────────────────────────────────────────────────────────

test('migration: every legacy save becomes one pending, unclaimed save; unsaved rows are not copied', () => {
  const { d } = upgradedPhone(['a1', 'a2'], ['x1']);
  assert.deepEqual(rows(d), [
    { owner: '', article_id: 'a1', state: 'pending' },
    { owner: '', article_id: 'a2', state: 'pending' },
  ]);
});

// ── Upload: success ──────────────────────────────────────────────────────────

test('upload: each legacy save is claimed, PUT once, and becomes a server copy, paced under 60 a minute', async () => {
  const { d, db } = upgradedPhone(['a1', 'a2', 'a3'], ['x1']);
  const { d: up, puts, sleeps } = deps(db);

  const result = await uploadPendingSaves(up, ME);

  assert.deepEqual(result, { uploaded: 3, dropped: 0, stop: 'done' });
  assert.deepEqual(puts, ['a1', 'a2', 'a3']);
  // No wait before the first, one interval before each of the others: at most
  // 60000 / 1100 = 54 a minute.
  assert.deepEqual(sleeps, [UPLOAD_INTERVAL_MS, UPLOAD_INTERVAL_MS]);
  assert.ok(60_000 / UPLOAD_INTERVAL_MS < 60);
  assert.deepEqual(rows(d), [
    { owner: ME, article_id: 'a1', state: 'server' },
    { owner: ME, article_id: 'a2', state: 'server' },
    { owner: ME, article_id: 'a3', state: 'server' },
  ]);

  // Nothing left: a second run sends nothing.
  const again = deps(db);
  assert.deepEqual(await uploadPendingSaves(again.d, ME), { uploaded: 0, dropped: 0, stop: 'done' });
  assert.deepEqual(again.puts, []);

  await refreshBookmarkFlags(db, ME);
  assert.deepEqual(flags(d), { a1: 1, a2: 1, a3: 1, x1: 0 });
});

// ── Upload: crash halfway ────────────────────────────────────────────────────

test('upload: a crash halfway never repeats a save already confirmed', async () => {
  const { d, db } = upgradedPhone(['a1', 'a2', 'a3', 'a4']);
  // The app dies during the wait after the second 204.
  let waits = 0;
  const crashing = deps(db, {
    sleep: async () => {
      waits++;
      if (waits === 2) throw new Error('process killed');
    },
  });

  await assert.rejects(uploadPendingSaves(crashing.d, ME), /process killed/);
  assert.deepEqual(crashing.puts, ['a1', 'a2']);
  // Both recorded right after their 204, before the crash.
  assert.deepEqual(await listPendingSaves(db, ME), ['a3', 'a4']);

  // Next launch: only the two that never went.
  const relaunch = deps(db);
  assert.deepEqual(await uploadPendingSaves(relaunch.d, ME), { uploaded: 2, dropped: 0, stop: 'done' });
  assert.deepEqual(relaunch.puts, ['a3', 'a4']);
  assert.equal(rows(d).filter((r) => r.state === 'server').length, 4);
});

// ── Upload: 404 ──────────────────────────────────────────────────────────────

test('upload: 404 (article gone or unpublished) unmarks the save on the phone and is not retried', async () => {
  const { d, db } = upgradedPhone(['a1', 'gone', 'a3']);
  const run = deps(db, {
    respond: (id) => {
      if (id === 'gone') throw httpError(404);
    },
  });

  assert.deepEqual(await uploadPendingSaves(run.d, ME), { uploaded: 2, dropped: 1, stop: 'done' });
  // Sent in article-id order (the phone has no save date to order by).
  assert.deepEqual(run.puts, ['a1', 'a3', 'gone']);
  assert.deepEqual(await savedIdsFor(db, ME), ['a1', 'a3']);

  await refreshBookmarkFlags(db, ME);
  assert.equal(flags(d).gone, 0, 'unmarked in the list too');

  const again = deps(db);
  await uploadPendingSaves(again.d, ME);
  assert.deepEqual(again.puts, [], 'the 404 is not sent again');
});

// ── Upload: network error / 5xx ──────────────────────────────────────────────

test('upload: a network error stops the run; the rest is retried on a later run, without repeats', async () => {
  const { db } = upgradedPhone(['a1', 'a2', 'a3']);
  const run = deps(db, {
    respond: (id) => {
      if (id === 'a2') throw networkError();
    },
  });

  assert.deepEqual(await uploadPendingSaves(run.d, ME), { uploaded: 1, dropped: 0, stop: 'network' });
  assert.deepEqual(run.puts, ['a1', 'a2']);
  assert.deepEqual(await listPendingSaves(db, ME), ['a2', 'a3'], 'a2 is still pending, not dropped');

  // Reconnect.
  const retry = deps(db);
  assert.deepEqual(await uploadPendingSaves(retry.d, ME), { uploaded: 2, dropped: 0, stop: 'done' });
  assert.deepEqual(retry.puts, ['a2', 'a3']);
});

test('upload: a 5xx stops the run the same way, and the save stays pending', async () => {
  const { db } = upgradedPhone(['a1', 'a2']);
  const run = deps(db, {
    respond: (id) => {
      if (id === 'a1') throw httpError(503);
    },
  });
  assert.deepEqual(await uploadPendingSaves(run.d, ME), { uploaded: 0, dropped: 0, stop: 'server' });
  assert.deepEqual(await listPendingSaves(db, ME), ['a1', 'a2']);
});

test('upload: 429 stops the run (the caller retries in a minute); nothing is dropped', async () => {
  const { db } = upgradedPhone(['a1', 'a2']);
  const run = deps(db, {
    respond: () => {
      throw httpError(429);
    },
  });
  assert.deepEqual(await uploadPendingSaves(run.d, ME), { uploaded: 0, dropped: 0, stop: 'rate_limited' });
  assert.deepEqual(await listPendingSaves(db, ME), ['a1', 'a2']);
});

test('upload: offline, or signed out during the wait, stops before the next PUT', async () => {
  const { db } = upgradedPhone(['a1', 'a2']);
  let student: string | null = ME;
  const run = deps(db, {
    student: () => student,
    sleep: async () => {
      student = null; // logout during the pause
    },
  });
  assert.deepEqual(await uploadPendingSaves(run.d, ME), { uploaded: 1, dropped: 0, stop: 'signed_out' });
  assert.deepEqual(run.puts, ['a1']);

  const offline = deps(db, { online: () => false });
  assert.equal((await uploadPendingSaves(offline.d, ME)).stop, 'offline');
  assert.deepEqual(offline.puts, []);
});

test('upload: a save unsaved meanwhile, or already confirmed by a GET, is not sent', async () => {
  const { db } = upgradedPhone(['a1', 'a2', 'a3']);
  const run = deps(db, {
    sleep: async () => {
      // During the first pause: a2 is unsaved, a3 comes back from GET.
      await recordUnsaved(db, ME, 'a2');
      await replaceServerCopy(db, ME, ['a1', 'a3']);
    },
  });
  await uploadPendingSaves(run.d, ME);
  assert.deepEqual(run.puts, ['a1']);
});

// ── Logout ───────────────────────────────────────────────────────────────────

test('logout: server copies are wiped, saves not yet uploaded are kept, and upload later', async () => {
  const { d, db } = upgradedPhone(['a1', 'a2', 'a3']);
  // a1 goes up, then the network drops: a2 and a3 are still pending.
  const run = deps(db, {
    respond: (id) => {
      if (id === 'a2') throw networkError();
    },
  });
  await uploadPendingSaves(run.d, ME);
  await recordSaved(db, ME, 'b1'); // a save made through the server since

  assert.equal(await wipeServerCopies(db), 2, 'a1 and b1');
  assert.deepEqual(rows(d), [
    { owner: ME, article_id: 'a2', state: 'pending' },
    { owner: ME, article_id: 'a3', state: 'pending' },
  ]);

  // Another student signs in on the same phone: not theirs, never uploaded.
  const other = deps(db, { student: () => OTHER });
  assert.deepEqual(await uploadPendingSaves(other.d, OTHER), { uploaded: 0, dropped: 0, stop: 'done' });
  assert.deepEqual(other.puts, []);
  assert.deepEqual(await savedIdsFor(db, OTHER), [], 'and not shown to them');

  // The owner signs in again: the two upload, once.
  const back = deps(db);
  assert.deepEqual(await uploadPendingSaves(back.d, ME), { uploaded: 2, dropped: 0, stop: 'done' });
  assert.deepEqual(back.puts, ['a2', 'a3']);
  assert.equal(await wipeServerCopies(db), 2);
  assert.deepEqual(rows(d), []);
});

test('logout before the first upload: unclaimed legacy saves are kept too', async () => {
  const { d, db } = upgradedPhone(['a1']);
  assert.equal(await wipeServerCopies(db), 0);
  assert.deepEqual(rows(d), [{ owner: '', article_id: 'a1', state: 'pending' }]);
});

// ── Local copy ───────────────────────────────────────────────────────────────

test('replaceServerCopy: matches the server, keeps pending saves the server does not have yet', async () => {
  const { d, db } = upgradedPhone([], ['s1', 's2', 's3', 'p1']);
  await recordSaved(db, ME, 's1');
  await recordSaved(db, ME, 's2');
  await db.runAsync(`INSERT INTO saved_articles (owner, article_id, state) VALUES (?, 'p1', 'pending')`, [ME]);

  // Server: s2 still saved, s1 unsaved on another device, s3 saved elsewhere.
  await replaceServerCopy(db, ME, ['s2', 's3']);
  assert.deepEqual(rows(d), [
    { owner: ME, article_id: 'p1', state: 'pending' },
    { owner: ME, article_id: 's2', state: 'server' },
    { owner: ME, article_id: 's3', state: 'server' },
  ]);

  await refreshBookmarkFlags(db, ME);
  assert.deepEqual(flags(d), { p1: 1, s1: 0, s2: 1, s3: 1 });

  // Signed out: no flag left.
  await refreshBookmarkFlags(db, null);
  assert.deepEqual(flags(d), { p1: 0, s1: 0, s2: 0, s3: 0 });
});

test('recordSaved / recordUnsaved: only after the server confirmed; unsave also clears a pending save', async () => {
  const { d, db } = upgradedPhone(['legacy'], ['n1']);
  await recordSaved(db, ME, 'n1');
  await recordUnsaved(db, ME, 'legacy');
  assert.deepEqual(rows(d), [{ owner: ME, article_id: 'n1', state: 'server' }]);
});
