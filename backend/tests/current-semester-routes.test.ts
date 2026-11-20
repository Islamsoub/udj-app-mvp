/**
 * The student routes that work on "the current semester" ask
 * utils/currentSemester for it, and never the is_current column.
 *
 * Run:  cd backend && npm test
 *
 * The fixture is built so the two answers DISAGREE: the semester flagged
 * is_current ended months ago, and the unflagged one is in progress today. A
 * route still reading the flag would query the flagged semester's id; every
 * route here must query the in-progress one.
 *
 * Wired as tests/course-notes.test.ts is: the real /student router behind its
 * real authMiddleware and a real signed JWT, with the Prisma delegates swapped
 * for in-memory stand-ins. The live database is never touched.
 */

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
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

/** Flagged current by hand, but ended 60 days ago. */
const FLAGGED = {
  id: '11111111-1111-4111-8111-111111111111',
  label: 'S1',
  academicYear: 'old',
  startDate: new Date(now - 200 * DAY),
  endDate: new Date(now - 60 * DAY),
  isCurrent: true,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

/** Not flagged, but today is inside its dates: the current semester. */
const IN_PROGRESS = {
  ...FLAGGED,
  id: '22222222-2222-4222-8222-222222222222',
  label: 'S2',
  academicYear: 'now',
  startDate: new Date(now - 30 * DAY),
  endDate: new Date(now + 30 * DAY),
  isCurrent: false,
};

const STUDENT = { id: 'stu-a', programmeId: 'prog-1', status: 'ACTIVE' };

/** Every semester id any query asked for, from any of its WHERE shapes. */
let askedSemesterIds: string[] = [];
let flagQueried = false;

function collect(where: any): void {
  if (!where || typeof where !== 'object') return;
  for (const [key, value] of Object.entries(where)) {
    if (key === 'isCurrent') flagQueried = true;
    if (key === 'semesterId' && typeof value === 'string') askedSemesterIds.push(value);
    else if (typeof value === 'object') collect(value);
  }
}

/** A delegate that records every WHERE and answers "nothing". */
function emptyDelegate() {
  const answer = (empty: unknown) => async (args: any = {}) => {
    collect(args.where);
    return empty;
  };
  return {
    findMany: answer([]),
    findFirst: answer(null),
    findUnique: answer(null),
    count: answer(0),
  };
}

const fakeDb = {
  student: {
    findUnique: async ({ where }: any) => (where.id === STUDENT.id ? STUDENT : null),
  },
  semester: {
    findMany: async (args: any = {}) => {
      collect(args.where);
      return [FLAGGED, IN_PROGRESS];
    },
    findFirst: async (args: any = {}) => {
      collect(args.where);
      return args.where?.isCurrent ? FLAGGED : null;
    },
    findUnique: async ({ where }: any) =>
      [FLAGGED, IN_PROGRESS].find((s) => s.id === where.id) ?? null,
  },
  grade: emptyDelegate(),
  subject: emptyDelegate(),
  scheduleEntry: emptyDelegate(),
  attendanceRecord: emptyDelegate(),
  systemSettings: emptyDelegate(),
  courseNote: emptyDelegate(),
};

let server: Server;
let base = '';
let token = '';

before(async () => {
  const { default: prisma } = await import('../src/utils/prisma');
  for (const [model, delegate] of Object.entries(fakeDb)) {
    Object.defineProperty(prisma, model, { value: delegate, configurable: true });
  }

  const { default: express } = await import('express');
  const { default: jwt } = await import('jsonwebtoken');
  const { errorHandler } = await import('../src/middleware/errorHandler');
  const { default: studentRouter } = await import('../src/routes/student');

  token = jwt.sign({ studentId: STUDENT.id, type: 'access' }, SECRET, { expiresIn: '15m' });

  const app = express();
  app.use(express.json());
  app.use('/student', studentRouter);
  app.use(errorHandler);

  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
});

beforeEach(() => {
  askedSemesterIds = [];
  flagQueried = false;
});

async function get(path: string) {
  const res = await fetch(`${base}/student${path}`, { headers: { Authorization: `Bearer ${token}` } });
  return { status: res.status, body: await res.json() };
}

/** The route asked about the in-progress semester only, and never for the flag. */
function assertUsedComputed() {
  assert.equal(flagQueried, false, 'no query filters on isCurrent');
  assert.ok(askedSemesterIds.length > 0, 'the route queried by semester');
  assert.deepEqual([...new Set(askedSemesterIds)], [IN_PROGRESS.id]);
}

test('GET /student/grades answers for the semester the dates make current', async () => {
  const res = await get('/grades');
  assert.equal(res.status, 200);
  assert.equal(res.body.semester.id, IN_PROGRESS.id);
  assert.deepEqual(res.body.semester, { id: IN_PROGRESS.id, label: 'S2', academicYear: 'now' });
  assertUsedComputed();
});

test('GET /student/schedule answers for the semester the dates make current', async () => {
  const res = await get('/schedule');
  assert.equal(res.status, 200);
  assert.equal(res.body.semesterId, IN_PROGRESS.id);
  assertUsedComputed();
});

test('GET /student/attendance reads the semester the dates make current', async () => {
  const res = await get('/attendance');
  assert.equal(res.status, 200);
  assertUsedComputed();
});

test('GET /student/course-notes resolves the subject in the semester the dates make current', async () => {
  const res = await get('/course-notes?subjectCode=INF101&dayOfWeek=0');
  // No such subject in the stand-in: 404, but only after asking the right semester.
  assert.equal(res.status, 404);
  assertUsedComputed();
});

test('an explicit ?semesterId= still wins over the current semester', async () => {
  const res = await get(`/grades?semesterId=${FLAGGED.id}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.semester.id, FLAGGED.id);
});
