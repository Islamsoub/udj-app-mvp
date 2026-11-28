/**
 * POST /auth/login and POST /admin/auth/login — the lockout sequence.
 *
 * Run:  cd backend && npm test
 *
 * Real routers, real bcrypt, real rate limiter; the Prisma delegates are an
 * in-memory store, as in student-password.test.ts. The login limiter allows 10
 * attempts a minute per IP and is shared by both routes, so this file stays
 * under that: 6 student attempts, 2 admin attempts.
 */

Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
  JWT_SECRET: 'test-jwt-secret-0123456789abcdef0123456789',
  QR_SECRET: 'test-qr-secret-0123456789abcdef0123456789',
  SUPABASE_URL: 'http://127.0.0.1:1',
  SUPABASE_SERVICE_ROLE_KEY: 'test',
  JWT_ADMIN_SECRET: 'test-admin-secret-0123456789abcdef01234567',
  JWT_ADMIN_REFRESH_SECRET: 'test-admin-refresh-0123456789abcdef0123456',
  ADMIN_CORS_ORIGIN: 'http://localhost:3001',
});

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import bcrypt from 'bcrypt';

const GOOD = 'bon-mot-de-passe';
const BAD = 'mauvais-mot-de-passe';

const faculty = { id: 'fac-1', nameFr: 'Sciences', nameAr: 'العلوم', code: 'FS' };
const programme = { id: 'prog-1', nameFr: 'Informatique', nameAr: 'إعلامية', code: 'INFO', level: 'L1', facultyId: faculty.id };

const student: any = {
  id: 'stu-1',
  studentIdDisplay: 'UDJ-2025-0001',
  firstName: 'Amina',
  lastName: 'Test',
  email: null,
  photoUrl: null,
  currentSemester: 1,
  status: 'ACTIVE',
  programmeId: programme.id,
  passwordHash: '',
  failedLoginAttempts: 0,
  lockedUntil: null as Date | null,
};

const admin: any = {
  id: 'adm-1',
  email: 'admin@test.dj',
  firstName: 'Ali',
  lastName: 'Test',
  role: 'SUPER_ADMIN',
  facultyId: null,
  isActive: true,
  passwordHash: '',
  failedLoginAttempts: 4,
  lockedUntil: null as Date | null,
};

const fakeDb = {
  student: {
    findFirst: async ({ where }: any) =>
      String(where.studentIdDisplay.equals).toLowerCase() === student.studentIdDisplay.toLowerCase()
        ? { ...student, programme: { ...programme, faculty } }
        : null,
    update: async ({ data }: any) => Object.assign(student, data),
  },
  refreshToken: {
    create: async ({ data }: any) => ({ id: crypto.randomUUID(), ...data }),
  },
  admin: {
    findFirst: async ({ where }: any) =>
      String(where.email.equals).toLowerCase() === admin.email ? { ...admin } : null,
    update: async ({ data }: any) => Object.assign(admin, data),
  },
};

let server: Server;
let base = '';

before(async () => {
  student.passwordHash = await bcrypt.hash(GOOD, 4);
  admin.passwordHash = await bcrypt.hash(GOOD, 4);

  const { default: prisma } = await import('../src/utils/prisma');
  for (const [model, delegate] of Object.entries(fakeDb)) {
    Object.defineProperty(prisma, model, { value: delegate, configurable: true });
  }

  const { default: express } = await import('express');
  const { errorHandler } = await import('../src/middleware/errorHandler');
  const { default: authRouter } = await import('../src/routes/auth');
  const { default: adminAuthRouter } = await import('../src/routes/admin/auth');

  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  app.use('/admin/auth', adminAuthRouter);
  app.use(errorHandler);

  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
});

async function post(path: string, body: unknown) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

const studentLogin = (password: string) =>
  post('/auth/login', { studentId: student.studentIdDisplay, password });

test('student: the third wrong password locks the account and says so', async () => {
  const first = await studentLogin(BAD);
  assert.equal(first.status, 401);
  assert.equal(first.body.attemptsLeft, 2);

  const second = await studentLogin(BAD);
  assert.equal(second.status, 401);
  assert.equal(second.body.attemptsLeft, 1);

  const third = await studentLogin(BAD);
  assert.equal(third.status, 423, 'the locking attempt answers as locked');
  assert.ok(third.body.lockedUntil, 'with the time it unlocks');
  assert.equal(student.failedLoginAttempts, 3);
  const until = new Date(third.body.lockedUntil).getTime();
  assert.ok(until > Date.now() + 4 * 60 * 1000 && until <= Date.now() + 5 * 60 * 1000 + 1000);
});

test('student: while locked, even the right password is refused, and the lock is not extended', async () => {
  const before = student.lockedUntil.getTime();
  const res = await studentLogin(GOOD);
  assert.equal(res.status, 423);
  assert.equal(new Date(res.body.lockedUntil).getTime(), before);
  assert.equal(student.lockedUntil.getTime(), before);
  assert.equal(student.failedLoginAttempts, 3);
});

test('student: once the lock has run out, the right password signs in and resets the counter', async () => {
  student.lockedUntil = new Date(Date.now() - 1000);
  const res = await studentLogin(GOOD);
  assert.equal(res.status, 200);
  assert.equal(student.failedLoginAttempts, 0);
  assert.equal(student.lockedUntil, null);
});

test('admin: the fifth wrong password locks the account and says so', async () => {
  const res = await post('/admin/auth/login', { email: admin.email, password: BAD });
  assert.equal(res.status, 423);
  assert.ok(res.body.lockedUntil);
  assert.equal(admin.failedLoginAttempts, 5);

  const again = await post('/admin/auth/login', { email: admin.email, password: GOOD });
  assert.equal(again.status, 423);
});
