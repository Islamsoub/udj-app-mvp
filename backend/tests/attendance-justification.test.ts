/**
 * Présence, server side:
 *   1. POST /student/attendance/:id/justification after a refusal, and what it
 *      does for a pending or an approved proof;
 *   2. GET /student/attendance never reports missing hours as 0%.
 *
 * Run:  cd backend && npm test
 *
 * Wired as tests/current-semester-routes.test.ts is: the real /student router
 * behind its real authMiddleware and a real signed JWT, with the Prisma
 * delegates and Supabase Storage swapped for in-memory stand-ins. The live
 * database and the storage bucket are never touched.
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
import { AttendanceStatus } from '@prisma/client';

const DAY = 24 * 60 * 60 * 1000;
const now = Date.now();

const STUDENT = { id: 'stu-a', programmeId: 'prog-1', status: 'ACTIVE' };
const RECORD_ID = '33333333-3333-4333-8333-333333333333';

const SEMESTER = {
  id: '22222222-2222-4222-8222-222222222222',
  label: 'S2',
  academicYear: 'now',
  startDate: new Date(now - 30 * DAY),
  endDate: new Date(now + 30 * DAY),
  isCurrent: true,
  createdAt: new Date(0),
  updatedAt: new Date(0),
};

/** The smallest valid PNG (1×1), so the magic-byte check passes. */
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
  'base64'
);

/** One attendance record, the row the upload route reads and writes. */
interface Row {
  id: string;
  studentId: string;
  status: AttendanceStatus;
  sessionDate: Date;
  justificationUrl: string | null;
  justificationStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | null;
  justificationNote: string | null;
}

let row: Row;
let updates: any[] = [];
let uploads: string[] = [];
/** What GET /student/attendance's findMany returns. */
let records: any[] = [];

function emptyDelegate() {
  return {
    findMany: async () => [],
    findFirst: async () => null,
    findUnique: async () => null,
    count: async () => 0,
  };
}

const fakeDb = {
  student: {
    findUnique: async ({ where }: any) => (where.id === STUDENT.id ? STUDENT : null),
  },
  semester: {
    findMany: async () => [SEMESTER],
    findFirst: async () => SEMESTER,
    findUnique: async () => SEMESTER,
  },
  attendanceRecord: {
    findUnique: async ({ where }: any) => (where.id === row.id ? { ...row } : null),
    findMany: async () => records,
    update: async ({ where, data }: any) => {
      assert.equal(where.id, row.id);
      updates.push(data);
      row = { ...row, ...data };
      return { justificationStatus: row.justificationStatus, justificationNote: row.justificationNote };
    },
  },
  // Deadline 8 days, the default.
  systemSettings: { findUnique: async () => ({ justificationDeadlineDays: 8 }) },
  scheduleEntry: emptyDelegate(),
  grade: emptyDelegate(),
  subject: emptyDelegate(),
  courseNote: emptyDelegate(),
};

const fakeStorage = {
  from: () => ({
    upload: async (path: string) => {
      uploads.push(path);
      return { data: { path }, error: null };
    },
    createSignedUrl: async (path: string) => ({
      data: { signedUrl: `https://signed.test/${path}` },
      error: null,
    }),
  }),
};

let server: Server;
let base = '';
let token = '';

before(async () => {
  const { default: prisma } = await import('../src/utils/prisma');
  for (const [model, delegate] of Object.entries(fakeDb)) {
    Object.defineProperty(prisma, model, { value: delegate, configurable: true });
  }
  const { supabase } = await import('../src/utils/supabase');
  Object.defineProperty(supabase, 'storage', { value: fakeStorage, configurable: true });

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
  updates = [];
  uploads = [];
  records = [];
});

