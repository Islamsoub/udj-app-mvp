/**
 * The student card QR: GET /student/qr-token issues it, POST /verify/card
 * (public) and POST /admin/card/verify check it.
 *
 * Run:  cd backend && npm test
 *
 * Real routers and middleware, signed JWTs, in-memory Prisma stand-ins.
 */
const SECRET = 'test-jwt-secret-0123456789abcdef0123456789';
const QR_SECRET = 'test-qr-secret-0123456789abcdef0123456789';
const ADMIN_SECRET = 'test-admin-secret-0123456789abcdef01234567';
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
  JWT_SECRET: SECRET,
  QR_SECRET,
  SUPABASE_URL: 'http://127.0.0.1:1',
  SUPABASE_SERVICE_ROLE_KEY: 'test',
  JWT_ADMIN_SECRET: ADMIN_SECRET,
  JWT_ADMIN_REFRESH_SECRET: 'test-admin-refresh-0123456789abcdef0123456',
  ADMIN_CORS_ORIGIN: 'http://localhost:3001',
});

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

const FST = { id: 'fac-sci', nameFr: 'Faculté des Sciences', nameAr: 'كلية العلوم' };
const AHMED = {
  id: '11111111-1111-4111-8111-111111111111',
  firstName: 'Ahmed',
  lastName: 'Omar',
  studentIdDisplay: 'UDJ-2024-0432',
  photoUrl: 'https://example.test/ahmed.jpg',
  status: 'ACTIVE',
  currentSemester: 4,
  programme: { nameFr: 'Informatique', nameAr: 'الإعلامية', level: 'LICENCE', faculty: FST },
};
const SUSPENDED = { ...AHMED, id: '22222222-2222-4222-8222-222222222222', firstName: 'Saba', status: 'SUSPENDED' };
const STUDENTS = new Map([AHMED, SUSPENDED].map((s) => [s.id, s]));
const ADMINS: Record<string, { role: string; facultyId: string | null }> = {
  super: { role: 'SUPER_ADMIN', facultyId: null },
  'fac-other': { role: 'FACULTY_ADMIN', facultyId: 'fac-law' },
  'fac-sci': { role: 'FACULTY_ADMIN', facultyId: 'fac-sci' },
};

const fakeDb = {
  student: {
    findUnique: async ({ where, select }: any) => {
      const s = STUDENTS.get(where.id);
      if (!s) return null;
      if (select && !select.programme) return Object.fromEntries(Object.keys(select).map((k) => [k, (s as any)[k]]));
      return s;
    },
  },
  admin: {
    findUnique: async ({ where }: any) => (ADMINS[where.id] ? { isActive: true, ...ADMINS[where.id] } : null),
  },
};

let server: Server;
let base = '';
let jwt: typeof import('jsonwebtoken');

before(async () => {
  const { default: prisma } = await import('../src/utils/prisma');
  for (const [model, delegate] of Object.entries(fakeDb)) {
    Object.defineProperty(prisma, model, { value: delegate, configurable: true });
  }
  const { default: express } = await import('express');
  jwt = (await import('jsonwebtoken')).default as any;
  const { errorHandler } = await import('../src/middleware/errorHandler');
  const { default: studentRouter } = await import('../src/routes/student');
  const { default: verifyRouter } = await import('../src/routes/verify');
  const { default: adminCardRouter } = await import('../src/routes/admin/card');

  const app = express();
  app.use(express.json());
  app.use('/student', studentRouter);
  app.use('/verify', verifyRouter);
  app.use('/admin/card', adminCardRouter);
  app.use(errorHandler);
  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
});

async function call(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  return { status: res.status, headers: res.headers, body: await res.json() };
}

const studentToken = (id: string) => jwt.sign({ studentId: id, type: 'access' }, SECRET, { expiresIn: '15m' });
const adminToken = (id: string) =>
  jwt.sign({ adminId: id, ...ADMINS[id], type: 'admin_access' }, ADMIN_SECRET, { expiresIn: '15m' });
const verify = (code: unknown) => call('POST', '/verify/card', { code });

async function issue(id = AHMED.id) {
  const res = await call('GET', '/student/qr-token', undefined, studentToken(id));
  assert.equal(res.status, 200);
  return res.body;
}

