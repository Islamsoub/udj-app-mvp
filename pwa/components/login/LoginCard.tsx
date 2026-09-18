'use client';

import { useI18n } from '@/lib/i18n';
import { LanguageChip } from './LanguageChip';
import { LoginForm } from './LoginForm';
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
          {/*
            The real mark, copied from assets/icons/Logo.svg (which the native
            app imports — read only, never edited). Served as an SVG file rather
            than inlined so it stays sharp at any size and on any pixel density.

            alt="" — decorative. The hero's <h1> underneath names the university
            and the document title carries "Unipocket", so the mark adds nothing
            a screen reader would otherwise miss; announcing it would just put a
            brand name in front of a login form that already identifies itself.
          */}
          <img className={styles.mark} src="/logo.svg" alt="" />
          <h1 className={styles.brand}>{t('app.university')}</h1>
          <p className={styles.tagline}>{t('login.subtitle')}</p>
        </header>

        <LoginForm />
      </div>
    </main>
  );
}
