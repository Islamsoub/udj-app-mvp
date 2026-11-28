// Which QR code the student card shows (utils/cardCode.ts).
// Run: npm test  (node --test, Node 22.18+ / 23.6+).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { liveCode, offlineCode, secondsLeft, usableOffline } from '../utils/cardCode.ts';

const NOW = new Date('2026-11-28T10:00:00Z');
const res = {
  token: 'aaa.bbb.ccc',
  expiresAt: '2026-11-28T10:01:00Z',
  url: 'https://app.unipocket.io/verify#t=aaa.bbb.ccc',
  offline: { token: 'ddd.eee.fff', url: 'https://app.unipocket.io/verify#t=ddd.eee.fff', expiresAt: '2026-11-29T10:00:00Z' },
};

test('live code shows the link, not the bare token', () => {
  assert.deepEqual(liveCode(res), { value: res.url, kind: 'live', expiresAt: res.expiresAt });
});

test('an older server without url still gives a code (the token)', () => {
  assert.equal(liveCode({ token: 'aaa.bbb.ccc', expiresAt: res.expiresAt }).value, 'aaa.bbb.ccc');
});

test('offline code is taken from the answer, or null when absent', () => {
  assert.deepEqual(offlineCode(res), { value: res.offline.url, kind: 'offline', expiresAt: res.offline.expiresAt });
  assert.equal(offlineCode({ token: 'x', expiresAt: res.expiresAt }), null);
});

test('stored offline code: used while valid', () => {
  const stored = JSON.stringify(offlineCode(res));
  assert.equal(usableOffline(stored, NOW)?.value, res.offline.url);
});

test('stored offline code: dropped once expired, at the exact second too', () => {
  const stored = JSON.stringify(offlineCode(res));
  assert.equal(usableOffline(stored, new Date('2026-11-29T10:00:00Z')), null);
  assert.equal(usableOffline(stored, new Date('2026-11-30T00:00:00Z')), null);
});

test('stored offline code: junk, wrong kind or nothing → null', () => {
  for (const raw of [null, '', 'not json', '{}', JSON.stringify({ ...offlineCode(res), kind: 'live' }), JSON.stringify({ kind: 'offline', value: 1, expiresAt: 'x' })]) {
    assert.equal(usableOffline(raw as string | null, NOW), null, String(raw));
  }
});

test('seconds left', () => {
  assert.equal(secondsLeft(liveCode(res), NOW), 60);
  assert.equal(secondsLeft(liveCode(res), new Date('2026-11-28T10:05:00Z')), 0);
});
