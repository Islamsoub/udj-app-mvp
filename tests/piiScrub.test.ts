// What services/sentry.ts removes beyond its matricule/token patterns.
// Run: npm test  (node --test, Node 22.18+ / 23.6+).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { REDACTED, buildNameMatcher, isGradeKey, redactNames } from '../utils/piiScrub.ts';

const m = buildNameMatcher('Ahmed Omar', 'Said');

test('full name is replaced whole', () => {
  assert.equal(redactNames('Profile of Ahmed Omar Said failed', m), `Profile of ${REDACTED} failed`);
});

test('each part on its own is replaced', () => {
  assert.equal(redactNames('hello Omar', m), `hello ${REDACTED}`);
  assert.equal(redactNames('SAID: x', m), `${REDACTED}: x`);
});

test('a part inside another word is left alone', () => {
  assert.equal(redactNames('saidThing Omaraz Ahmedabad', m), 'saidThing Omaraz Ahmedabad');
});

test('accented and Arabic names match', () => {
  const a = buildNameMatcher('Saïd', 'Warsama');
  assert.equal(redactNames('by Saïd', a), `by ${REDACTED}`);
  const b = buildNameMatcher('أحمد', 'عمر');
  assert.equal(redactNames('خطأ أحمد عمر', b), `خطأ ${REDACTED}`);
});

test('short parts are only removed as part of the full name', () => {
  const s = buildNameMatcher('Ali', 'Ou');
  assert.equal(redactNames('Ali Ou left', s), `${REDACTED} left`);
  assert.equal(redactNames('you are Ou', s), 'you are Ou');
});

test('regex characters in a name are literal', () => {
  const s = buildNameMatcher('A.b', '(Test)');
  assert.equal(redactNames('Axb', s), 'Axb');
});

test('no name, no matcher, nothing changes', () => {
  assert.equal(buildNameMatcher(null, ''), null);
  assert.equal(redactNames('Ahmed', null), 'Ahmed');
});

test('the same matcher works on repeated calls (global flag)', () => {
  assert.equal(redactNames('Ahmed', m), REDACTED);
  assert.equal(redactNames('Ahmed', m), REDACTED);
});

test('grade keys', () => {
  for (const k of ['cc_score', 'examScore', 'final_score', 'gpa', 'average', 'grades', 'Moyenne']) {
    assert.equal(isGradeKey(k), true, k);
  }
  for (const k of ['url', 'status_code', 'subject_code', 'coefficient', 'semester']) {
    assert.equal(isGradeKey(k), false, k);
  }
});
