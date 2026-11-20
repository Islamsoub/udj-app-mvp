/**
 * /student/course-notes — route tests.
 *
 * Run:  cd backend && npm test
 *
 * WHAT IS REAL. The app is assembled the way src/index.ts assembles it —
 * express.json(), the request logger, the /student router (with its real
 * authMiddleware and the real course-note rate limiter) and the error handler —
 * and every request carries a real signed JWT. Validation, ownership checks,
 * status codes and log output are the production code paths.
 *
 * WHAT IS NOT. There is no Postgres here, and the live database must not be
 * touched, so the Prisma client's four model delegates these routes use are
 * replaced with an in-memory store that answers the same queries. What the
 * tests cannot show is Postgres itself: the table exists only after the
 * schema is pushed (see the PR).
 *
 * Node's built-in test runner, through tsx — no test dependency is added.
 */

// env.ts validates at import and exits on failure, so the variables are set
// BEFORE anything from src/ is loaded. Dummy values: nothing here connects out.
const SECRET = 'test-jwt-secret-0123456789abcdef0123456789';
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
  JWT_SECRET: SECRET,
  QR_SECRET: 'test-qr-secret-0123456789abcdef0123456789',
  SUPABASE_URL: 'http://127.0.0.1:1',
  SUPABASE_SERVICE_ROLE_KEY: 'test',
  JWT_ADMIN_SECRET: 'test-admin-secret-0123456789abcdef01234567',
  JWT_ADMIN_REFRESH_SECRET: 'test-admin-refresh-0123456789abcdef0123456',
  ADMIN_CORS_ORIGIN: 'http://localhost:3001',
});

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

// ── In-memory stand-in for the four delegates ─────────────────────────────────

interface Note {
  id: string;
  studentId: string;
  subjectId: string;
  dayOfWeek: number;
  body: string;
  createdAt: Date;
  updatedAt: Date;
}

const PROGRAMME = 'prog-1';
const OTHER_PROGRAMME = 'prog-2';
const SEMESTER = 'sem-current';

const students = new Map([
  ['stu-a', { id: 'stu-a', programmeId: PROGRAMME, status: 'ACTIVE' }],
  ['stu-b', { id: 'stu-b', programmeId: PROGRAMME, status: 'ACTIVE' }],
  ['stu-c', { id: 'stu-c', programmeId: PROGRAMME, status: 'ACTIVE' }],
]);
const subjects = [
  // In stu-a's timetable.
  { id: 'subj-algo', code: 'INF101', programmeId: PROGRAMME, semesterId: SEMESTER, scheduled: true },
  { id: 'subj-math', code: 'MAT101', programmeId: PROGRAMME, semesterId: SEMESTER, scheduled: true },
  // Exists, but in no timetable this semester.
  { id: 'subj-unsched', code: 'PHY900', programmeId: PROGRAMME, semesterId: SEMESTER, scheduled: false },
  // Another programme's subject.
  { id: 'subj-other', code: 'BIO101', programmeId: OTHER_PROGRAMME, semesterId: SEMESTER, scheduled: true },
];
let notes: Note[] = [];

const byNewest = (a: Note, b: Note) =>
  b.createdAt.getTime() - a.createdAt.getTime() || (a.id < b.id ? 1 : -1);

function shape(n: Note) {
  const subject = subjects.find((s) => s.id === n.subjectId)!;
  return { ...n, subject: { code: subject.code } };
}

const fakeDb = {
  student: {
    findUnique: async ({ where }: any) => students.get(where.id) ?? null,
  },
  semester: {
    // resolveCurrentSemester reads every semester and picks by date: one
    // semester, in progress whatever today is.
    findMany: async () => [
      { id: SEMESTER, startDate: new Date('2000-01-01T00:00:00Z'), endDate: new Date('2999-12-31T00:00:00Z') },
    ],
  },
  subject: {
    findFirst: async ({ where }: any) => {
      // The route must ask for all four conditions; a dropped one would widen
      // what resolves, so they are asserted rather than assumed.
      assert.ok(where.code && where.programmeId && where.semesterId && where.scheduleEntries?.some);
      const s = subjects.find(
        (x) =>
          x.code === where.code &&
          x.programmeId === where.programmeId &&
          x.semesterId === where.semesterId &&
          x.scheduled
      );
      return s ? { id: s.id } : null;
    },
  },
  courseNote: {
    findMany: async ({ where }: any) => {
      assert.ok(where.studentId, 'every read is scoped to the student');
      return notes
        .filter(
          (n) =>
            n.studentId === where.studentId &&
            (where.subjectId === undefined || n.subjectId === where.subjectId) &&
            (where.dayOfWeek === undefined || n.dayOfWeek === where.dayOfWeek)
        )
        .sort(byNewest)
        .map(shape);
    },
    create: async ({ data }: any) => {
      const now = new Date();
      const note: Note = {
        id: randomUUID(),
        studentId: data.studentId,
        subjectId: data.subjectId,
        dayOfWeek: data.dayOfWeek,
        body: data.body,
        createdAt: data.createdAt ?? now,
        updatedAt: now,
      };
      notes.push(note);
      return shape(note);
    },
    deleteMany: async ({ where }: any) => {
      assert.ok(where.studentId, 'every delete is scoped to the student');
      const before = notes.length;
      notes = notes.filter((n) => !(n.id === where.id && n.studentId === where.studentId));
      return { count: before - notes.length };
    },
  },
};

