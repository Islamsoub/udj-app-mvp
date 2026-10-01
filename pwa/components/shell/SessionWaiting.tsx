'use client';

import { useI18n } from '@/lib/i18n';
/*
 * The login screen's stylesheet, on purpose. This state appears before the shell
 * exists, so none of the shell's chrome is available to it, and it stands in the
 * same place /login would have: one centred card on the page background. Sharing
 * the classes keeps the two visually one family — and keeps this state from
 * growing a second copy of the hero, the mark and the button to drift from.
 */
import styles from '@/components/login/login.module.css';

/**
 * Shown by the route guard when the session could not be checked because the
 * server did not answer — a cold start, a 502/504, a dropped connection.
 *
 * It is NOT the login screen and must not send anyone there: the session may be
 * perfectly good, and signing in again would fail against the same server. So it
 * says what is happening, says the session is kept, and offers the one action
 * that can help. The retry is the student's to press; nothing here polls.
 */
export function SessionWaiting({ onRetry }: { onRetry: () => void }) {
  const { t } = useI18n();

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <header className={styles.hero}>
          {/* Decorative, as on the login screen. */}
          <div className={`${styles.blob} ${styles.blobStart}`} aria-hidden="true" />
          <div className={`${styles.blob} ${styles.blobEnd}`} aria-hidden="true" />
          <span className={styles.mark} aria-hidden="true" />
          <h1 className={styles.brand}>{t('app.university')}</h1>
          <p className={styles.tagline}>{t('app.tagline')}</p>
        </header>

        <div className={styles.body}>
          {/* The neutral card the login screen uses for the same cause (502/504):
              not danger, because nothing the student did is wrong. */}
          <div
            className={`${styles.errorCard} ${styles.errorCardNeutral}`}
            role="status"
            aria-live="polite"
          >
            <div>
              <strong className={styles.errorTitle}>{t('session.waiting_title')}</strong>
              <span>{t('session.waiting_body')}</span>
            </div>
          </div>

          <button type="button" className={styles.submit} onClick={onRetry}>
            {t('actions.retry')}
          </button>
        </div>
      </div>
    </main>
  );
}
