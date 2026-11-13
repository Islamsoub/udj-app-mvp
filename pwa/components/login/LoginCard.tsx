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
            The university's reversed logo, LOGO_ON_COLOUR (lib/brand.ts),
            served as an SVG file rather than inlined so it stays sharp at any
            size and pixel density, and so another university swaps the file
            rather than this component.

            Drawn as a MASK coloured --hero-mark, not as an <img>: the file
            supplies only the shape, and the token keeps the colour decided in
            globals.css alone. The stylesheet reads the file through
            --logo-on-colour (see login.module.css .mark).

            aria-hidden — decorative. The hero's <h1> underneath names the
            university and the document title carries "Unipocket", so the mark
            adds nothing a screen reader would otherwise miss.
          */}
          <span className={styles.mark} aria-hidden="true" />
          <h1 className={styles.brand}>{t('app.university')}</h1>
          <p className={styles.tagline}>{t('login.subtitle')}</p>
        </header>

        <LoginForm />
      </div>
    </main>
  );
}