// ── App, assembled as src/index.ts does ───────────────────────────────────────

let server: Server;
let base = '';
let logs: string[] = [];
const realLog = console.log;
const realError = console.error;
let sign: (studentId: string) => string;

before(async () => {
  const { default: prisma } = await import('../src/utils/prisma');
  // Replace the delegates on the shared client, so the production wiring in
  // student.ts (createCourseNotesRouter(prisma, ...)) and authMiddleware's
  // status check both read the stand-in.
  for (const [model, delegate] of Object.entries(fakeDb)) {
    Object.defineProperty(prisma, model, { value: delegate, configurable: true });
  }

  const { default: express } = await import('express');
  const { default: jwt } = await import('jsonwebtoken');
  const { logger } = await import('../src/middleware/logger');
  const { errorHandler } = await import('../src/middleware/errorHandler');
  const { default: studentRouter } = await import('../src/routes/student');

  sign = (studentId) => jwt.sign({ studentId, type: 'access' }, SECRET, { expiresIn: '15m' });

  const app = express();
  app.use(express.json());
  app.use(logger);
  app.use('/student', studentRouter);
  app.use(errorHandler);

  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // Everything the server prints, for the privacy assertions.
  const capture = (...args: unknown[]) => logs.push(args.map(String).join(' '));
  console.log = capture;
  console.error = capture;
});

after(async () => {
  console.log = realLog;
  console.error = realError;
  await new Promise((r) => server.close(r));
});

beforeEach(() => {
  notes = [];
  logs = [];
});

async function call(
  method: string,
  path: string,
  opts: { as?: string; json?: unknown; raw?: string } = {}
) {
  const headers: Record<string, string> = {};
  if (opts.as) headers.Authorization = `Bearer ${sign(opts.as)}`;
  let body: string | undefined;
  if (opts.json !== undefined || opts.raw !== undefined) {
    headers['Content-Type'] = 'application/json';
    body = opts.raw ?? JSON.stringify(opts.json);
  }
  const res = await fetch(`${base}/student/course-notes${path}`, { method, headers, body });
  // The server logs on 'finish', which can land just after the client has the
  // response; one tick lets that line arrive before a test reads `logs`.
  await new Promise((r) => setImmediate(r));
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const post = (as: string, json: unknown) => call('POST', '', { as, json });

// ── Create ────────────────────────────────────────────────────────────────────

test('create: 201 with the note, body trimmed, createdAt defaulted', async () => {
  const res = await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: '  Revoir les tris  ' });
  assert.equal(res.status, 201);
  assert.equal(res.body.subjectCode, 'INF101');
  assert.equal(res.body.dayOfWeek, 0);
  assert.equal(res.body.body, 'Revoir les tris');
  assert.match(res.body.id, /^[0-9a-f-]{36}$/);
  assert.ok(Math.abs(Date.parse(res.body.createdAt) - Date.now()) < 5000);
});

test('create: an uploaded note keeps its original createdAt', async () => {
  const res = await post('stu-a', {
    subjectCode: 'INF101',
    dayOfWeek: 2,
    body: 'old note',
    createdAt: '2026-09-14T08:30:00.000Z',
  });
  assert.equal(res.status, 201);
  assert.equal(res.body.createdAt, '2026-09-14T08:30:00.000Z');
});

test('create: 401 without a token', async () => {
  const res = await call('POST', '', { json: { subjectCode: 'INF101', dayOfWeek: 0, body: 'x' } });
  assert.equal(res.status, 401);
});

// ── List ──────────────────────────────────────────────────────────────────────

