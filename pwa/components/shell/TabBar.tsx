'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { NAV_ITEMS, isActivePath } from './nav-items';
import { NavIcon } from './icons';
import styles from './shell.module.css';

/**
 * Mobile navigation (§7), mounted only below 640px.
 *
 * The switch between this and the sidebar is a hard breakpoint change with no
 * transition, which is why neither component animates in or out — they are
 * mounted and unmounted, and §7 is explicit that the change corresponds to a
 * full input-model change rather than a resize to be smoothed over.
 *
 * §4: tab switches use the same instant-swap plus progress-bar pattern as the
 * sidebar, so there is nothing extra to do here — ProgressBar keys off the
 * pathname regardless of which control changed it.
 *
 * Tab order mirrors in Arabic with no code: a flex row follows `dir`.
 */
export function TabBar({ pathname }: { pathname: string }) {
  const { t } = useI18n();

  return (
    <nav className={styles.tabBar} aria-label={t('shell.main_nav')}>
      {NAV_ITEMS.map((item) => {
        const active = isActivePath(item.path, pathname);
        const label = t(item.labelKey);

        return (
          <Link
            key={item.path}
            href={item.path}
            className={`${styles.tab} ${active ? styles.tabActive : ''}`}
            aria-current={active ? 'page' : undefined}
            // The visible label is truncated with an ellipsis at this width, so
            // the full string goes on the link where a screen reader gets it
            // whole.
            aria-label={label}
          >
            <NavIcon name={item.icon} className={styles.tabIcon} />
            <span className={styles.tabLabel} aria-hidden="true">
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
