/**
 * PATCH /student/password — route tests.
 *
 * Run:  cd backend && npm test
 *
 * WHAT IS REAL. The /auth, /student and /admin/students routers as src/index.ts
 * mounts them, with the real authMiddleware, adminAuth + rbac + audit, the real
 * rate limiters, bcrypt and the error handler. Every request carries a real
 * signed JWT. Signing in is the real POST /auth/login, and "this session still
 * works" is the real POST /auth/refresh.
 *
 * WHAT IS NOT. There is no Postgres here and the live database must not be
 * touched, so the Prisma delegates the routes use are replaced with an
 * in-memory store that answers the same queries. $transaction runs the array's
 * operations in order; what the tests cannot show is Postgres's own atomicity.
 *
 * The password limiter is per student and in-process, so every test uses its
 * own student: one test's attempts never count against another's.
 */

const SECRET = 'test-jwt-secret-0123456789abcdef0123456789';
const ADMIN_SECRET = 'test-admin-secret-0123456789abcdef01234567';
Object.assign(process.env, {
  NODE_ENV: 'test',
  DATABASE_URL: 'postgresql://test:test@127.0.0.1:1/test',
  JWT_SECRET: SECRET,
  QR_SECRET: 'test-qr-secret-0123456789abcdef0123456789',
  SUPABASE_URL: 'http://127.0.0.1:1',
  SUPABASE_SERVICE_ROLE_KEY: 'test',
  JWT_ADMIN_SECRET: ADMIN_SECRET,
  JWT_ADMIN_REFRESH_SECRET: 'test-admin-refresh-0123456789abcdef0123456',
  ADMIN_CORS_ORIGIN: 'http://localhost:3001',
});

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';
import bcrypt from 'bcrypt';

const OLD_PW = 'ancien-mot-de-passe';
const NEW_PW = 'nouveau-mot-de-passe';

// ── In-memory store ───────────────────────────────────────────────────────────

const faculty = { id: 'fac-1', nameFr: 'Sciences', nameAr: 'العلوم', code: 'FS' };
const programme = {
  id: 'prog-1',
  nameFr: 'Informatique',
  nameAr: 'إعلامية',
  code: 'INFO',
  level: 'L1',
  facultyId: faculty.id,
};

interface StudentRow {
  id: string;
  studentIdDisplay: string;
  firstName: string;
  lastName: string;
  email: string | null;
  photoUrl: string | null;
  currentSemester: number;
  status: string;
  programmeId: string;
  passwordHash: string;
  failedLoginAttempts: number;
  lockedUntil: Date | null;
}
interface TokenRow {
  id: string;
  studentId: string;
  tokenHash: string;
  deviceName: string | null;
  issuedAt: Date;
  expiresAt: Date;
  isRevoked: boolean;
}

const students = new Map<string, StudentRow>();
let tokens: TokenRow[] = [];
const notifications: any[] = [];
let oldHash = '';

const sha256 = (v: string) => crypto.createHash('sha256').update(v).digest('hex');

function withRelations(s: StudentRow) {
  return { ...s, programme: { ...programme, faculty } };
}

function matchToken(where: any, t: TokenRow): boolean {
  for (const key of ['id', 'studentId', 'tokenHash', 'isRevoked'] as const) {
    if (where[key] !== undefined && where[key] !== t[key]) return false;
  }
  if (where.expiresAt?.gt && !(t.expiresAt > where.expiresAt.gt)) return false;
  return true;
}

const fakeDb = {
  student: {
    findUnique: async ({ where, select }: any) => {
      const s = students.get(where.id);
      if (!s) return null;
      if (select) return Object.fromEntries(Object.keys(select).map((k) => [k, (s as any)[k]]));
      return withRelations(s);
    },
    findFirst: async ({ where }: any) => {
      const wanted = String(where.studentIdDisplay.equals).toLowerCase();
      const s = [...students.values()].find((x) => x.studentIdDisplay.toLowerCase() === wanted);
      return s ? withRelations(s) : null;
    },
    update: async ({ where, data }: any) => {
      const s = students.get(where.id);
      if (!s) throw new Error('not found');
      Object.assign(s, data);
      return { ...s };
    },
  },
  refreshToken: {
    create: async ({ data }: any) => {
      const row = { id: crypto.randomUUID(), ...data };
      tokens.push(row);
      return row;
    },
    findFirst: async ({ where }: any) => tokens.find((t) => matchToken(where, t)) ?? null,
    update: async ({ where, data }: any) => {
      const t = tokens.find((x) => x.id === where.id)!;
      Object.assign(t, data);
      return t;
    },
    updateMany: async ({ where, data }: any) => {
      const hit = tokens.filter((t) => matchToken(where, t));
      hit.forEach((t) => Object.assign(t, data));
      return { count: hit.length };
    },
  },
  notification: {
    create: async ({ data }: any) => {
      const row = { id: crypto.randomUUID(), isRead: false, createdAt: new Date(), ...data };
      notifications.push(row);
      return row;
    },
    findMany: async ({ where }: any) =>
      notifications
        .filter((x) => x.studentId === where.studentId)
        .sort((x, y) => y.createdAt.getTime() - x.createdAt.getTime()),
    count: async ({ where }: any) =>
      notifications.filter((x) => x.studentId === where.studentId && x.isRead === where.isRead).length,
  },
  admin: {
    findUnique: async ({ where }: any) =>
      where.id === 'admin-1' ? { isActive: true, role: 'SUPER_ADMIN', facultyId: null } : null,
  },
  auditLog: {
    create: async () => ({}),
  },
  // The operations were already started, in array order, by the calls that
  // built the array; this waits for them as Prisma's array form returns them.
  $transaction: async (ops: Promise<unknown>[]) => Promise.all(ops),
};

