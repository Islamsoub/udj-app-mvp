/**
 * /student/saved-articles — route tests.
 *
 * Run:  cd backend && npm test
 *
 * WHAT IS REAL. The /student router as src/index.ts mounts it, with its real
 * authMiddleware, the real saved-article rate limiter and the error handler,
 * and every request carries a real signed JWT. Validation, ownership, status
 * codes and the rate limit are the production code paths.
 *
 * WHAT IS NOT. There is no Postgres here and the live database must not be
 * touched, so the Prisma delegates these routes use are replaced with an
 * in-memory store that answers the same queries (including createMany's
 * skipDuplicates on the (studentId, articleId) key). What the tests cannot show
 * is Postgres itself: the saved_articles table exists only after the schema is
 * pushed (see the PR).
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

const students = new Map([
  ['stu-a', { id: 'stu-a', programmeId: 'prog-1', status: 'ACTIVE' }],
  ['stu-b', { id: 'stu-b', programmeId: 'prog-1', status: 'ACTIVE' }],
  ['stu-c', { id: 'stu-c', programmeId: 'prog-1', status: 'ACTIVE' }],
]);

const ART_1 = 'aaaaaaaa-0000-4000-8000-000000000001';
const ART_2 = 'aaaaaaaa-0000-4000-8000-000000000002';
const ART_3 = 'aaaaaaaa-0000-4000-8000-000000000003';
/** Scheduled: dated tomorrow, so not yet published. */
const ART_SCHEDULED = 'aaaaaaaa-0000-4000-8000-00000000000f';
/** A valid UUID that is no article. */
const ART_UNKNOWN = 'bbbbbbbb-0000-4000-8000-000000000000';

const articles = [
  { id: ART_1, publishedAt: new Date(now - 3 * DAY) },
  { id: ART_2, publishedAt: new Date(now - 2 * DAY) },
  { id: ART_3, publishedAt: new Date(now - 1 * DAY) },
  { id: ART_SCHEDULED, publishedAt: new Date(now + 1 * DAY) },
];

interface Saved {
  studentId: string;
  articleId: string;
  createdAt: Date;
}
let saved: Saved[] = [];

/** Matches the few WHERE shapes the routes send. */
function matchArticle(where: any, a: { id: string; publishedAt: Date }): boolean {
  if (where.id !== undefined && where.id !== a.id) return false;
  const lte = where.publishedAt?.lte;
  if (lte !== undefined && !(a.publishedAt.getTime() <= new Date(lte).getTime())) return false;
  return true;
}

function matchSaved(where: any, s: Saved): boolean {
  if (where.studentId !== undefined && where.studentId !== s.studentId) return false;
  if (where.articleId !== undefined && where.articleId !== s.articleId) return false;
  return true;
}

const fakeDb = {
  student: {
    findUnique: async ({ where }: any) => students.get(where.id) ?? null,
  },
  newsArticle: {
    findFirst: async ({ where }: any) => {
      const a = articles.find((x) => matchArticle(where, x));
      return a ? { id: a.id } : null;
    },
  },
  savedArticle: {
    findMany: async ({ where, orderBy }: any) => {
      assert.ok(where?.studentId, 'every read is scoped to a student');
      assert.deepEqual(orderBy, [{ createdAt: 'desc' }, { articleId: 'desc' }]);
      return saved
        .filter((s) => matchSaved(where, s))
        .sort(
          (a, b) =>
            b.createdAt.getTime() - a.createdAt.getTime() || (a.articleId < b.articleId ? 1 : -1)
        )
        .map((s) => ({ articleId: s.articleId, createdAt: s.createdAt }));
    },
    // ON CONFLICT (student_id, article_id) DO NOTHING.
    createMany: async ({ data, skipDuplicates }: any) => {
      assert.equal(skipDuplicates, true);
      let count = 0;
      for (const d of data) {
        const exists = saved.some((s) => s.studentId === d.studentId && s.articleId === d.articleId);
        if (exists) continue;
        saved.push({ studentId: d.studentId, articleId: d.articleId, createdAt: d.createdAt ?? new Date() });
        count++;
      }
      return { count };
    },
    deleteMany: async ({ where }: any) => {
      assert.ok(where?.studentId, 'every delete is scoped to a student');
      const before = saved.length;
      saved = saved.filter((s) => !matchSaved(where, s));
      return { count: before - saved.length };
    },
  },
};

