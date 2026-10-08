'use client';

import { useState, useSyncExternalStore } from 'react';
import { useI18n } from '@/lib/i18n';
import {
  clearPending,
  getPending,
  getServerPending,
  recordDismissal,
  subscribe,
} from './install-prompt';
import styles from './pwa.module.css';

/**
 * §8 install prompt: "A dismissible banner appears at the very top of the
 * viewport (above the topbar, full-width, jade-faint background) … only when
 * the browser fires beforeinstallprompt … Enters via height: 0→auto + fade over
 * --dur-base, pushing content down (not overlaying it)."
 *
 * In normal flow at the top of <body>, so it pushes the login card or the whole
 * shell down rather than covering the topbar. Rendered only once the event has
 * arrived, which is what makes "only when the browser fires" hold: no event, no
 * element, no reserved space.
 */
export function InstallBanner() {
  const { t } = useI18n();
  const offer = useSyncExternalStore(subscribe, getPending, getServerPending);
  const [busy, setBusy] = useState(false);

  if (offer === null) return null;

  const install = async () => {
    setBusy(true);
    try {
      await offer.prompt();
      const { outcome } = await offer.userChoice;
      // Declining the browser's own dialog is a "not now" too, and is treated
      // like "Plus tard" so the banner does not return on the next page.
      if (outcome === 'dismissed') recordDismissal();
    } catch {
      // prompt() throws if the event was already used; there is nothing to retry.
    } finally {
      setBusy(false);
      clearPending();
    }
  };

  const later = () => {
    recordDismissal();
    clearPending();
  };

  return (
    <aside className={styles.install} aria-label={t('pwa.install.label')}>
      {/* The grid row is what animates 0 → auto; this inner box clips it. */}
      <div className={styles.installClip}>
        <div className={styles.installInner}>
          <p className={styles.installText}>{t('pwa.install.message')}</p>
          <div className={styles.installActions}>
            <button type="button" className={styles.installLater} onClick={later}>
              {t('pwa.install.later')}
            </button>
            <button type="button" className={styles.installPrimary} onClick={install} disabled={busy}>
              {t('pwa.install.action')}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
