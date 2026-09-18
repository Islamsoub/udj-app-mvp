'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import { NAV_ITEMS, isActivePath } from './nav-items';
import { ChevronIcon, NavIcon, UnipocketMark } from './icons';
import styles from './shell.module.css';

/**
 * Desktop and tablet navigation (§7).
 *
 * Mounted only at >=640px — below that it does not exist in the tree at all and
 * TabBar takes over. That is the spec's requirement, and it is also what makes
 * the focus order correct on a phone: a hidden-but-present sidebar would put six
 * invisible links between the skip link and the content.
 *
 * `collapsed` is owned by AppShell, not here, because between 640 and 1024 it is
 * forced by the viewport rather than chosen by the student.
 */
export function Sidebar({
  collapsed,
  canToggle,
  onToggle,
  pathname,
}: {
  collapsed: boolean;
  /** False on tablet, where §7 forces the collapsed state. */
  canToggle: boolean;
  onToggle: () => void;
  pathname: string;
}) {
  const { t } = useI18n();

  return (
    <div className={`${styles.sidebar} ${collapsed ? styles.sidebarCollapsed : ''}`}>
      <div className={styles.brand}>
        <UnipocketMark className={styles.brandMark} />
        <span className={`${styles.brandName} ${collapsed ? styles.navLabelHidden : styles.navLabel}`}>
          {t('app.name')}
        </span>
      </div>

      {/* §10: a real <nav>, labelled, with aria-current on the active item. */}
      <nav className={styles.nav} aria-label={t('shell.main_nav')}>
        {NAV_ITEMS.map((item) => {
          const active = isActivePath(item.path, pathname);
          const label = t(item.labelKey);

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
              // aria-current is the ARIA signal for "this is the page you are
              // on"; the jade tint is the visual one. §10 asks for both.
              aria-current={active ? 'page' : undefined}
              /*
               * The accessible name is on the link itself, not left to the
               * visible span. Collapsing hides that span from the accessibility
               * tree, and a nav of six unnamed links is the classic icon-rail
               * failure. Naming the link keeps it correct in both states and
               * through the animation between them.
               */
              aria-label={label}
              title={collapsed ? label : undefined}
            >
              <NavIcon name={item.icon} className={styles.navIcon} />
              <span
                className={collapsed ? styles.navLabelHidden : styles.navLabel}
                aria-hidden="true"
              >
                {label}
              </span>
            </Link>
          );
        })}
      </nav>

      {/*
        Hidden on tablet: §7 makes the collapsed state a property of the
        viewport there, so offering a control that cannot change it would be a
        dead button. It returns at >=1024 where the choice is the student's.
      */}
      {canToggle && (
        <div className={styles.sidebarFooter}>
          <button
            type="button"
            className={styles.collapseButton}
            onClick={onToggle}
            aria-expanded={!collapsed}
            aria-label={collapsed ? t('shell.expand') : t('shell.collapse')}
          >
            <ChevronIcon className={`${styles.chevron} ${collapsed ? styles.chevronFlipped : ''}`} />
            <span
              className={collapsed ? styles.navLabelHidden : styles.navLabel}
              aria-hidden="true"
            >
              {t('shell.collapse')}
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