async function seedThree() {
  await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: 'first', createdAt: '2026-10-01T08:00:00Z' });
  await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: 'second', createdAt: '2026-10-02T08:00:00Z' });
  await post('stu-a', { subjectCode: 'MAT101', dayOfWeek: 3, body: 'maths', createdAt: '2026-10-03T08:00:00Z' });
  // Another student's note on the same class must never show.
  await post('stu-b', { subjectCode: 'INF101', dayOfWeek: 0, body: 'not yours', createdAt: '2026-10-04T08:00:00Z' });
}

test('list filtered: one class, newest first, own notes only', async () => {
  await seedThree();
  const res = await call('GET', '?subjectCode=INF101&dayOfWeek=0', { as: 'stu-a' });
  assert.equal(res.status, 200);
  assert.deepEqual(
    res.body.notes.map((n: any) => n.body),
    ['second', 'first']
  );
});

test('list filtered: same subject, other day, is a different class', async () => {
  await seedThree();
  const res = await call('GET', '?subjectCode=INF101&dayOfWeek=1', { as: 'stu-a' });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.notes, []);
});

test('list all: every class, newest first, own notes only', async () => {
  await seedThree();
  const res = await call('GET', '', { as: 'stu-a' });
  assert.equal(res.status, 200);
  assert.deepEqual(
    res.body.notes.map((n: any) => [n.subjectCode, n.dayOfWeek, n.body]),
    [
      ['MAT101', 3, 'maths'],
      ['INF101', 0, 'second'],
      ['INF101', 0, 'first'],
    ]
  );
});

test('list: one filter without the other, or a bad day, is 400', async () => {
  for (const q of ['?subjectCode=INF101', '?dayOfWeek=0', '?subjectCode=INF101&dayOfWeek=7', '?subjectCode=INF101&dayOfWeek=1.5']) {
    const res = await call('GET', q, { as: 'stu-a' });
    assert.equal(res.status, 400, q);
  }
});

test('list: 401 without a token', async () => {
  assert.equal((await call('GET', '')).status, 401);
});

// ── Delete ────────────────────────────────────────────────────────────────────

test('delete: 204, and the note is gone', async () => {
  const created = await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: 'to delete' });
  const res = await call('DELETE', `/${created.body.id}`, { as: 'stu-a' });
  assert.equal(res.status, 204);
  const list = await call('GET', '', { as: 'stu-a' });
  assert.deepEqual(list.body.notes, []);
  // Deleting it again: it no longer exists.
  assert.equal((await call('DELETE', `/${created.body.id}`, { as: 'stu-a' })).status, 404);
});

test("delete: another student's note is 404, same as a missing one, and survives", async () => {
  const theirs = await post('stu-b', { subjectCode: 'INF101', dayOfWeek: 0, body: 'b private' });
  const res = await call('DELETE', `/${theirs.body.id}`, { as: 'stu-a' });
  assert.equal(res.status, 404);
  const missing = await call('DELETE', `/${randomUUID()}`, { as: 'stu-a' });
  assert.equal(missing.status, 404);
  assert.deepEqual(res.body, missing.body, 'indistinguishable from a note that does not exist');

  const stillThere = await call('GET', '', { as: 'stu-b' });
  assert.deepEqual(stillThere.body.notes.map((n: any) => n.body), ['b private']);
});

test("list: another student's notes never appear, filtered or not", async () => {
  await post('stu-b', { subjectCode: 'INF101', dayOfWeek: 0, body: 'b private' });
  assert.deepEqual((await call('GET', '', { as: 'stu-a' })).body.notes, []);
  assert.deepEqual((await call('GET', '?subjectCode=INF101&dayOfWeek=0', { as: 'stu-a' })).body.notes, []);
});

test('delete: a malformed id is 400', async () => {
  assert.equal((await call('DELETE', '/not-a-uuid', { as: 'stu-a' })).status, 400);
});

// ── Unknown subject ───────────────────────────────────────────────────────────

test('unknown subject: 404 on create and on filtered list', async () => {
  // Does not exist / exists but unscheduled / another programme's.
  for (const subjectCode of ['NOPE999', 'PHY900', 'BIO101']) {
    const created = await post('stu-a', { subjectCode, dayOfWeek: 0, body: 'x' });
    assert.equal(created.status, 404, subjectCode);
    const listed = await call('GET', `?subjectCode=${subjectCode}&dayOfWeek=0`, { as: 'stu-a' });
    assert.equal(listed.status, 404, subjectCode);
  }
  assert.equal(notes.length, 0);
});

// ── Body validation ───────────────────────────────────────────────────────────

