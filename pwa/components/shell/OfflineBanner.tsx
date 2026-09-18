'use client';

import { useI18n } from '@/lib/i18n';
import { OfflineIcon } from './icons';
import styles from './shell.module.css';

/**
 * §8: a persistent banner under the topbar while the device is offline. Slides
 * down over --dur-base, back up over --dur-fast, warning-tinted.
 *
 * Always mounted, toggled by a class, because both directions are animated and
 * an unmounted element cannot animate out.
 *
 * No "Dernière synchronisation" timestamp. §8 asks for one, but nothing is
 * cached yet — there is no service worker and no caching layer — so any time we
 * printed would be invented. It belongs with the caching work that gives it a
 * real value to show.
 *
 * `role="status"` with `aria-live="polite"`: losing connectivity is worth
 * announcing, but not worth interrupting whatever the student is reading.
 * `aria-hidden` while up keeps a screen reader from reading a banner that is not
 * on screen.
 */
export function OfflineBanner({ offline }: { offline: boolean }) {
  const { t } = useI18n();

  return (
    <div
      className={`${styles.banner} ${offline ? '' : styles.bannerHidden}`}
      role="status"
      aria-live="polite"
      aria-hidden={!offline}
    >
      <OfflineIcon className={styles.bannerIcon} />
      <span>{t('offline.banner')}</span>
    </div>
  );
}
