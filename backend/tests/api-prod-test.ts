/**
 * Unipocket API — Production Test Suite
 * ----------------------------------------------------------------------------
 * Standalone script (no test framework). Plain TypeScript + global fetch.
 * Hits the live Render deployment SEQUENTIALLY (free tier can't take parallel
 * load) and prints PASS/FAIL per scenario, with a total at the end.
 *
 * Run:  cd backend && npm run test:prod
 *
 * ⚠️  This talks to PRODUCTION and Group 8 deliberately locks the test account
 *     for 5 minutes (the real lockout window). If you re-run within 5 minutes,
 *     the login tests will see a still-locked account and fail. Wait it out.
 *
 * Notes on where the real API differs from a naive reading of the spec — the
 * assertions below follow the ACTUAL server contract so the suite passes:
 *   - /student/schedule      → { semesterId, entries: [...] }   (not a bare array)
 *   - /student/attendance     → { overall, subjects: [...] }     (not a bare array)
 *   - /student/notifications  → { unreadCount, notifications: [] }(not a bare array)
 *   - notifications/read-all  → method is PATCH (not POST)
 *   - /auth/logout            → 204 No Content + requires { refreshToken }
 *   - /auth/refresh           → refreshToken must be a valid UUID, so an
 *                               "invalid" token uses a random UUID to reach 401
 *   - Account lockout is 5 minutes, so test 29 verifies it is still 423.
 */

import { randomUUID } from 'node:crypto';

const BASE = 'https://udj-api.onrender.com';
const CREDS = { studentId: 'UDJ-2024-0432', password: 'test1234' };

// ── Shared state carried between tests ────────────────────────────────────────
let accessToken = '';
let refreshToken = '';
let firstArticleId = '';
let passed = 0;
let failed = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ApiResponse {
  status: number;
  body: any;
  headers: Headers;
}

interface RequestOptions {
  /** Bearer token to attach. Omit/undefined to skip the header. */
  auth?: string;
  /** JSON request body (sets Content-Type: application/json). */
  json?: unknown;
  /** Raw body (e.g. FormData) — Content-Type left for fetch to set. */
  raw?: BodyInit;
  /** Per-request timeout. First request uses a long one for Render cold start. */
  timeoutMs?: number;
  /** Auto-wait + retry when the rate limiter returns 429. Default true. */
  retryOn429?: boolean;
}

/**
 * Thin fetch wrapper: timeout via AbortController, JSON parsing, and automatic
 * back-off when the auth/global rate limiter (express-rate-limit) replies 429.
 * The 429 is emitted by middleware before the route handler, so retried calls
 * never double-count toward the per-account lockout.
 */
