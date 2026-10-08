import type { TranslationKey } from '@/lib/i18n-types';

/**
 * The six authenticated routes, in focus and reading order.
 *
 * Paths are English and stable; the label is a translation key, never a string —
 * the sidebar, the mobile tab bar and the topbar title all read from this one
 * list, so a route cannot end up named one thing in the nav and another in the
 * title bar.
 *
 * Order is the DOM order of the sidebar and the tab bar, which §10 requires to
 * match the visual order. In Arabic the row reverses through `dir="rtl"` alone —
 * this array is never re-sorted.
 */
export interface NavItem {
  /** Route path, matched exactly — see isActivePath. */
  readonly path: string;
  readonly labelKey: TranslationKey;
  /**
   * The short label the mobile tab bar shows, and whether the item is in the
   * tab bar at all: an item without one is not. Five tabs at 390px leave about
   * 78px each, where "Emploi du temps" truncated; the sidebar and the page
   * title keep the full label.
   */
  readonly tabLabelKey?: TranslationKey;
  /** Which glyph in components/shell/icons.tsx renders it. */
  readonly icon: 'home' | 'calendar' | 'chart' | 'check' | 'news' | 'user';
}

export const NAV_ITEMS: readonly NavItem[] = [
  { path: '/', labelKey: 'nav.dashboard', tabLabelKey: 'nav.tab.dashboard', icon: 'home' },
  { path: '/schedule', labelKey: 'nav.schedule', tabLabelKey: 'nav.tab.schedule', icon: 'calendar' },
  { path: '/grades', labelKey: 'nav.grades', tabLabelKey: 'nav.tab.grades', icon: 'chart' },
  { path: '/attendance', labelKey: 'nav.attendance', tabLabelKey: 'nav.tab.attendance', icon: 'check' },
  { path: '/news', labelKey: 'nav.news', tabLabelKey: 'nav.tab.news', icon: 'news' },
  // Not in the tab bar: on mobile, Profile opens from the avatar menu.
  { path: '/profile', labelKey: 'nav.profile', icon: 'user' },
];

/**
 * Whether a nav item is the current page.
 *
 * Exact match, with one deliberate exception: the dashboard is '/', and a
 * prefix test would mark it active on every route in the app. Sub-routes do not
 * exist yet; when they do (an article reader under /news, say) this is the one
 * place that has to learn about them, and `aria-current` follows automatically.
 */
export function isActivePath(itemPath: string, pathname: string): boolean {
  return itemPath === pathname;
}

/** The translation key for the current route's title, or null off-nav. */
export function titleKeyFor(pathname: string): TranslationKey | null {
  return NAV_ITEMS.find((item) => isActivePath(item.path, pathname))?.labelKey ?? null;
}