let n = 0;
/** A fresh ACTIVE student whose password is OLD_PW, with no sessions. */
function newStudent(): StudentRow {
  n += 1;
  const s: StudentRow = {
    id: `stu-${n}`,
    studentIdDisplay: `UDJ-2025-${String(n).padStart(4, '0')}`,
    firstName: 'Amina',
    lastName: 'Test',
    email: null,
    photoUrl: null,
    currentSemester: 1,
    status: 'ACTIVE',
    programmeId: programme.id,
    passwordHash: oldHash,
    failedLoginAttempts: 0,
    lockedUntil: null,
  };
  students.set(s.id, s);
  return s;
}

/** A session made directly in the store (as another device's login would). */
function seedSession(studentId: string, device: string): string {
  const plain = crypto.randomUUID();
  tokens.push({
    id: crypto.randomUUID(),
    studentId,
    tokenHash: sha256(plain),
    deviceName: device,
    issuedAt: new Date(),
    expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000),
    isRevoked: false,
  });
  return plain;
}

// ── Server ────────────────────────────────────────────────────────────────────

let server: Server;
let base = '';
let sign: (payload: object, secret: string, opts: object) => string;
const logged: string[] = [];
const realError = console.error;

before(async () => {
  oldHash = await bcrypt.hash(OLD_PW, 4);

  const { default: prisma } = await import('../src/utils/prisma');
  for (const [model, delegate] of Object.entries(fakeDb)) {
    Object.defineProperty(prisma, model, { value: delegate, configurable: true });
  }

  const { default: express } = await import('express');
  const { default: jwt } = await import('jsonwebtoken');
  const { errorHandler } = await import('../src/middleware/errorHandler');
  const { default: authRouter } = await import('../src/routes/auth');
  const { default: studentRouter } = await import('../src/routes/student');
  const { default: adminStudentsRouter } = await import('../src/routes/admin/students');
  sign = jwt.sign as any;

  const app = express();
  app.use(express.json());
  app.use('/auth', authRouter);
  app.use('/student', studentRouter);
  app.use('/admin/students', adminStudentsRouter);
  app.use(errorHandler);

  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;

  // Everything the server prints, to check that no password ever reaches it.
  console.error = (...args: unknown[]) => {
    logged.push(args.map(String).join(' '));
  };
});

after(async () => {
  console.error = realError;
  await new Promise((r) => server.close(r));
});

const accessFor = (studentId: string) =>
  sign({ studentId, type: 'access' }, SECRET, { expiresIn: '15m' });

async function request(method: string, path: string, body?: unknown, token?: string) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const changePassword = (studentId: string, body: unknown, token = accessFor(studentId)) =>
  request('PATCH', '/student/password', body, token);

// POST /auth/login is limited to 10 a minute per IP and every test runs from
// 127.0.0.1, so the whole file signs in at most 10 times.
let logins = 0;
async function login(s: StudentRow, password: string) {
  logins += 1;
  assert.ok(logins <= 10, 'this file stays under the login rate limit');
  return request('POST', '/auth/login', { studentId: s.studentIdDisplay, password });
}

const refresh = (refreshToken: string) => request('POST', '/auth/refresh', { refreshToken });

// ── Success ───────────────────────────────────────────────────────────────────

