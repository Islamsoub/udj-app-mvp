/**
 * API answers are personal, so none may be cached: every response under
 * /auth, /student, /news and /admin carries `Cache-Control: private, no-store`
 * — including the early 400/401 answers, which come from middleware before any
 * route runs. /health is not personal and is left alone.
 *
 * Run:  cd backend && npm test
 *
 * Uses the real app (src/app.ts) on a random port, so the middleware order is
 * the production one. No request here reaches the database.
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
import type { AddressInfo } from 'node:net';
import type { Server } from 'node:http';

let server: Server;
let base = '';

before(async () => {
  const { default: app } = await import('../src/app');
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once('listening', () => resolve()));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

after(() => {
  server.close();
});

const NO_STORE = 'private, no-store';

test('student route without a token: 401, not cacheable', async () => {
  const res = await fetch(`${base}/student/profile`);
  assert.equal(res.status, 401);
  assert.equal(res.headers.get('cache-control'), NO_STORE);
});

test('admin route without a token: 401, not cacheable', async () => {
  const res = await fetch(`${base}/admin/students`);
  assert.equal(res.status, 401);
  assert.equal(res.headers.get('cache-control'), NO_STORE);
});

test('login with an invalid body: 400, not cacheable', async () => {
  const res = await fetch(`${base}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(res.status, 400);
  assert.equal(res.headers.get('cache-control'), NO_STORE);
});

test('admin login with an invalid body: 400, not cacheable', async () => {
  const res = await fetch(`${base}/admin/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  });
  assert.equal(res.status, 400);
  assert.equal(res.headers.get('cache-control'), NO_STORE);
});

test('/health is not marked no-store', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  assert.notEqual(res.headers.get('cache-control'), NO_STORE);
});

test('no x-powered-by banner', async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.headers.get('x-powered-by'), null);
});
