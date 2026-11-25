/**
 * The profile's "Sécurité" section: the checks it runs before sending a
 * password change, and how it reads the server's answer.
 *
 * The backend (backend/src/routes/studentPassword.ts) runs its own checks and
 * stays the authority; these only spare the student a round trip for a
 * mistake visible in the form. Same rules and same messages as the PWA's
 * (pwa/components/profile/password-checks.ts, SecurityCard.tsx).
 *
 * Pure, with no React Native import, so tests/passwordChecks.test.ts can run it
 * under plain `node --test`. Results are i18n keys, never text.
 */

/** The backend's bounds (backend/src/utils/passwordPolicy.ts). */
export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 128;

export interface PasswordForm {
  current: string;
  next: string;
  confirm: string;
}

export type PasswordFieldError = 'required' | 'length' | 'same' | 'mismatch';

export type PasswordErrors = Partial<Record<keyof PasswordForm, PasswordFieldError>>;

/** Each field's first problem, in the order the student reads them. */
export function checkPasswordForm({ current, next, confirm }: PasswordForm): PasswordErrors {
  const errors: PasswordErrors = {};

  if (current === '') errors.current = 'required';

  // Length counts characters as the backend's zod does (UTF-16 code units).
  if (next === '') errors.next = 'required';
  else if (next.length < PASSWORD_MIN || next.length > PASSWORD_MAX) errors.next = 'length';
  else if (current !== '' && next === current) errors.next = 'same';

  if (confirm === '') errors.confirm = 'required';
  else if (next !== '' && confirm !== next) errors.confirm = 'mismatch';

  return errors;
}

export function hasErrors(errors: PasswordErrors): boolean {
  return Object.keys(errors).length > 0;
}

/** The i18n key under `profile.security.field` for a field error. */
export function fieldErrorKey(error: PasswordFieldError): string {
  return `profile.security.field.${error}`;
}

/** The backend's 400 messages, mapped to our own strings. */
const SERVER_MESSAGES: Record<string, string> = {
  'Mot de passe actuel incorrect': 'profile.security.error.wrong_current',
  'Le nouveau mot de passe doit contenir entre 8 et 128 caractères': 'profile.security.field.length',
  "Le nouveau mot de passe doit être différent de l'actuel": 'profile.security.field.same',
};

export const WRONG_CURRENT_KEY = 'profile.security.error.wrong_current';

/**
 * What to tell the student after a failed change.
 *
 *   status: the HTTP status, or undefined when no answer arrived (offline,
 *           timeout, DNS).
 *   message: the body's `error`, when it is a string.
 *
 * `key` is an i18n key; `text` is a 400 message we do not know, shown as the
 * server wrote it.
 */
export function failureMessage(
  status: number | undefined,
  message: unknown,
): { key: string } | { text: string } {
  if (status === 429) return { key: 'profile.security.error.too_many' };
  if (status === 400 && typeof message === 'string') {
    const key = SERVER_MESSAGES[message];
    return key ? { key } : { text: message };
  }
  return { key: 'profile.security.error.generic' };
}
