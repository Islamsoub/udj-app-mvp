'use client';

import { useI18n } from '@/lib/i18n';
import type { LoginError } from './LoginError';
import { WifiIcon } from './icons';
import styles from './login.module.css';

/**
 * The one place the four failure kinds turn into visible copy.
 *
 * `role="status"` + `aria-live="polite"` rather than `alert`/assertive: the
 * message appears in response to the student's own submit, so it is expected,
 * and polite lets the screen reader finish the current phrase instead of
 * interrupting mid-word.
 */
export function ErrorCard({ error }: { error: LoginError }) {
  const { t } = useI18n();

  const { className, icon, title, body } = presentation(error, t);

  return (
    <div className={`${styles.errorCard} ${className}`} role="status" aria-live="polite">
      {icon}
      <div>
        <strong className={styles.errorTitle}>{title}</strong>
        <span>{body}</span>
      </div>
    </div>
  );
}

type Translate = ReturnType<typeof useI18n>['t'];

function presentation(error: LoginError, t: Translate) {
  switch (error.kind) {
    case 'credentials':
      return {
        className: '',
        icon: null,
        title: t('login.errors.invalid_credentials_title'),
        // The count comes from the backend and counts down for real. When it is
        // absent the sentence is simply omitted — see attemptsLeftFrom.
        body: [t('login.errors.invalid_credentials'), attemptsSentence(error.attemptsLeft, t)]
          .filter(Boolean)
          .join(' '),
      };

    case 'locked':
      return {
        className: '',
        icon: null,
        title: t('login.errors.locked_title'),
        body: t('login.errors.locked'),
      };

    case 'rateLimited':
      return {
        // Info blue and a wifi glyph. Never danger, never shaken: this is the
        // network's doing, and dressing it as a credentials failure sends the
        // student off to re-check a password that is perfectly correct.
        className: styles.errorCardInfo,
        icon: (
          <div className={styles.errorIcon}>
            <WifiIcon />
          </div>
        ),
        title: t('login.errors.rate_limited_title'),
        body: t('login.errors.rate_limited'),
      };

    case 'server':
      return {
        className: styles.errorCardNeutral,
        icon: null,
        title: t('login.errors.server_title'),
        body: t('login.errors.server'),
      };

    default:
      return {
        className: styles.errorCardNeutral,
        icon: null,
        title: t('common.error'),
        body: t('login.errors.unknown'),
      };
  }
}

/** Singular gets its own string; "1 tentatives" is not French. */
function attemptsSentence(attemptsLeft: number | null, t: Translate): string {
  if (attemptsLeft === null || attemptsLeft < 0) return '';
  if (attemptsLeft === 1) return t('login.errors.attempts_left_one');
  return t('login.errors.attempts_left', { count: attemptsLeft });
}
