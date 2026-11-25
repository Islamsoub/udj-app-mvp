'use client';

import { useId, useState, type FormEvent } from 'react';
import { EyeIcon, EyeOffIcon } from '@/components/login/icons';
import { useOnline } from '@/components/shell/useOnline';
import { ApiError } from '@/lib/api-client';
import { changePassword } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import {
  checkPasswordForm,
  hasErrors,
  type PasswordErrors,
  type PasswordFieldError,
  type PasswordForm,
} from './password-checks';
import styles from './profile.module.css';

/**
 * "Sécurité", the prototype's password form (view-profile): current, new,
 * confirm, "Mettre à jour". Placed before "Compte".
 *
 * Checked in the form first (password-checks), then sent through
 * lib/auth-client changePassword → app/api/auth/password, which puts the new
 * refresh token in the httpOnly cookie and hands back only the access token.
 * The student stays signed in; their other devices are signed out.
 *
 * After any answer from the server the current password is cleared: on success
 * all three are, on an error the new password and its confirmation are kept.
 *
 * Offline the whole form is disabled with "Connexion requise": there is nothing
 * a password change can do without the server.
 *
 * `username` is the student ID, in a hidden field, so a password manager files
 * the new password under the right account.
 */

const EMPTY: PasswordForm = { current: '', next: '', confirm: '' };

/** The backend's 400 messages (studentPassword.ts), mapped to our own strings. */
const SERVER_MESSAGES: Record<string, TranslationKey> = {
  'Mot de passe actuel incorrect': 'profile.security.error.wrong_current',
  'Le nouveau mot de passe doit contenir entre 8 et 128 caractères': 'profile.security.field.length',
  "Le nouveau mot de passe doit être différent de l'actuel": 'profile.security.field.same',
};

const FIELD_MESSAGES: Record<PasswordFieldError, TranslationKey> = {
  required: 'profile.security.field.required',
  length: 'profile.security.field.length',
  same: 'profile.security.field.same',
  mismatch: 'profile.security.field.mismatch',
};

type Outcome =
  | { kind: 'success' }
  | { kind: 'error'; key: TranslationKey }
  /** A 400 whose message we do not know: shown as the server wrote it. */
  | { kind: 'error'; text: string };

function outcomeFor(err: unknown): Outcome {
  if (err instanceof ApiError) {
    if (err.status === 429) return { kind: 'error', key: 'profile.security.error.too_many' };
    if (err.status === 400) {
      const message = (err.body as { error?: unknown } | null)?.error;
      if (typeof message === 'string') {
        const key = SERVER_MESSAGES[message];
        return key ? { kind: 'error', key } : { kind: 'error', text: message };
      }
    }
  }
  return { kind: 'error', key: 'profile.security.error.generic' };
}

export function SecurityCard({ username }: { username?: string }) {
  const { t } = useI18n();
  const { online } = useOnline();
  const titleId = useId();

  const [form, setForm] = useState<PasswordForm>(EMPTY);
  const [errors, setErrors] = useState<PasswordErrors>({});
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const disabled = !online || submitting;

  function update(field: keyof PasswordForm, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
    // A field's message goes once the student edits it; the others stay.
    setErrors((e) => {
      if (e[field] === undefined) return e;
      const rest = { ...e };
      delete rest[field];
      return rest;
    });
    setOutcome(null);
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (disabled) return;

    const found = checkPasswordForm(form);
    setErrors(found);
    setOutcome(null);
    if (hasErrors(found)) return;

    setSubmitting(true);
    try {
      await changePassword(form.current, form.next);
      setForm(EMPTY);
      setOutcome({ kind: 'success' });
    } catch (err) {
      setForm((f) => ({ ...f, current: '' }));
      setOutcome(outcomeFor(err));
    } finally {
      setSubmitting(false);
    }
  }

  const wrongCurrent = outcome?.kind === 'error' && 'key' in outcome && outcome.key === 'profile.security.error.wrong_current';

  return (
    <section className={`${styles.card} ${styles.securityCard}`} aria-labelledby={titleId}>
      <div className={styles.securityInner}>
        <h2 className={styles.cardTitle} id={titleId}>
          {t('profile.security.title')}
        </h2>

        {!online && <p className={styles.cardNote}>{t('profile.security.offline')}</p>}

        <form onSubmit={handleSubmit} noValidate>
          <fieldset className={styles.securityFieldset} disabled={!online}>
            {username !== undefined && (
              <input
                type="text"
                name="username"
                autoComplete="username"
                value={username}
                readOnly
                hidden
              />
            )}

            <PasswordField
              id={`${titleId}-current`}
              label={t('profile.security.current')}
              autoComplete="current-password"
              value={form.current}
              onChange={(v) => update('current', v)}
              error={errors.current ? t(FIELD_MESSAGES[errors.current]) : null}
              invalid={wrongCurrent}
            />
            <PasswordField
              id={`${titleId}-new`}
              label={t('profile.security.new')}
              autoComplete="new-password"
              value={form.next}
              onChange={(v) => update('next', v)}
              error={errors.next ? t(FIELD_MESSAGES[errors.next]) : null}
              hint={t('profile.security.hint')}
            />
            <PasswordField
              id={`${titleId}-confirm`}
              label={t('profile.security.confirm')}
              autoComplete="new-password"
              value={form.confirm}
              onChange={(v) => update('confirm', v)}
              error={errors.confirm ? t(FIELD_MESSAGES[errors.confirm]) : null}
              last
            />

            <div aria-live="polite" role="status">
              {outcome?.kind === 'success' && (
                <p className={styles.securitySuccess}>{t('profile.security.success')}</p>
              )}
            </div>
            <div aria-live="assertive" role="alert">
              {outcome?.kind === 'error' && (
                <p className={styles.securityError}>
                  {'key' in outcome ? t(outcome.key) : outcome.text}
                </p>
              )}
            </div>

            <button
              type="submit"
              className={`${styles.securitySubmit} ${!online ? styles.securitySubmitBlocked : ''}`}
              disabled={disabled}
              aria-busy={submitting}
            >
              {t(submitting ? 'profile.security.submitting' : 'profile.security.submit')}
            </button>
          </fieldset>
        </form>
      </div>
    </section>
  );
}

function PasswordField({
  id,
  label,
  autoComplete,
  value,
  onChange,
  error,
  hint,
  invalid = false,
  last = false,
}: {
  id: string;
  label: string;
  autoComplete: 'current-password' | 'new-password';
  value: string;
  onChange: (value: string) => void;
  error: string | null;
  hint?: string;
  invalid?: boolean;
  last?: boolean;
}) {
  const { t } = useI18n();
  const [visible, setVisible] = useState(false);
  const messageId = `${id}-msg`;
  const showError = error !== null || invalid;

  return (
    <div className={`${styles.pwField} ${last ? styles.pwFieldLast : ''}`}>
      <label className={styles.pwLabel} htmlFor={id}>
        {label}
      </label>
      <div className={styles.pwWrap}>
        <input
          id={id}
          name={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          className={`${styles.pwInput} ${showError ? styles.pwInputError : ''}`}
          value={value}
          aria-invalid={showError}
          aria-describedby={error !== null || hint ? messageId : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {/* A fixed 44x44 slot in both states, as on the login form. */}
        <button
          type="button"
          className={styles.pwEye}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t('login.hide_password') : t('login.show_password')}
          aria-pressed={visible}
          aria-controls={id}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {error !== null ? (
        <p className={styles.pwFieldError} id={messageId}>
          {error}
        </p>
      ) : hint ? (
        <p className={styles.pwHint} id={messageId}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}
