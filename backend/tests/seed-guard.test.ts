/**
 * The seed scripts delete whole tables. prisma/seed-guard.ts stops them when
 * the target already holds data, unless the operator names the host.
 *
 * Run:  cd backend && npm test
 */
import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { assertSafeToWipe, seedPassword, seedTarget } from '../prisma/seed-guard';

const LIVE = 'postgresql://postgres.abc:s3cret@aws-0-eu-central-1.pooler.supabase.com:6543/postgres';

beforeEach(() => {
  process.env.DATABASE_URL = LIVE;
  delete process.env.SEED_WIPE_CONFIRM;
  delete process.env.SEED_STUDENT_PASSWORD;
});

test('target names host and database, never the credentials', () => {
  assert.equal(seedTarget(), 'aws-0-eu-central-1.pooler.supabase.com/postgres');
  assert.ok(!seedTarget().includes('s3cret'));
});

test('an empty database seeds without confirmation', () => {
  assert.doesNotThrow(() => assertSafeToWipe('seed', { students: 0, admins: 0 }));
});

test('a database with data is refused', () => {
  assert.throws(() => assertSafeToWipe('seed', { students: 7, admins: 6 }), /refused: .*7 students, 6 admins/);
});

test('the refusal message does not leak the password', () => {
  assert.throws(
    () => assertSafeToWipe('seed', { students: 1 }),
    (err: Error) => !err.message.includes('s3cret')
  );
});

test('a wrong confirmation is still refused', () => {
  process.env.SEED_WIPE_CONFIRM = 'localhost';
  assert.throws(() => assertSafeToWipe('seed', { students: 1 }), /refused/);
});

test('confirming the exact host lets it through', () => {
  process.env.SEED_WIPE_CONFIRM = 'aws-0-eu-central-1.pooler.supabase.com';
  assert.doesNotThrow(() => assertSafeToWipe('seed', { students: 1 }));
});

test('password: from the environment when set', () => {
  process.env.SEED_STUDENT_PASSWORD = 'a-long-enough-one';
  assert.deepEqual(seedPassword('SEED_STUDENT_PASSWORD'), { password: 'a-long-enough-one', generated: false });
});

test('password: too short is an error, not silently used', () => {
  process.env.SEED_STUDENT_PASSWORD = 'short';
  assert.throws(() => seedPassword('SEED_STUDENT_PASSWORD'), /at least 8/);
});

test('password: generated and different each run when unset', () => {
  const a = seedPassword('SEED_STUDENT_PASSWORD');
  const b = seedPassword('SEED_STUDENT_PASSWORD');
  assert.equal(a.generated, true);
  assert.ok(a.password.length >= 16);
  assert.notEqual(a.password, b.password);
});
