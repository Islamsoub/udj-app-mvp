'use client';

import { useI18n } from '@/lib/i18n';
import { LanguageChip } from './LanguageChip';
import { LoginForm } from './LoginForm';
import { UnipocketMark } from './icons';
import styles from './login.module.css';

/** Hero plus form. The card is the whole screen — there is no chrome yet. */
export function LoginCard() {
  const { t } = useI18n();

  return (
    <main className={styles.screen}>
      <div className={styles.card}>
        <header className={styles.hero}>
          <LanguageChip />
          {/* Decorative depth only; aria-hidden so neither reaches the reader. */}
          <div className={`${styles.blob} ${styles.blobStart}`} aria-hidden="true" />
          <div className={`${styles.blob} ${styles.blobEnd}`} aria-hidden="true" />
          <UnipocketMark className={styles.mark} />
          <h1 className={styles.brand}>{t('app.university')}</h1>
          <p className={styles.tagline}>{t('login.subtitle')}</p>
        </header>

        <LoginForm />
      </div>
    </main>
  );
}
