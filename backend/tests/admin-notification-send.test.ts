/**
 * POST /admin/notifications/send writes the in-app notifications AND starts the
 * push to the recipients' devices, through utils/notify.ts like every other
 * send path. It used to write the records only while answering
 * "Envoyé via FCM".
 *
 * Run:  cd backend && npm test
 *
 * Real router, real adminAuth + rbac + audit, a signed admin JWT; the Prisma
 * delegates are in-memory stand-ins. No push is really sent: the stand-in has
 * no device tokens, so the push helper stops after looking them up — which is
 * what this test checks it does.
 */
const ADMIN_SECRET = 'test-admin-secret-0123456789abcdef01234567';
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
  JWT_SECRET: 'test-jwt-secret-0123456789abcdef0123456789',
  QR_SECRET: 'test-qr-secret-0123456789abcdef0123456789',
  SUPABASE_URL: 'http://127.0.0.1:1',
  SUPABASE_SERVICE_ROLE_KEY: 'test',
  JWT_ADMIN_SECRET: ADMIN_SECRET,
  JWT_ADMIN_REFRESH_SECRET: 'test-admin-refresh-0123456789abcdef0123456',
  ADMIN_CORS_ORIGIN: 'http://localhost:3001',
});

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

const STUDENTS = ['11111111-1111-4111-8111-111111111111', '22222222-2222-4222-8222-222222222222'];
const ROLES: Record<string, string> = { 'admin-super': 'SUPER_ADMIN', 'admin-faculty': 'FACULTY_ADMIN' };

let created: any[] = [];
let tokenLookups: any[] = [];
let audits: any[] = [];

const fakeDb = {
  admin: {
    findUnique: async ({ where }: any) =>
      ROLES[where.id] ? { isActive: true, role: ROLES[where.id], facultyId: null } : null,
  },
  student: {
    findMany: async () => STUDENTS.map((id) => ({ id })),
  },
  notification: {
    createMany: async ({ data }: any) => {
      created.push(...data);
      return { count: data.length };
    },
  },
  pushToken: {
    findMany: async (args: any) => {
      tokenLookups.push(args);
      return [];
    },
  },
  auditLog: {
    create: async ({ data }: any) => {
      audits.push(data);
      return data;
    },
  },
};

let server: Server;
let base = '';
let sign: (payload: object, secret: string, opts: object) => string;

before(async () => {
  const { default: prisma } = await import('../src/utils/prisma');
  for (const [model, delegate] of Object.entries(fakeDb)) {
    Object.defineProperty(prisma, model, { value: delegate, configurable: true });
  }
  const { default: express } = await import('express');
  const { default: jwt } = await import('jsonwebtoken');
  const { errorHandler } = await import('../src/middleware/errorHandler');
  const { default: router } = await import('../src/routes/admin/notifications');
  sign = jwt.sign as any;

  const app = express();
  app.use(express.json());
  app.use('/admin/notifications', router);
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
  created = [];
  tokenLookups = [];
  audits = [];
});

const tokenFor = (adminId: string) =>
  sign({ adminId, role: ROLES[adminId], facultyId: null, type: 'admin_access' }, ADMIN_SECRET, { expiresIn: '15m' });

async function send(adminId: string, body: unknown) {
  const res = await fetch(`${base}/admin/notifications/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenFor(adminId)}` },
    body: JSON.stringify(body),
  });
  return { status: res.status, body: await res.json() };
}

const tick = () => new Promise((r) => setTimeout(r, 20));

test('send to all: in-app records for every student, and the push is started', async () => {
  const res = await send('admin-super', { target: 'all', title: 'Rentrée', body: 'Lundi 8h' });
  assert.equal(res.status, 201);
  assert.equal(res.body.count, 2);

  assert.deepEqual(created.map((c) => c.studentId).sort(), [...STUDENTS].sort());
  assert.ok(created.every((c) => c.type === 'GENERAL' && c.titleFr === 'Rentrée' && c.bodyFr === 'Lundi 8h'));

  await tick(); // the push is fire-and-forget
  assert.equal(tokenLookups.length, 1, 'push helper looked up device tokens');
  assert.deepEqual([...tokenLookups[0].where.studentId.in].sort(), [...STUDENTS].sort());
});

test('the answer no longer claims an FCM delivery', async () => {
  const res = await send('admin-super', { target: 'all', title: 't', body: 'b' });
  assert.ok(!/FCM/i.test(JSON.stringify(res.body)));
  assert.equal(res.body.message, 'Notification envoyée à 2 étudiants');
});

test('a repeated student id gets one notification, and the count says so', async () => {
  const res = await send('admin-super', {
    target: 'students',
    studentIds: [STUDENTS[0], STUDENTS[0]],
    title: 't',
    body: 'b',
  });
  assert.equal(res.status, 201);
  assert.equal(created.length, 1);
  assert.equal(res.body.count, 1);
  assert.equal(res.body.message, 'Notification envoyée à 1 étudiant');
});

test('a faculty admin cannot send', async () => {
  const res = await send('admin-faculty', { target: 'all', title: 't', body: 'b' });
  assert.equal(res.status, 403);
  assert.equal(created.length, 0);
});