let server: Server;
let base = '';
const tokens: Record<string, string> = {};

before(async () => {
  const { default: prisma } = await import('../src/utils/prisma');
  for (const [model, delegate] of Object.entries(fakeDb)) {
    Object.defineProperty(prisma, model, { value: delegate, configurable: true });
  }

  const { default: express } = await import('express');
  const { default: jwt } = await import('jsonwebtoken');
  const { errorHandler } = await import('../src/middleware/errorHandler');
  const { default: studentRouter } = await import('../src/routes/student');

  for (const id of students.keys()) {
    tokens[id] = jwt.sign({ studentId: id, type: 'access' }, SECRET, { expiresIn: '15m' });
  }

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
  saved = [];
});

async function call(
  method: string,
  path: string,
  { as = 'stu-a', body }: { as?: string; body?: unknown } = {}
) {
  const res = await fetch(`${base}/student/saved-articles${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${tokens[as]}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const list = async (as = 'stu-a') => (await call('GET', '', { as })).body.savedArticles;

// ── Save ──────────────────────────────────────────────────────────────────────

test('save: 204, then the article is in the list', async () => {
  const res = await call('PUT', `/${ART_1}`);
  assert.equal(res.status, 204);
  assert.equal(res.body, null);

  const rows = await list();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].articleId, ART_1);
  assert.ok(!Number.isNaN(Date.parse(rows[0].createdAt)));
});

test('save twice: still 204, one row, and the first date is kept', async () => {
  const first = new Date(now - 10 * DAY).toISOString();
  assert.equal((await call('PUT', `/${ART_1}`, { body: { createdAt: first } })).status, 204);
  assert.equal((await call('PUT', `/${ART_1}`)).status, 204);

  const rows = await list();
  assert.equal(rows.length, 1);
  assert.equal(rows[0].createdAt, first);
});

test('list: newest first', async () => {
  await call('PUT', `/${ART_1}`, { body: { createdAt: new Date(now - 5 * DAY).toISOString() } });
  await call('PUT', `/${ART_3}`, { body: { createdAt: new Date(now - 9 * DAY).toISOString() } });
  await call('PUT', `/${ART_2}`); // now

  const rows = await list();
  assert.deepEqual(
    rows.map((r: any) => r.articleId),
    [ART_2, ART_1, ART_3]
  );
});

test('list: empty for a student with no saves', async () => {
  const res = await call('GET', '');
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { savedArticles: [] });
});

test('save with an old createdAt (the app uploading its saves) keeps that date', async () => {
  const old = new Date(now - 30 * DAY).toISOString();
  assert.equal((await call('PUT', `/${ART_2}`, { body: { createdAt: old } })).status, 204);
  assert.equal((await list())[0].createdAt, old);
});

test('save with createdAt a minute ahead (device clock drift) is accepted', async () => {
  const ahead = new Date(Date.now() + 60 * 1000).toISOString();
  assert.equal((await call('PUT', `/${ART_2}`, { body: { createdAt: ahead } })).status, 204);
});

// ── Unsave ────────────────────────────────────────────────────────────────────

test('unsave: 204, and the article leaves the list', async () => {
  await call('PUT', `/${ART_1}`);
  await call('PUT', `/${ART_2}`);

  const res = await call('DELETE', `/${ART_1}`);
  assert.equal(res.status, 204);
  assert.deepEqual(
    (await list()).map((r: any) => r.articleId),
    [ART_2]
  );
});

test('unsave twice, or something never saved: 204 each time', async () => {
  await call('PUT', `/${ART_1}`);
  assert.equal((await call('DELETE', `/${ART_1}`)).status, 204);
  assert.equal((await call('DELETE', `/${ART_1}`)).status, 204);
  assert.equal((await call('DELETE', `/${ART_3}`)).status, 204);
  assert.equal((await call('DELETE', `/${ART_UNKNOWN}`)).status, 204);
  assert.deepEqual(await list(), []);
});

// ── Not found / invalid ───────────────────────────────────────────────────────

test('save an unknown article: 404, nothing stored', async () => {
  const res = await call('PUT', `/${ART_UNKNOWN}`);
  assert.equal(res.status, 404);
  assert.deepEqual(await list(), []);
});

test('save an unpublished (scheduled) article: 404, the same answer as unknown', async () => {
  const res = await call('PUT', `/${ART_SCHEDULED}`);
  assert.equal(res.status, 404);
  assert.deepEqual(res.body, (await call('PUT', `/${ART_UNKNOWN}`)).body);
  assert.deepEqual(await list(), []);
});

test('createdAt in the future (past the 5-minute tolerance): 400, nothing stored', async () => {
  const future = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const res = await call('PUT', `/${ART_1}`, { body: { createdAt: future } });
  assert.equal(res.status, 400);
  assert.deepEqual(await list(), []);
});

test('createdAt that is not an ISO date: 400', async () => {
  const res = await call('PUT', `/${ART_1}`, { body: { createdAt: 'yesterday' } });
  assert.equal(res.status, 400);
  assert.deepEqual(await list(), []);
});

test('an article id that is not a UUID: 400 on PUT and DELETE', async () => {
  assert.equal((await call('PUT', '/not-a-uuid')).status, 400);
  assert.equal((await call('DELETE', '/not-a-uuid')).status, 400);
});

// ── Ownership ─────────────────────────────────────────────────────────────────

test("another student's saves are never visible, and unsaving touches only your own", async () => {
  await call('PUT', `/${ART_1}`, { as: 'stu-a' });
  await call('PUT', `/${ART_2}`, { as: 'stu-b' });

  assert.deepEqual(
    (await list('stu-a')).map((r: any) => r.articleId),
    [ART_1]
  );
  assert.deepEqual(
    (await list('stu-b')).map((r: any) => r.articleId),
    [ART_2]
  );

  // stu-b "unsaving" stu-a's article removes nothing of stu-a's.
  assert.equal((await call('DELETE', `/${ART_1}`, { as: 'stu-b' })).status, 204);
  assert.deepEqual(
    (await list('stu-a')).map((r: any) => r.articleId),
    [ART_1]
  );
});

test('no token: 401 on every route', async () => {
  for (const [method, path] of [
    ['GET', ''],
    ['PUT', `/${ART_1}`],
    ['DELETE', `/${ART_1}`],
  ]) {
    const res = await fetch(`${base}/student/saved-articles${path}`, { method });
    assert.equal(res.status, 401, `${method} ${path}`);
  }
});

// ── Rate limit ────────────────────────────────────────────────────────────────

// Last, and as a student no other test uses: the limiter's window is in-process
// state and would carry over into anything after it.
test('PUT is limited to 60 a minute per student: the 61st is 429', async () => {
  for (let i = 0; i < 60; i++) {
    const res = await call('PUT', `/${ART_1}`, { as: 'stu-c' });
    assert.equal(res.status, 204, `request ${i + 1}`);
  }
  assert.equal((await call('PUT', `/${ART_1}`, { as: 'stu-c' })).status, 429);
  // Reads and unsaves are not limited.
  assert.equal((await call('GET', '', { as: 'stu-c' })).status, 200);
  assert.equal((await call('DELETE', `/${ART_1}`, { as: 'stu-c' })).status, 204);
});
