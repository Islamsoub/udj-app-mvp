// The profile's password-change checks and error messages.
// Run: npm test  (node --test, Node 22.18+ / 23.6+).

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  checkPasswordForm,
  failureMessage,
  fieldErrorKey,
  hasErrors,
} from '../utils/passwordChecks.ts';

const form = (current: string, next: string, confirm: string) => ({ current, next, confirm });

test('a valid form has no errors', () => {
  const errors = checkPasswordForm(form('ancien-mdp', 'nouveau-mdp', 'nouveau-mdp'));
  assert.deepEqual(errors, {});
  assert.equal(hasErrors(errors), false);
});

test('every empty field is required', () => {
  assert.deepEqual(checkPasswordForm(form('', '', '')), {
    current: 'required',
    next: 'required',
    confirm: 'required',
  });
});

test('new password: 7 and 129 characters are refused, 8 and 128 accepted', () => {
  assert.equal(checkPasswordForm(form('x', 'a'.repeat(7), 'a'.repeat(7))).next, 'length');
  assert.equal(checkPasswordForm(form('x', 'a'.repeat(129), 'a'.repeat(129))).next, 'length');
  assert.equal(checkPasswordForm(form('x', 'a'.repeat(8), 'a'.repeat(8))).next, undefined);
  assert.equal(checkPasswordForm(form('x', 'a'.repeat(128), 'a'.repeat(128))).next, undefined);
});

test('new password the same as the current one is refused', () => {
  assert.deepEqual(checkPasswordForm(form('meme-mdp-123', 'meme-mdp-123', 'meme-mdp-123')), {
    next: 'same',
  });
});

test('confirmation that does not match is refused', () => {
  assert.deepEqual(checkPasswordForm(form('ancien-mdp', 'nouveau-mdp', 'nouveau-mdX')), {
    confirm: 'mismatch',
  });
});

test('field errors map to keys under profile.security.field', () => {
  assert.equal(fieldErrorKey('mismatch'), 'profile.security.field.mismatch');
});

test("the server's messages map to our strings; 429 and no answer have their own", () => {
  assert.deepEqual(failureMessage(400, 'Mot de passe actuel incorrect'), {
    key: 'profile.security.error.wrong_current',
  });
  assert.deepEqual(
    failureMessage(400, "Le nouveau mot de passe doit être différent de l'actuel"),
    { key: 'profile.security.field.same' },
  );
  assert.deepEqual(failureMessage(429, 'Too many requests, please try again later'), {
    key: 'profile.security.error.too_many',
  });
  assert.deepEqual(failureMessage(undefined, undefined), { key: 'profile.security.error.generic' });
  assert.deepEqual(failureMessage(502, 'Bad gateway'), { key: 'profile.security.error.generic' });
  // An unknown 400 is shown as the server wrote it.
  assert.deepEqual(failureMessage(400, 'Autre message'), { text: 'Autre message' });
});