test('success: 200, the old password no longer signs in, the new one does', async () => {
  const s = newStudent();
  const res = await changePassword(s.id, { currentPassword: OLD_PW, newPassword: NEW_PW });
  assert.equal(res.status, 200);

  // The login response's format: a token pair and the student object.
  assert.equal(typeof res.body.accessToken, 'string');
  assert.equal(typeof res.body.refreshToken, 'string');
  assert.equal(res.body.student.id, s.id);
  assert.equal(res.body.student.programme.id, programme.id);
  assert.equal(res.body.student.faculty.id, faculty.id);
  // No password and no hash in the response.
  const raw = JSON.stringify(res.body);
  assert.ok(!raw.includes(NEW_PW) && !raw.includes(OLD_PW) && !raw.includes('passwordHash'));

  // Hashed with the backend's bcrypt cost (12).
  assert.match(s.passwordHash, /^\$2b\$12\$/);

  assert.equal((await login(s, OLD_PW)).status, 401);
  assert.equal((await login(s, NEW_PW)).status, 200);
});

// ── Sessions ──────────────────────────────────────────────────────────────────

test('other sessions are signed out; the device that changed it stays signed in', async () => {
  const s = newStudent();
  const phone = seedSession(s.id, 'phone');
  const laptop = seedSession(s.id, 'laptop');

  const res = await changePassword(s.id, { currentPassword: OLD_PW, newPassword: NEW_PW });
  assert.equal(res.status, 200);

  // Every refresh token the student held before is revoked...
  assert.equal((await refresh(phone)).status, 401);
  assert.equal((await refresh(laptop)).status, 401);

  // ...and the pair returned to the caller works: its access token on an
  // authenticated route, its refresh token for the next refresh.
  assert.equal((await request('GET', '/student/notifications', undefined, res.body.accessToken)).status, 200);
  const next = await refresh(res.body.refreshToken);
  assert.equal(next.status, 200);
  assert.equal(typeof next.body.refreshToken, 'string');

  // Exactly one live session left: the one the refresh just rotated to.
  assert.equal(tokens.filter((t) => t.studentId === s.id && !t.isRevoked).length, 1);
});

test('two refreshes at once with the same token: one session, not two', async () => {
  const s = newStudent();
  const phone = seedSession(s.id, 'phone');

  // A real database lookup takes time, so both requests pass the "is it still
  // live?" lookup before either revokes. The in-memory one answers at once;
  // hold the lookup for a moment so the two overlap the same way.
  const realFindFirst = fakeDb.refreshToken.findFirst;
  fakeDb.refreshToken.findFirst = async (args: any) => {
    const row = await realFindFirst(args);
    await new Promise((r) => setTimeout(r, 30));
    return row;
  };
  let a, b;
  try {
    [a, b] = await Promise.all([refresh(phone), refresh(phone)]);
  } finally {
    fakeDb.refreshToken.findFirst = realFindFirst;
  }
  assert.deepEqual([a.status, b.status].sort(), [200, 401]);

  // One new live token, from the one refresh that won.
  assert.equal(tokens.filter((t) => t.studentId === s.id && !t.isRevoked).length, 1);
});

test("another student's sessions are untouched", async () => {
  const s = newStudent();
  const other = newStudent();
  const otherSession = seedSession(other.id, 'phone');

  assert.equal((await changePassword(s.id, { currentPassword: OLD_PW, newPassword: NEW_PW })).status, 200);
  assert.equal((await refresh(otherSession)).status, 200);
  assert.equal(other.passwordHash, oldHash);
});

// ── Notification ──────────────────────────────────────────────────────────────

test('a GENERAL in-app notification is created, in French and Arabic', async () => {
  const s = newStudent();
  const res = await changePassword(s.id, { currentPassword: OLD_PW, newPassword: NEW_PW });
  assert.equal(res.status, 200);

  // Read back the way the app reads it: GET /student/notifications.
  const list = await request('GET', '/student/notifications', undefined, res.body.accessToken);
  assert.equal(list.status, 200);
  assert.equal(list.body.unreadCount, 1);
  const mine = list.body.notifications;
  assert.equal(mine.length, 1);
  assert.equal(mine[0].type, 'GENERAL');
  assert.equal(mine[0].bodyFr, 'Votre mot de passe a été modifié.');
  assert.ok(mine[0].titleAr.length > 0 && mine[0].bodyAr.length > 0);
  assert.equal(mine[0].isRead, false);
});

// ── Refusals ──────────────────────────────────────────────────────────────────

test('wrong current password: 400, password, sessions and lockout counters unchanged', async () => {
  const s = newStudent();
  const phone = seedSession(s.id, 'phone');

  const res = await changePassword(s.id, { currentPassword: 'pas-le-bon', newPassword: NEW_PW });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Mot de passe actuel incorrect');

  assert.equal(s.passwordHash, oldHash);
  assert.equal(s.failedLoginAttempts, 0);
  assert.equal(s.lockedUntil, null);
  assert.equal((await refresh(phone)).status, 200);
  assert.equal(notifications.filter((x) => x.studentId === s.id).length, 0);
});

