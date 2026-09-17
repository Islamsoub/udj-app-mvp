'use client';

import { useI18n } from '@/lib/i18n';
import { GlobeIcon } from './icons';
import styles from './login.module.css';

/**
 * FR ⇄ AR in one tap, before the student has an account context to store it
 * against — which is the whole reason it sits on the login screen at all.
 *
 * `setLang` already writes both the cookie and localStorage, so the choice
 * survives the redirect after login and the server renders the next page in the
 * right direction. Nothing is persisted here.
 *
 * The flip is instantaneous by design: no mirror animation. Watching a layout
 * crawl from one side to the other is slower to read than simply arriving
 * mirrored, and any transition on a direction change tends to tear.
 */
export function LanguageChip() {
  const { lang, setLang, t } = useI18n();

  const next = lang === 'fr' ? 'ar' : 'fr';

  return (
    <button
      type="button"
      className={styles.langChip}
      onClick={() => setLang(next)}
      // The label names the destination, not the current state — the visible
      // "FR"/"AR" already says where you are.
      aria-label={`${t('login.language_switch')} — ${t(`language.${next}`)}`}
      lang={lang}
    >
      <GlobeIcon />
      <span className={styles.langCode}>{lang.toUpperCase()}</span>
    </button>
  );
}