test('body: empty, whitespace-only or missing is 400', async () => {
  for (const body of ['', '   \n\t ', undefined, 42]) {
    const res = await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body });
    assert.equal(res.status, 400, JSON.stringify(body));
  }
  assert.equal(notes.length, 0);
});

test('body: 2000 characters is accepted, 2001 is 400', async () => {
  const ok = await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: 'é'.repeat(2000) });
  assert.equal(ok.status, 201);
  const tooLong = await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: 'é'.repeat(2001) });
  assert.equal(tooLong.status, 400);
  // Counted in characters: 2000 emoji are 4000 UTF-16 units and still fit.
  const emoji = await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: '📚'.repeat(2000) });
  assert.equal(emoji.status, 201);
});

test('dayOfWeek: outside 0-6 or not an integer is 400', async () => {
  for (const dayOfWeek of [-1, 7, 1.5, '1', null]) {
    const res = await post('stu-a', { subjectCode: 'INF101', dayOfWeek, body: 'x' });
    assert.equal(res.status, 400, JSON.stringify(dayOfWeek));
  }
});

// ── createdAt ─────────────────────────────────────────────────────────────────

test('createdAt: in the future is 400', async () => {
  const future = new Date(Date.now() + 60 * 60 * 1000).toISOString();
  const res = await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: 'x', createdAt: future });
  assert.equal(res.status, 400);
  assert.equal(notes.length, 0);
});

test('createdAt: a phone clock a minute fast is still accepted', async () => {
  const skewed = new Date(Date.now() + 60 * 1000).toISOString();
  const res = await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: 'x', createdAt: skewed });
  assert.equal(res.status, 201);
});

test('createdAt: not an ISO date-time is 400', async () => {
  for (const createdAt of ['yesterday', '2026-10-01', 1700000000000]) {
    const res = await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: 'x', createdAt });
    assert.equal(res.status, 400, JSON.stringify(createdAt));
  }
});

// ── Privacy: note text never reaches the log ──────────────────────────────────

test('privacy: note text never appears in the server log', async () => {
  const secret = 'SECRET-NOTE-TEXT-7f3a';
  await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: secret });
  await call('GET', '', { as: 'stu-a' });
  await post('stu-a', { subjectCode: 'INF101', dayOfWeek: 0, body: `${secret}${'x'.repeat(2001)}` });
  // Malformed JSON: Node's parse error quotes the input, and the error handler
  // used to print that message and its stack.
  const malformed = await call('POST', '', { as: 'stu-a', raw: `"${secret} and more` });
  assert.equal(malformed.status, 400);

  assert.ok(logs.length > 0, 'the requests were logged');
  for (const line of logs) assert.ok(!line.includes(secret), `leaked in: ${line.slice(0, 120)}`);
  assert.ok(logs.some((l) => l.includes('content withheld')), 'parse failure logged without content');
});

// ── Rate limit ────────────────────────────────────────────────────────────────

test('rate limit: POST is capped at 60 a minute per student; GET is not', async () => {
  // A fresh student, so the earlier tests' POSTs do not count.
  let lastOk = 0;
  for (let i = 1; i <= 61; i++) {
    const res = await post('stu-c', { subjectCode: 'INF101', dayOfWeek: 0, body: `n${i}` });
    if (res.status === 201) lastOk = i;
    else {
      assert.equal(res.status, 429);
      break;
    }
  }
  assert.equal(lastOk, 60);
  assert.equal((await call('GET', '', { as: 'stu-c' })).status, 200);
  // Per student, not shared: another student can still write.
  assert.equal((await post('stu-b', { subjectCode: 'INF101', dayOfWeek: 0, body: 'ok' })).status, 201);
});

test('privacy: a Prisma validation error is logged without its query arguments', async () => {
  const { Prisma } = await import('@prisma/client');
  const { errorHandler } = await import('../src/middleware/errorHandler');
  const secret = 'SECRET-IN-PRISMA-ARGS-91c2';
  // Prisma's real message prints the call, arguments included, over many lines.
  const err = new Prisma.PrismaClientValidationError(
    `Invalid \`prisma.courseNote.create()\` invocation:\n\n{\n  data: {\n    body: "${secret}"\n  }\n}`,
    { clientVersion: Prisma.prismaVersion.client }
  );
  const res: any = { status: () => res, json: () => res };
  errorHandler(err, {} as any, res, () => {});

  assert.ok(logs.some((l) => l.includes('query arguments withheld')));
  for (const line of logs) assert.ok(!line.includes(secret), `leaked in: ${line.slice(0, 120)}`);
});