test('new password the same as the current one: 400 with a French message', async () => {
  const s = newStudent();
  const res = await changePassword(s.id, { currentPassword: OLD_PW, newPassword: OLD_PW });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, "Le nouveau mot de passe doit être différent de l'actuel");
  assert.equal(s.passwordHash, oldHash);
});

test('new password too short (7) or too long (129): 400; 8 and 128 are accepted', async () => {
  const s = newStudent();
  for (const newPassword of ['a'.repeat(7), 'a'.repeat(129)]) {
    const res = await changePassword(s.id, { currentPassword: OLD_PW, newPassword });
    assert.equal(res.status, 400, `length ${newPassword.length}`);
    assert.equal(res.body.error, 'Le nouveau mot de passe doit contenir entre 8 et 128 caractères');
  }
  assert.equal(s.passwordHash, oldHash);

  const t = newStudent();
  assert.equal((await changePassword(t.id, { currentPassword: OLD_PW, newPassword: 'b'.repeat(8) })).status, 200);
  assert.equal(
    (await changePassword(t.id, { currentPassword: 'b'.repeat(8), newPassword: 'c'.repeat(128) })).status,
    200
  );
  // The longest password that can be set can also be used to sign in.
  assert.equal((await login(t, 'c'.repeat(128))).status, 200);
});

test('missing fields: 400 with a French message', async () => {
  const s = newStudent();
  const res = await changePassword(s.id, { newPassword: NEW_PW });
  assert.equal(res.status, 400);
  assert.equal(res.body.error, 'Mot de passe actuel et nouveau mot de passe requis');
});

test('no token: 401', async () => {
  const res = await request('PATCH', '/student/password', { currentPassword: OLD_PW, newPassword: NEW_PW });
  assert.equal(res.status, 401);
});

// ── Rate limit ────────────────────────────────────────────────────────────────

test('5 attempts per 15 minutes per student: the 6th wrong attempt is 429', async () => {
  const s = newStudent();
  for (let i = 1; i <= 5; i++) {
    const res = await changePassword(s.id, { currentPassword: `faux-${i}-xx`, newPassword: NEW_PW });
    assert.equal(res.status, 400, `attempt ${i}`);
  }
  assert.equal((await changePassword(s.id, { currentPassword: 'faux-6-xx', newPassword: NEW_PW })).status, 429);
  // Even the right password is refused now, and nothing changed.
  assert.equal((await changePassword(s.id, { currentPassword: OLD_PW, newPassword: NEW_PW })).status, 429);
  assert.equal(s.passwordHash, oldHash);

  // The limit is per student: another student is not affected.
  const other = newStudent();
  assert.equal((await changePassword(other.id, { currentPassword: OLD_PW, newPassword: NEW_PW })).status, 200);
});

// ── Admin reset ───────────────────────────────────────────────────────────────

test('the admin reset still works after a student changed their password', async () => {
  const s = newStudent();
  const changed = await changePassword(s.id, { currentPassword: OLD_PW, newPassword: NEW_PW });
  assert.equal(changed.status, 200);
  s.failedLoginAttempts = 2; // as if the student had then forgotten it

  const adminToken = sign(
    { adminId: 'admin-1', role: 'SUPER_ADMIN', facultyId: null, type: 'admin_access' },
    ADMIN_SECRET,
    { expiresIn: '1h' }
  );
  const reset = await request('POST', `/admin/students/${s.id}/reset-password`, undefined, adminToken);
  assert.equal(reset.status, 200);
  assert.equal(reset.body.id, s.id);
  assert.equal(reset.body.matricule, s.studentIdDisplay);
  assert.equal(reset.body.message, 'Mot de passe réinitialisé');
  assert.equal(typeof reset.body.newPassword, 'string');

  // The reset clears the lockout counters and revokes every session, the one
  // the password change issued included.
  assert.equal(s.failedLoginAttempts, 0);
  assert.equal(s.lockedUntil, null);
  assert.equal((await refresh(changed.body.refreshToken)).status, 401);

  assert.equal((await login(s, NEW_PW)).status, 401);
  assert.equal((await login(s, reset.body.newPassword)).status, 200);
});

// ── Logging ───────────────────────────────────────────────────────────────────

// Last: it reads what every test above made the server print.
test('no password ever reaches the server log', () => {
  const all = logged.join('\n');
  assert.ok(logged.length > 0, 'the refusals above were logged');
  for (const secret of [OLD_PW, NEW_PW, 'pas-le-bon', 'faux-1-xx', 'a'.repeat(129)]) {
    assert.ok(!all.includes(secret), `"${secret.slice(0, 12)}" was logged`);
  }
});
