// Unit tests for the course-notes local copy, one-time upload and logout rule.
// Real SQL on node:sqlite (same SQLite as the app, minus the encryption), a fake
// server and a fake clock. Run: npm test  (node --test, Node 22.18+ / 23.6+).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  COURSE_NOTES_MIGRATIONS,
  UPLOAD_INTERVAL_MS,
  listPendingUploads,
  putServerNote,
  readClassNotes,
  removeLocalNote,
  replaceClassCopy,
  uploadPendingNotes,
  wipeServerCopies,
  type ServerNote,
  type SqlDb,
  type UploadDeps,
} from '../services/courseNotesStore.ts';

const ME = 'student-1';

// The base table exactly as services/db.ts creates it (never edited).
const BASE_TABLE = `CREATE TABLE IF NOT EXISTS course_notes (
  id TEXT PRIMARY KEY,
  subject_code TEXT NOT NULL,
  day_of_week INTEGER NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL
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

/** Same as services/db.ts addColumnSafe: run, ignore "duplicate column". */
function migrate(d: DatabaseSync) {
  for (const sql of COURSE_NOTES_MIGRATIONS) {
    try { d.exec(sql); } catch { /* column already exists */ }
  }
}

/** A phone with notes written before the server stored them (old schema), then migrated. */
function phoneWithLegacyNotes(count: number, code = 'INF101', day = 1) {
  const d = new DatabaseSync(':memory:');
  d.exec(BASE_TABLE);
  const ins = d.prepare('INSERT INTO course_notes (id, subject_code, day_of_week, note, created_at) VALUES (?, ?, ?, ?, ?)');
  for (let i = 0; i < count; i++) {
    ins.run(`local-${i}`, code, day, `note ${i}`, new Date(Date.UTC(2026, 9, 1, 8, i)).toISOString());
  }
  migrate(d);
  return { d, db: wrap(d) };
}

const row = (d: DatabaseSync, id: string) =>
  d.prepare('SELECT * FROM course_notes WHERE id = ?').get(id) as Record<string, unknown> | undefined;

class HttpError extends Error {
  status: number | undefined;
  constructor(status?: number) {
    super(status ? `HTTP ${status}` : 'Network Error');
    this.status = status;
  }
}

/** A fake API + clock. `respond(n, body)` decides each answer (default 201). */
function fakeServer(respond?: (call: number, body: string) => number | 'network' | undefined) {
  let clock = 1_000_000;
  const calls: { at: number; body: string; createdAt: string }[] = [];
  const stored = new Map<string, ServerNote>();
  let seq = 0;
  const deps = (db: SqlDb, over: Partial<UploadDeps> = {}): UploadDeps => ({
    db,
    post: async (n) => {
      calls.push({ at: clock, body: n.body, createdAt: n.createdAt });
      const r = respond?.(calls.length, n.body);
      if (r === 'network') throw new HttpError(undefined);
      if (typeof r === 'number' && r !== 201) throw new HttpError(r);
      const note: ServerNote = { id: `00000000-0000-4000-8000-${String(++seq).padStart(12, '0')}`, ...n };
      stored.set(note.id, note);
      return note;
    },
    statusOf: (e) => (e instanceof HttpError ? e.status : undefined),
    currentStudentId: () => ME,
    isOnline: () => true,
    sleep: async (ms) => { clock += ms; },
    now: () => clock,
    ...over,
  });
  return { deps, calls, stored, tick: (ms: number) => { clock += ms; } };
}

test('migration is additive: old notes survive and come out pending; running it again is harmless', async () => {
  const { d, db } = phoneWithLegacyNotes(3);
  migrate(d); // second launch
  const cols = (d.prepare('PRAGMA table_info(course_notes)').all() as { name: string }[]).map((c) => c.name);
  assert.deepEqual(cols, ['id', 'subject_code', 'day_of_week', 'note', 'created_at', 'server_id', 'upload_failed', 'student_id']);
  assert.equal((await listPendingUploads(db)).length, 3);
  assert.deepEqual({ ...row(d, 'local-0') }, {
    id: 'local-0', subject_code: 'INF101', day_of_week: 1, note: 'note 0',
    created_at: '2026-10-01T08:00:00.000Z', server_id: null, upload_failed: 0, student_id: null,
  });
});

test('success: every note is sent once, oldest first, with its original date, and its server id is stored', async () => {
  const { d, db } = phoneWithLegacyNotes(5);
  const s = fakeServer();
  const r = await uploadPendingNotes(s.deps(db), ME);
  assert.deepEqual(r, { uploaded: 5, keptOnDevice: 0, stop: 'done' });
  assert.deepEqual(s.calls.map((c) => c.body), ['note 0', 'note 1', 'note 2', 'note 3', 'note 4']);
  assert.deepEqual(s.calls.map((c) => c.createdAt), [0, 1, 2, 3, 4].map((i) => new Date(Date.UTC(2026, 9, 1, 8, i)).toISOString()));
  for (let i = 0; i < 5; i++) {
    const rw = row(d, `local-${i}`)!;
    assert.ok(typeof rw.server_id === 'string' && s.stored.has(rw.server_id as string));
    assert.equal(rw.student_id, ME);
  }
  // A second launch sends nothing.
  await uploadPendingNotes(s.deps(db), ME);
  assert.equal(s.calls.length, 5);
});

test('pacing: under 60 POSTs in any minute, even for a big backlog', async () => {
  const { db } = phoneWithLegacyNotes(130);
  const s = fakeServer();
  await uploadPendingNotes(s.deps(db), ME);
  assert.equal(s.calls.length, 130);
  for (let i = 1; i < s.calls.length; i++) assert.ok(s.calls[i].at - s.calls[i - 1].at >= UPLOAD_INTERVAL_MS);
  for (const c of s.calls) {
    const inWindow = s.calls.filter((x) => x.at >= c.at && x.at < c.at + 60_000).length;
    assert.ok(inWindow < 60, `${inWindow} POSTs in one minute`);
  }
});

test('crash halfway: the next launch sends only the rest, no note twice', async () => {
  const { d, db } = phoneWithLegacyNotes(6);
  const s = fakeServer();
  // The app is killed while waiting before the 4th POST.
  let posts = 0;
  const crashing = s.deps(db, {
    post: async (n) => { posts++; return s.deps(db).post(n); },
    sleep: async () => { if (posts === 3) throw new Error('process killed'); },
  });
  await assert.rejects(uploadPendingNotes(crashing, ME), /process killed/);
  assert.equal(s.calls.length, 3);
  assert.equal((await listPendingUploads(db)).length, 3);

  // Next launch, a fresh run.
  await uploadPendingNotes(s.deps(db), ME);
  const bodies = s.calls.map((c) => c.body);
  assert.equal(bodies.length, 6);
  assert.equal(new Set(bodies).size, 6, 'no note uploaded twice');
  assert.equal(s.stored.size, 6);
  assert.equal((d.prepare('SELECT COUNT(*) AS n FROM course_notes WHERE server_id IS NULL').get() as { n: number }).n, 0);
});

test('404: marked, kept on the phone, labelled device only, not retried, deletable locally', async () => {
  const { d, db } = phoneWithLegacyNotes(3);
  const s = fakeServer((_n, body) => (body === 'note 1' ? 404 : 201));
  const r = await uploadPendingNotes(s.deps(db), ME);
  assert.deepEqual(r, { uploaded: 2, keptOnDevice: 1, stop: 'done' });
  assert.equal(row(d, 'local-1')!.upload_failed, 1);
  assert.equal(row(d, 'local-1')!.server_id, null);

  // Not retried at the next launch.
  await uploadPendingNotes(s.deps(db), ME);
  assert.equal(s.calls.filter((c) => c.body === 'note 1').length, 1);

  // Shown in its class with the label; the uploaded ones are ordinary notes.
  const shown = await readClassNotes(db, ME, 'INF101', 1);
  assert.equal(shown.length, 3);
  assert.deepEqual(shown.filter((n) => n.deviceOnly).map((n) => n.body), ['note 1']);
  assert.ok(shown.filter((n) => !n.deviceOnly).every((n) => n.serverId && !n.pending));

  await removeLocalNote(db, 'local-1');
  assert.equal(row(d, 'local-1'), undefined);
});

test('network error: stops, keeps the rest pending, and a later run uploads them', async () => {
  const { db } = phoneWithLegacyNotes(4);
  let down = true;
  const s = fakeServer((n) => (down && n === 2 ? 'network' : 201));
  const r = await uploadPendingNotes(s.deps(db), ME);
  assert.deepEqual(r, { uploaded: 1, keptOnDevice: 0, stop: 'network' });
  assert.equal(s.calls.length, 2, 'stopped at the failure, did not carry on');
  assert.equal((await listPendingUploads(db)).length, 3);

  down = false;
  const again = await uploadPendingNotes(s.deps(db), ME);
  assert.deepEqual(again, { uploaded: 3, keptOnDevice: 0, stop: 'done' });
  assert.equal(new Set(s.calls.filter((c) => c.body !== 'note 1').map((c) => c.body)).size, 3);
  assert.equal(s.stored.size, 4);
});

test('5xx and 429 stop the run and retry later; nothing is marked failed', async () => {
  for (const status of [500, 503, 429]) {
    const { d, db } = phoneWithLegacyNotes(2);
    const s = fakeServer(() => status);
    const r = await uploadPendingNotes(s.deps(db), ME);
    assert.equal(r.stop, status === 429 ? 'rate_limited' : 'server');
    assert.equal(s.calls.length, 1);
    assert.equal((d.prepare('SELECT COUNT(*) AS n FROM course_notes WHERE upload_failed = 1').get() as { n: number }).n, 0);
    assert.equal((await listPendingUploads(db)).length, 2);
  }
});

test('offline or signed out before a POST: stops without sending', async () => {
  const { db } = phoneWithLegacyNotes(3);
  const s = fakeServer();
  assert.equal((await uploadPendingNotes(s.deps(db, { isOnline: () => false }), ME)).stop, 'offline');
  assert.equal((await uploadPendingNotes(s.deps(db, { currentStudentId: () => null }), ME)).stop, 'signed_out');
  assert.equal(s.calls.length, 0);
});

test('a note deleted from the sheet during the upload is not sent', async () => {
  const { d, db } = phoneWithLegacyNotes(3);
  const s = fakeServer();
  const deps = s.deps(db, {
    sleep: async () => { d.prepare("DELETE FROM course_notes WHERE id = 'local-2'").run(); },
  });
  await uploadPendingNotes(deps, ME);
  assert.deepEqual(s.calls.map((c) => c.body), ['note 0', 'note 1']);
});

test('logout wipes uploaded and cached server notes, keeps notes not uploaded yet and device-only ones', async () => {
  const { d, db } = phoneWithLegacyNotes(5);
  // note 0, 1 uploaded; note 2 refused (404); then the network drops: note 3, 4 still pending.
  const s = fakeServer((n) => (n === 3 ? 404 : n === 4 ? 'network' : 201));
  await uploadPendingNotes(s.deps(db), ME);
  // Plus a note that only came from the server (cached by a read).
  await putServerNote(db, ME, { id: 'srv-x', subjectCode: 'MAT201', dayOfWeek: 3, body: 'from server', createdAt: '2026-11-01T10:00:00.000Z' });

  const wiped = await wipeServerCopies(db);
  assert.equal(wiped, 3);
  const left = (d.prepare('SELECT id, server_id, upload_failed FROM course_notes ORDER BY id').all() as { id: string }[]).map((r) => r.id);
  assert.deepEqual(left, ['local-2', 'local-3', 'local-4']);
  assert.equal((await listPendingUploads(db)).length, 2, 'the un-uploaded notes are still waiting for their upload');
});

test('logout during the upload: it stops, and the notes not sent survive the wipe until a later upload', async () => {
  const { db } = phoneWithLegacyNotes(4);
  let signedIn = true;
  const s = fakeServer((n) => { if (n === 2) signedIn = false; return 201; }); // logout while POST #2 is in flight
  const r = await uploadPendingNotes(s.deps(db, { currentStudentId: () => (signedIn ? ME : null) }), ME);
  assert.deepEqual(r, { uploaded: 2, keptOnDevice: 0, stop: 'signed_out' });
  await wipeServerCopies(db);
  const pending = await listPendingUploads(db);
  assert.deepEqual(pending.map((p) => p.body), ['note 2', 'note 3']);

  // Signed in again later: the rest go up, the first two are not sent again.
  signedIn = true;
  await uploadPendingNotes(s.deps(db, { currentStudentId: () => ME }), ME);
  assert.deepEqual(s.calls.map((c) => c.body), ['note 0', 'note 1', 'note 2', 'note 3']);
});

test('reading a class from the server updates the copy without duplicating uploaded notes or touching pending ones', async () => {
  const { d, db } = phoneWithLegacyNotes(3);
  const s = fakeServer((n) => (n === 3 ? 'network' : 201)); // note 0, 1 up; note 2 pending
  await uploadPendingNotes(s.deps(db), ME);
  const fromServer = [...s.stored.values()].map((n) => ({ ...n, body: n.body + ' (edited)' }));
  fromServer.push({ id: 'srv-new', subjectCode: 'INF101', dayOfWeek: 1, body: 'written on the PWA', createdAt: '2026-11-02T09:00:00.000Z' });

  await replaceClassCopy(db, ME, 'INF101', 1, fromServer);
  const shown = await readClassNotes(db, ME, 'INF101', 1);
  assert.equal(shown.length, 4);
  assert.deepEqual(shown.map((n) => n.body), ['written on the PWA', 'note 2', 'note 1 (edited)', 'note 0 (edited)']);
  assert.ok(shown.find((n) => n.body === 'note 2')!.pending);

  // A note deleted on the server disappears from the copy; the pending note stays.
  await replaceClassCopy(db, ME, 'INF101', 1, fromServer.slice(1));
  const after = (await readClassNotes(db, ME, 'INF101', 1)).map((n) => n.body);
  assert.deepEqual(after, ['written on the PWA', 'note 2', 'note 1 (edited)']);
  assert.equal(row(d, 'local-2')!.server_id, null);
});

test("another student's server copies are never shown", async () => {
  const { db } = phoneWithLegacyNotes(0);
  await putServerNote(db, 'student-2', { id: 'srv-other', subjectCode: 'INF101', dayOfWeek: 1, body: 'not yours', createdAt: '2026-11-01T10:00:00.000Z' });
  assert.equal((await readClassNotes(db, ME, 'INF101', 1)).length, 0);
});