test('qr-token: a live and an offline code, each a link to the check page', async () => {
  const r = await issue();
  assert.match(r.url, /^https:\/\/app\.unipocket\.io\/verify#t=/);
  assert.ok(r.url.endsWith(r.token));
  assert.match(r.offline.url, /#t=/);
  const live = (new Date(r.expiresAt).getTime() - Date.now()) / 1000;
  const off = (new Date(r.offline.expiresAt).getTime() - Date.now()) / 3600_000;
  assert.ok(live > 50 && live <= 60, `live ~60s, got ${live}`);
  assert.ok(off > 23.9 && off <= 24, `offline ~24h, got ${off}`);
});

test('qr-token: no name or matricule inside the token', async () => {
  const r = await issue();
  const payload = JSON.stringify(jwt.decode(r.token));
  assert.ok(!payload.includes('Ahmed') && !payload.includes('UDJ-2024'), payload);
});

test('public check: live code from the link → valid, with the card details', async () => {
  const r = await issue();
  const v = await verify(r.url);
  assert.equal(v.status, 200);
  assert.equal(v.headers.get('cache-control'), 'private, no-store');
  assert.equal(v.body.valid, true);
  assert.equal(v.body.kind, 'live');
  assert.equal(v.body.student.firstName, 'Ahmed');
  assert.equal(v.body.student.studentIdDisplay, 'UDJ-2024-0432');
  assert.equal(v.body.student.programme.nameFr, 'Informatique');
  assert.equal(v.body.student.faculty.nameFr, 'Faculté des Sciences');
  // internal ids never leave through the public check
  assert.equal(v.body.student.id, undefined);
  assert.equal(v.body.student.faculty.id, undefined);
  assert.ok(!JSON.stringify(v.body).includes(AHMED.id));
});

test('public check: the bare token (older app builds) and the offline code work too', async () => {
  const r = await issue();
  assert.equal((await verify(r.token)).body.valid, true);
  const off = await verify(r.offline.url);
  assert.equal(off.body.valid, true);
  assert.equal(off.body.kind, 'offline');
});

test('expired code → not valid, nobody named', async () => {
  const past = Math.floor(Date.now() / 1000) - 120;
  const t = jwt.sign({ sub: AHMED.id, typ: 'card', iat: past, exp: past + 60 }, QR_SECRET);
  const v = await verify(`https://app.unipocket.io/verify#t=${t}`);
  assert.equal(v.body.valid, false);
  assert.equal(v.body.reason, 'expired');
  assert.equal(v.body.student, undefined);
});

test('forged code (wrong key) → invalid', async () => {
  const t = jwt.sign({ sub: AHMED.id, typ: 'card' }, 'not-the-real-key-0123456789abcdef01234', { expiresIn: '60s' });
  const v = await verify(t);
  assert.equal(v.body.valid, false);
  assert.equal(v.body.reason, 'invalid');
  assert.equal(v.body.student, undefined);
});

test('a student sign-in token is not a card', async () => {
  const v = await verify(studentToken(AHMED.id));
  assert.equal(v.body.reason, 'invalid');
  const wrongType = jwt.sign({ sub: AHMED.id, typ: 'access' }, QR_SECRET, { expiresIn: '60s' });
  assert.equal((await verify(wrongType)).body.reason, 'invalid');
});

test('alg "none" is refused', async () => {
  const t = jwt.sign({ sub: AHMED.id, typ: 'card' }, '', { algorithm: 'none', expiresIn: '60s' } as any);
  assert.equal((await verify(t)).body.reason, 'invalid');
});

test('suspended student: genuine code, but not valid — and says who and why', async () => {
  // Issued while still active (a suspended student can no longer fetch one),
  // then checked after the suspension.
  const t = jwt.sign({ sub: SUSPENDED.id, typ: 'card_offline' }, QR_SECRET, { expiresIn: '24h' });
  const v = await verify(t);
  assert.equal(v.body.valid, false);
  assert.equal(v.body.reason, 'inactive');
  assert.equal(v.body.student.status, 'SUSPENDED');
  assert.equal(v.body.student.firstName, 'Saba');
});

test('unknown student or garbage → invalid', async () => {
  const t = jwt.sign({ sub: '99999999-9999-4999-8999-999999999999', typ: 'card' }, QR_SECRET, { expiresIn: '60s' });
  assert.equal((await verify(t)).body.reason, 'invalid');
  for (const junk of ['', 'hello', 'https://evil.test/#t=abc', 42, null, 'x'.repeat(5000)]) {
    assert.equal((await verify(junk)).body.reason, 'invalid', String(junk).slice(0, 20));
  }
});

test('admin check: valid, with the student id for the link', async () => {
  const r = await issue();
  const v = await call('POST', '/admin/card/verify', { code: r.url }, adminToken('super'));
  assert.equal(v.status, 200);
  assert.equal(v.body.valid, true);
  assert.equal(v.body.studentId, AHMED.id);
});

test('admin check: a faculty admin sees validity, but no link to another faculty’s student', async () => {
  const r = await issue();
  const other = await call('POST', '/admin/card/verify', { code: r.url }, adminToken('fac-other'));
  assert.equal(other.body.valid, true);
  assert.equal(other.body.studentId, null);
  const own = await call('POST', '/admin/card/verify', { code: r.url }, adminToken('fac-sci'));
  assert.equal(own.body.studentId, AHMED.id);
});

test('admin check needs an admin', async () => {
  const r = await issue();
  assert.equal((await call('POST', '/admin/card/verify', { code: r.url })).status, 401);
  assert.equal((await call('POST', '/admin/card/verify', { code: r.url }, studentToken(AHMED.id))).status, 401);
});
