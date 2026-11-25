/**
 * GET /news and GET /news/:id — a scheduled article (publishedAt in the
 * future) is hidden from students until its date passes.
 *
 * Run:  cd backend && npm test
 *
 * WHAT IS REAL. The /news router as src/index.ts mounts it, with its real
 * authMiddleware and the error handler, and every request carries a real
 * signed JWT. The published-only filter is the production code path.
 *
 * WHAT IS NOT. There is no Postgres here, so the Prisma delegates the routes use
 * are replaced with an in-memory store that answers the same WHERE shapes
 * (id, category, publishedAt.lte). The clock is node:test's mocked Date, so
 * "its date has passed" is a real move of the server's clock, not an edit of
 * the fixture.
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

import { test, before, after, afterEach, mock } from 'node:test';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

const DAY = 24 * 60 * 60 * 1000;
const START = Date.now();

const students = new Map([['stu-a', { id: 'stu-a', programmeId: 'prog-1', status: 'ACTIVE' }]]);

const ART_OLD = 'aaaaaaaa-0000-4000-8000-000000000001';
const ART_NEW = 'aaaaaaaa-0000-4000-8000-000000000002';
/** Scheduled: dated two days from START. */
const ART_SCHEDULED = 'aaaaaaaa-0000-4000-8000-00000000000f';
/** A valid UUID that is no article. */
const ART_UNKNOWN = 'bbbbbbbb-0000-4000-8000-000000000000';

function article(id: string, publishedAt: number, category: string) {
  return {
    id,
    titleFr: `Titre ${id}`,
    titleAr: '',
    bodyFr: 'Corps',
    bodyAr: '',
    category,
    heroImageUrl: null,
    readTimeMinutes: 2,
    isUrgent: false,
    publishedAt: new Date(publishedAt),
  };
}

const articles = [
  article(ART_OLD, START - 3 * DAY, 'events'),
  article(ART_NEW, START - 1 * DAY, 'academic'),
  article(ART_SCHEDULED, START + 2 * DAY, 'events'),
];

/** Matches the WHERE shapes the routes send. */
function matches(where: any, a: (typeof articles)[number]): boolean {
  if (!where) return true;
  if (where.id !== undefined && where.id !== a.id) return false;
  if (where.category !== undefined && where.category !== a.category) return false;
  const lte = where.publishedAt?.lte;
  if (lte !== undefined && !(a.publishedAt.getTime() <= new Date(lte).getTime())) return false;
  return true;
}

function pick(a: Record<string, unknown>, select?: Record<string, boolean>) {
  if (!select) return { ...a };
  return Object.fromEntries(Object.keys(select).filter((k) => select[k]).map((k) => [k, a[k]]));
}

const fakeDb = {
  student: {
    findUnique: async ({ where }: any) => students.get(where.id) ?? null,
  },
  newsArticle: {
    findMany: async ({ where, orderBy, take, skip, select }: any) => {
      assert.deepEqual(orderBy, { publishedAt: 'desc' });
      return articles
        .filter((a) => matches(where, a))
        .sort((x, y) => y.publishedAt.getTime() - x.publishedAt.getTime())
        .slice(skip ?? 0, (skip ?? 0) + (take ?? Infinity))
        .map((a) => pick(a, select));
    },
    findFirst: async ({ where }: any) => {
      const a = articles.find((x) => matches(where, x));
      return a ? { ...a } : null;
    },
  },
};

let server: Server;
let base = '';
let jwtSign: (payload: object, secret: string, opts: object) => string;

before(async () => {
  const { default: prisma } = await import('../src/utils/prisma');
  for (const [model, delegate] of Object.entries(fakeDb)) {
    Object.defineProperty(prisma, model, { value: delegate, configurable: true });
  }

  const { default: express } = await import('express');
  const { default: jwt } = await import('jsonwebtoken');
  const { errorHandler } = await import('../src/middleware/errorHandler');
  const { default: newsRouter } = await import('../src/routes/news');
  jwtSign = jwt.sign as any;

  const app = express();
  app.use(express.json());
  app.use('/news', newsRouter);
  app.use(errorHandler);

  server = await new Promise<Server>((resolve) => {
    const s = app.listen(0, '127.0.0.1', () => resolve(s));
  });
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(async () => {
  await new Promise((r) => server.close(r));
});

afterEach(() => {
  mock.timers.reset();
});

/** Signed at request time, so a token is valid against the (possibly mocked) clock. */
async function get(path: string) {
  const token = jwtSign({ studentId: 'stu-a', type: 'access' }, SECRET, { expiresIn: '15m' });
  const res = await fetch(`${base}/news${path}`, { headers: { Authorization: `Bearer ${token}` } });
  const text = await res.text();
  return { status: res.status, body: text ? JSON.parse(text) : null };
}

const listIds = async (query = '') =>
  ((await get(query)).body.articles as { id: string }[]).map((a) => a.id);

test('list: a scheduled article is not returned', async () => {
  assert.deepEqual(await listIds(), [ART_NEW, ART_OLD]);
});

test('list with a category filter: the scheduled article in that category is not returned', async () => {
  assert.deepEqual(await listIds('?category=events'), [ART_OLD]);
});

test('detail: a scheduled article is 404, the same answer as an unknown one', async () => {
  const scheduled = await get(`/${ART_SCHEDULED}`);
  assert.equal(scheduled.status, 404);
  assert.deepEqual(scheduled.body, (await get(`/${ART_UNKNOWN}`)).body);
});

test('detail: a published article is returned', async () => {
  const res = await get(`/${ART_NEW}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.id, ART_NEW);
});

test('once its date has passed, the scheduled article appears in the list and the detail', async () => {
  mock.timers.enable({ apis: ['Date'], now: START + 2 * DAY + 1000 });

  assert.deepEqual(await listIds(), [ART_SCHEDULED, ART_NEW, ART_OLD]);
  assert.deepEqual(await listIds('?category=events'), [ART_SCHEDULED, ART_OLD]);

  const res = await get(`/${ART_SCHEDULED}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.id, ART_SCHEDULED);
});

test('one second before its date, it is still hidden', async () => {
  mock.timers.enable({ apis: ['Date'], now: START + 2 * DAY - 1000 });

  assert.deepEqual(await listIds(), [ART_NEW, ART_OLD]);
  assert.equal((await get(`/${ART_SCHEDULED}`)).status, 404);
});

test('no token: 401 on the list and the detail', async () => {
  for (const path of ['', `/${ART_NEW}`]) {
    const res = await fetch(`${base}/news${path}`);
    assert.equal(res.status, 401, path || '/');
  }
});
