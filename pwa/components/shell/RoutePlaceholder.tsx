'use client';

import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import styles from './shell.module.css';

/**
 * Stand-in body for the six routes until their screens are built.
 *
 * It exists for one reason beyond filling space: the <h1>. §10 places the page
 * heading between the topbar actions and the content in the reading order, and
 * that is here, in the content area — the topbar's crossfading title is a label,
 * not a heading. Each screen that replaces this placeholder inherits the
 * obligation to render its own <h1> in the same position.
 */
export function RoutePlaceholder({ titleKey }: { titleKey: TranslationKey }) {
  const { t } = useI18n();

  return (
    <>
      <h1 className={styles.pageHeading}>{t(titleKey)}</h1>
      <p className={styles.pagePlaceholder}>{t('shell.placeholder')}</p>
    </>
  );
}