/** An absence `daysAgo` days back, in the given justification state. */
function absence(
  justificationStatus: Row['justificationStatus'],
  status: AttendanceStatus,
  daysAgo: number
): Row {
  return {
    id: RECORD_ID,
    studentId: STUDENT.id,
    status,
    sessionDate: new Date(now - daysAgo * DAY),
    justificationUrl: justificationStatus ? `${STUDENT.id}/old.png` : null,
    justificationStatus,
    justificationNote: justificationStatus === 'REJECTED' ? 'Document illisible' : null,
  };
}

async function upload(note?: string) {
  const form = new FormData();
  form.append('justification', new Blob([PNG], { type: 'image/png' }), 'proof.png');
  if (note !== undefined) form.append('note', note);
  const res = await fetch(`${base}/student/attendance/${RECORD_ID}/justification`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    body: form,
  });
  return { status: res.status, body: await res.json() };
}

async function getAttendance() {
  const res = await fetch(`${base}/student/attendance`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return { status: res.status, body: await res.json() };
}

// ── 1. A new proof after a refusal ───────────────────────────────────────────

/*
 * The states a record goes through, from the admin review route
 * (routes/admin/attendance.ts): a refusal sets justificationStatus REJECTED and
 * status ABSENT; an approval sets APPROVED and status JUSTIFIED. The upload
 * route accepts only status ABSENT inside the deadline, so a refused proof can
 * be replaced and an approved one cannot.
 */

test('REJECTED inside the deadline: a new proof is accepted and goes back to PENDING', async () => {
  row = absence('REJECTED', AttendanceStatus.ABSENT, 2);

  const res = await upload('Nouveau certificat');

  assert.equal(res.status, 200);
  assert.equal(res.body.justificationStatus, 'PENDING');
  assert.equal(res.body.justificationNote, 'Nouveau certificat');
  assert.equal(uploads.length, 1, 'the new file was stored');
  assert.equal(updates.length, 1);
  assert.equal(updates[0].justificationStatus, 'PENDING');
  assert.notEqual(updates[0].justificationUrl, `${STUDENT.id}/old.png`, 'points at the new file');
  // The refusal reason does not survive onto the new request.
  assert.equal(row.justificationNote, 'Nouveau certificat');
});

test('REJECTED with no note: the old refusal reason is cleared, not kept', async () => {
  row = absence('REJECTED', AttendanceStatus.ABSENT, 2);

  const res = await upload();

  assert.equal(res.status, 200);
  assert.equal(res.body.justificationStatus, 'PENDING');
  assert.equal(res.body.justificationNote, null);
});

test('REJECTED past the deadline: refused with DEADLINE_PASSED, nothing written', async () => {
  row = absence('REJECTED', AttendanceStatus.ABSENT, 9);

  const res = await upload();

  assert.equal(res.status, 409);
  assert.equal(res.body.code, 'DEADLINE_PASSED');
  assert.equal(uploads.length, 0);
  assert.equal(updates.length, 0);
});

test('APPROVED: cannot be overwritten (409 NOT_ABSENT), even inside the deadline', async () => {
  row = absence('APPROVED', AttendanceStatus.JUSTIFIED, 1);

  const res = await upload();

  assert.equal(res.status, 409);
  assert.equal(res.body.code, 'NOT_ABSENT');
  assert.equal(uploads.length, 0);
  assert.equal(updates.length, 0);
  assert.equal(row.justificationStatus, 'APPROVED');
});

test('APPROVED but status set back to ABSENT by a register re-save: still cannot be overwritten', async () => {
  // The admin register upsert (routes/admin/attendance.ts) writes `status`
  // without touching justificationStatus, so this combination is reachable.
  row = absence('APPROVED', AttendanceStatus.ABSENT, 1);

  const res = await upload();

  assert.equal(res.status, 409);
  assert.equal(res.body.code, 'NOT_ABSENT');
  assert.equal(uploads.length, 0);
  assert.equal(updates.length, 0);
  assert.equal(row.justificationStatus, 'APPROVED');
});

test('GET /student/attendance does not offer an upload over an approved proof', async () => {
  const subject = { id: 'sub-1', nameFr: 'Réseaux', nameAr: 'شبكات', code: 'INF303' };
  records = [
    {
      id: 'r-ok',
      subjectId: subject.id,
      hoursAttended: null,
      justificationUrl: `${STUDENT.id}/ok.png`,
      justificationStatus: 'APPROVED',
      justificationNote: null,
      subject,
      status: 'ABSENT',
      sessionDate: new Date(now - 1 * DAY),
    },
  ];

  const res = await getAttendance();

  assert.equal(res.status, 200);
  assert.equal(res.body.subjects[0].absences[0].canSubmitJustification, false);
});

test('PENDING inside the deadline (today\'s behaviour, kept): the new file replaces the pending one', async () => {
  row = absence('PENDING', AttendanceStatus.ABSENT, 1);

  const res = await upload();

  assert.equal(res.status, 200);
  assert.equal(res.body.justificationStatus, 'PENDING');
  assert.equal(updates.length, 1);
});

test('GET /student/attendance offers a new upload for a REJECTED absence inside the deadline only', async () => {
  const subject = { id: 'sub-1', nameFr: 'Réseaux', nameAr: 'شبكات', code: 'INF303' };
  const base = {
    subjectId: subject.id,
    hoursAttended: null,
    justificationUrl: null,
    justificationStatus: 'REJECTED',
    justificationNote: 'Document illisible',
    subject,
    status: 'ABSENT',
  };
  records = [
    { ...base, id: 'r-in', sessionDate: new Date(now - 2 * DAY) },
    { ...base, id: 'r-out', sessionDate: new Date(now - 9 * DAY) },
  ];

  const res = await getAttendance();

  assert.equal(res.status, 200);
  const byId = new Map(res.body.subjects[0].absences.map((a: any) => [a.id, a]));
  assert.equal((byId.get('r-in') as any).canSubmitJustification, true);
  assert.equal((byId.get('r-out') as any).canSubmitJustification, false);
  assert.equal((byId.get('r-in') as any).justificationNote, 'Document illisible');
});

// ── 2. No fake 0% ────────────────────────────────────────────────────────────

test('a subject with countable hours gets its percentage as a number', async () => {
  const subject = { id: 'sub-1', nameFr: 'Réseaux', nameAr: 'شبكات', code: 'INF303' };
  const rec = (id: string, status: string, daysAgo: number) => ({
    id,
    status,
    hoursAttended: null,
    subjectId: subject.id,
    sessionDate: new Date(now - daysAgo * DAY),
    justificationUrl: null,
    justificationStatus: null,
    justificationNote: null,
    subject,
  });
  // 3 present, 1 absent, all at the 1.5h default length: 75%.
  records = [rec('a', 'PRESENT', 1), rec('b', 'PRESENT', 2), rec('c', 'PRESENT', 3), rec('d', 'ABSENT', 4)];

  const res = await getAttendance();

  assert.equal(res.status, 200);
  assert.equal(res.body.subjects[0].percentage, 75);
  assert.equal(typeof res.body.subjects[0].percentage, 'number');
  assert.equal(res.body.overall.percentage, 75);
});

test('no countable hours: the subject percentage is null, never 0, and its band is ok', async () => {
  /*
   * The route's own numbers for a subject, through the same functions it calls.
   * Through the route itself every listed subject has at least one session and
   * the session-length fallback is 1.5h, so held hours cannot be 0 today; this
   * pins what the route does if they ever are (a resolver change, a 0-length
   * fallback), which is exactly where the old `?? 0` turned "no data" into 0%.
   */
  const { truncatedPercentage, attendanceBand, attendanceRecovery } = await import(
    '../src/utils/attendance'
  );
  const hours = { attendedHours: 0, heldHours: 0 };
  const rate = truncatedPercentage(hours);
  assert.equal(rate, null);

  const band = attendanceBand(rate, attendanceRecovery(hours, 0, 75, 1.5, false), {
    threshold: 75,
    warnMargin: 5,
    warnAbsences: 1,
  });
  assert.equal(band, 'ok');
});