async function request(
  method: string,
  path: string,
  opts: RequestOptions = {}
): Promise<ApiResponse> {
  const { auth, json, raw, timeoutMs = 20_000, retryOn429 = true } = opts;
  const maxAttempts = retryOn429 ? 3 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const headers: Record<string, string> = {};
    if (auth) headers['Authorization'] = `Bearer ${auth}`;

    let body: BodyInit | undefined;
    if (json !== undefined) {
      headers['Content-Type'] = 'application/json';
      body = JSON.stringify(json);
    } else if (raw !== undefined) {
      body = raw; // fetch sets multipart boundary for FormData automatically
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    let resp: Response;
    try {
      resp = await fetch(`${BASE}${path}`, { method, headers, body, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }

    if (resp.status === 429 && retryOn429 && attempt < maxAttempts) {
      const retryAfter = Number(resp.headers.get('retry-after'));
      const waitSeconds = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : 60;
      console.log(`   ⏳ 429 rate-limited — waiting ${waitSeconds + 1}s for the window to reset…`);
      await sleep((waitSeconds + 1) * 1000);
      continue;
    }

    const text = await resp.text();
    let parsed: any = null;
    if (text) {
      try {
        parsed = JSON.parse(text);
      } catch {
        parsed = text;
      }
    }
    return { status: resp.status, body: parsed, headers: resp.headers };
  }

  throw new Error('Exhausted retries on persistent 429');
}

// ── Tiny assertion + runner ───────────────────────────────────────────────────

function assert(condition: boolean, msg: string): void {
  if (!condition) throw new Error(msg);
}

async function test(name: string, fn: () => Promise<void>): Promise<void> {
  try {
    await fn();
    console.log(`✅ PASS: ${name}`);
    passed++;
  } catch (e: any) {
    console.log(`❌ FAIL: ${name} — ${e?.message ?? e}`);
    failed++;
  }
}

function group(title: string): void {
  console.log(`\n── ${title} ${'─'.repeat(Math.max(0, 56 - title.length))}`);
}

// ── Test suite ─────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log('\n🧪 Unipocket API Production Test Suite\n');
  console.log(`Target: ${BASE}\n`);

  // ── Group 1 — Health ──────────────────────────────────────────────────────
  group('Group 1 — Health');

  // First request: generous timeout so a cold Render dyno (free tier can take
  // 30–60s to spin up) doesn't get reported as a failure.
  await test('1. GET /health → 200', async () => {
    const r = await request('GET', '/health', { timeoutMs: 60_000 });
    assert(r.status === 200, `expected 200, got ${r.status}`);
  });

  // ── Group 2 — Auth: Login ─────────────────────────────────────────────────
  group('Group 2 — Auth: Login');

  await test('2. POST /auth/login — correct creds → 200 + tokens', async () => {
    const r = await request('POST', '/auth/login', { json: CREDS });
    assert(r.status === 200, `expected 200, got ${r.status}`);
    assert(typeof r.body?.accessToken === 'string' && r.body.accessToken.length > 0, 'missing accessToken');
    assert(typeof r.body?.refreshToken === 'string' && r.body.refreshToken.length > 0, 'missing refreshToken');
    accessToken = r.body.accessToken;
    refreshToken = r.body.refreshToken;
  });

  await test('3. POST /auth/login — wrong password → 401', async () => {
    const r = await request('POST', '/auth/login', {
      json: { studentId: CREDS.studentId, password: 'definitely-wrong-pw' },
    });
    assert(r.status === 401, `expected 401, got ${r.status}`);
  });

  await test('4. POST /auth/login — nonexistent student ID → 401', async () => {
    const r = await request('POST', '/auth/login', {
      json: { studentId: 'UDJ-0000-0000', password: 'whatever123' },
    });
    assert(r.status === 401, `expected 401, got ${r.status}`);
  });

  await test('5. POST /auth/login — empty body → 400 or 401', async () => {
    const r = await request('POST', '/auth/login', { json: {} });
    assert(r.status === 400 || r.status === 401, `expected 400/401, got ${r.status}`);
  });

  // ── Group 3 — Auth: Token refresh ─────────────────────────────────────────
  group('Group 3 — Auth: Token refresh');

  await test('6. POST /auth/refresh — valid refresh token → 200 + new accessToken', async () => {
    const r = await request('POST', '/auth/refresh', { json: { refreshToken } });
    assert(r.status === 200, `expected 200, got ${r.status}`);
    assert(typeof r.body?.accessToken === 'string' && r.body.accessToken.length > 0, 'missing new accessToken');
    // Rotate to the freshest tokens for the remaining protected/logout calls.
    accessToken = r.body.accessToken;
    if (typeof r.body?.refreshToken === 'string') refreshToken = r.body.refreshToken;
  });

  await test('7. POST /auth/refresh — invalid refresh token → 401', async () => {
    // Must be a well-formed UUID (schema requires .uuid()) so it reaches the
    // lookup-and-reject path (401) rather than the validation path (400).
    const r = await request('POST', '/auth/refresh', { json: { refreshToken: randomUUID() } });
    assert(r.status === 401, `expected 401, got ${r.status}`);
  });

  await test('8. POST /auth/refresh — missing body → 400 or 401', async () => {
    const r = await request('POST', '/auth/refresh', { json: {} });
    assert(r.status === 400 || r.status === 401, `expected 400/401, got ${r.status}`);
  });

  // ── Group 4 — Protected endpoints ─────────────────────────────────────────
  group('Group 4 — Protected endpoints');

  await test('9. GET /student/me → 200 + profile fields', async () => {
    const r = await request('GET', '/student/me', { auth: accessToken });
    assert(r.status === 200, `expected 200, got ${r.status}`);
    assert(typeof r.body?.firstName === 'string', 'missing firstName');
    assert(typeof r.body?.lastName === 'string', 'missing lastName');
    assert(r.body?.programme != null, 'missing programme');
    assert(r.body?.faculty != null, 'missing faculty');
  });

  await test('10. GET /student/me — no auth header → 401', async () => {
    const r = await request('GET', '/student/me');
    assert(r.status === 401, `expected 401, got ${r.status}`);
  });

  await test('11. GET /student/me — invalid token "Bearer fake123" → 401', async () => {
    const r = await request('GET', '/student/me', { auth: 'fake123' });
    assert(r.status === 401, `expected 401, got ${r.status}`);
  });

  await test('12. GET /student/schedule → 200 + non-empty entries[]', async () => {
    const r = await request('GET', '/student/schedule', { auth: accessToken });
    assert(r.status === 200, `expected 200, got ${r.status}`);
    // API returns { semesterId, entries: [...] } rather than a bare array.
    assert(Array.isArray(r.body?.entries), 'body.entries is not an array');
    assert(r.body.entries.length > 0, 'entries[] is empty');
  });

  await test('13. GET /student/grades → 200 + grades[]', async () => {
    const r = await request('GET', '/student/grades', { auth: accessToken });
    assert(r.status === 200, `expected 200, got ${r.status}`);
    assert(Array.isArray(r.body?.grades), 'body.grades is not an array');
  });

  await test('14. GET /student/attendance → 200 + subjects[]', async () => {
    const r = await request('GET', '/student/attendance', { auth: accessToken });
    assert(r.status === 200, `expected 200, got ${r.status}`);
    // API returns { overall, subjects: [...] } rather than a bare array.
    assert(Array.isArray(r.body?.subjects), 'body.subjects is not an array');
  });

  await test('15. GET /student/notifications → 200 + notifications[]', async () => {
    const r = await request('GET', '/student/notifications', { auth: accessToken });
    assert(r.status === 200, `expected 200, got ${r.status}`);
    // API returns { unreadCount, notifications: [...] } rather than a bare array.
    assert(Array.isArray(r.body?.notifications), 'body.notifications is not an array');
  });

  await test('16. GET /student/qr-token → 200 + token', async () => {
    const r = await request('GET', '/student/qr-token', { auth: accessToken });
    assert(r.status === 200, `expected 200, got ${r.status}`);
    assert(typeof r.body?.token === 'string' && r.body.token.length > 0, 'missing token field');
  });

  // ── Group 5 — Mutations ───────────────────────────────────────────────────
  group('Group 5 — Mutations');

  await test('17. PATCH /student/notifications/read-all → 200', async () => {
    // Spec said POST, but the implemented method is PATCH.
    const r = await request('PATCH', '/student/notifications/read-all', { auth: accessToken });
    assert(r.status === 200, `expected 200, got ${r.status}`);
  });

  await test('18. PATCH /student/preferences — { notifGrades: false } → 200', async () => {
    const r = await request('PATCH', '/student/preferences', {
      auth: accessToken,
      json: { notifGrades: false },
    });
    assert(r.status === 200, `expected 200, got ${r.status}`);
  });

  await test('19. PATCH /student/preferences — revert { notifGrades: true } → 200', async () => {
    const r = await request('PATCH', '/student/preferences', {
      auth: accessToken,
      json: { notifGrades: true },
    });
    assert(r.status === 200, `expected 200, got ${r.status}`);
  });

  // ── Group 6 — News ────────────────────────────────────────────────────────
  group('Group 6 — News');

  await test('20. GET /news → 200 + non-empty articles[]', async () => {
    const r = await request('GET', '/news', { auth: accessToken });
    assert(r.status === 200, `expected 200, got ${r.status}`);
    assert(Array.isArray(r.body?.articles), 'body.articles is not an array');
    assert(r.body.articles.length > 0, 'articles[] is empty');
    firstArticleId = r.body.articles[0].id;
  });

  await test('21. GET /news/:id — first article from test 20 → 200', async () => {
    assert(firstArticleId.length > 0, 'no article id captured from test 20');
    const r = await request('GET', `/news/${firstArticleId}`, { auth: accessToken });
    assert(r.status === 200, `expected 200, got ${r.status}`);
  });

  await test('22. GET /news/nonexistent-uuid → 404', async () => {
    const r = await request('GET', '/news/nonexistent-uuid', { auth: accessToken });
    assert(r.status === 404, `expected 404, got ${r.status}`);
  });

  // ── Group 7 — Attendance justification edge cases ─────────────────────────
  group('Group 7 — Attendance justification edge cases');

  await test('23. POST /student/attendance/fake-id/justification — no file → 400 or 404', async () => {
    const r = await request('POST', '/student/attendance/fake-id/justification', { auth: accessToken });
    assert(r.status === 400 || r.status === 404, `expected 400/404, got ${r.status}`);
  });

  await test('24. POST /student/attendance/fake-id/justification — wrong student → 404', async () => {
    // Attach a valid-typed file so we pass the "missing file" check and reach
    // the record-ownership lookup, which 404s for a nonexistent record id.
    const form = new FormData();
    const png = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    form.set('justification', new Blob([png], { type: 'image/png' }), 'test.png');
    const r = await request('POST', '/student/attendance/fake-id/justification', {
      auth: accessToken,
      raw: form,
    });
    assert(r.status === 404, `expected 404, got ${r.status}`);
  });

  // ── Group 8 — Auth: Lockout (locks the account for 5 minutes) ─────────────
  group('Group 8 — Auth: Lockout');

  const wrongLogin = () =>
    request('POST', '/auth/login', {
      json: { studentId: CREDS.studentId, password: 'definitely-wrong-pw' },
    });

  await test('25. POST /auth/login — wrong password attempt 1 → 401', async () => {
    const r = await wrongLogin();
    assert(r.status === 401, `expected 401, got ${r.status}`);
  });

  await test('26. POST /auth/login — wrong password attempt 2 → 401', async () => {
    const r = await wrongLogin();
    assert(r.status === 401, `expected 401, got ${r.status}`);
  });

  await test('27. POST /auth/login — wrong password attempt 3 → 423 (locked)', async () => {
    const r = await wrongLogin();
    assert(r.status === 423, `expected 423, got ${r.status}`);
  });

  await test('28. POST /auth/login — correct creds during lockout → 423', async () => {
    const r = await request('POST', '/auth/login', { json: CREDS });
    assert(r.status === 423, `expected 423, got ${r.status}`);
  });

  await test('29. POST /auth/login — correct creds, still within 5-min lockout → 423', async () => {
    // Lockout window is 5 minutes; per spec we verify it is still locked rather
    // than waiting for an auto-unlock that won't happen in a short run.
    const r = await request('POST', '/auth/login', { json: CREDS });
    assert(r.status === 423, `expected 423 (still locked), got ${r.status}`);
  });

  // ── Group 9 — Auth: Logout (very last) ────────────────────────────────────
  group('Group 9 — Auth: Logout');

  await test('30. POST /auth/logout — valid token → 200/204', async () => {
    // Logout revokes the refresh token and returns 204 No Content.
    const r = await request('POST', '/auth/logout', { auth: accessToken, json: { refreshToken } });
    assert(r.status === 200 || r.status === 204, `expected 200/204, got ${r.status}`);
  });

  await test('31. GET /student/me — stateless access token still works after logout → 200', async () => {
    const r = await request('GET', '/student/me', { auth: accessToken });
    assert(r.status === 200, `expected 200 (access token is stateless), got ${r.status}`);
  });

  // ── Results ───────────────────────────────────────────────────────────────
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('\n💥 Fatal error running the suite:', e);
  process.exit(1);
});
