/**
 * The checks the Sécurité form runs before it sends anything. The backend runs
 * its own (backend/src/routes/studentPassword.ts) and stays the authority;
 * these only spare the student a round trip for a mistake visible in the form.
 *
 * Pure, no React: the result names an i18n key per field, or nothing.
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
