'use client';

import type { ReactNode } from 'react';
import { BellIcon } from '@/components/dashboard/icons';
import { notificationWhen } from '@/components/dashboard/relative-time';
import { ShortDate } from '@/components/dashboard/ShortDate';
import { NavIcon } from '@/components/shell/icons';
import { NAV_ITEMS } from '@/components/shell/nav-items';
import { useI18n } from '@/lib/i18n';
import styles from './notifications.module.css';

/**
 * What a notification looks like, wherever it is shown — the dashboard card and
 * the topbar popover both draw from here, so the same notification cannot wear
 * two different chips or two different times.
 */

type ChipIcon = (props: { className?: string }) => ReactNode;

/**
 * The sidebar's own icon for a section, by its route — the NavIcon component
 * and the name NAV_ITEMS gives it, not a copy of the paths. A notification
 * about grades then carries the Notes icon the student already knows from the
 * sidebar and the tab bar, and if that icon ever changes, the chip follows.
 */
function sectionIcon(path: string): ChipIcon {
  const item = NAV_ITEMS.find((nav) => nav.path === path);
  if (!item) throw new Error(`No sidebar section at ${path}`);
  const SectionIcon: ChipIcon = ({ className }) => <NavIcon name={item.icon} className={className} />;
  return SectionIcon;
}

/**
 * The chip for each notification type (backend NotificationType), and where a
 * click on the notification leads.
 *
 * ICONS: the sidebar's section icons, not dashboard.html:111-113's glyphs
 * (product owner, 2026-11-17 — design-known-divergences.md). GENERAL has no
 * section, so it keeps the bell and goes nowhere.
 *
 * TINTS:
 *   GRADES      jade-faint / jade-text    Notes icon       (Design's tint)
 *   ATTENDANCE  warning-bg / warning-INK  Présence icon    (Design's hue, darker
 *               ink: --warning on its own tint is 1.93:1 in light, under the
 *               3:1 a graphic needs; --warning-ink is 5.74:1)
 *   SCHEDULE    exam-bg / exam            Planning icon    (Design's tint)
 *   NEWS        info-bg / info            Actualités icon  (the news screen's
 *               "événements" hue; 3.21:1 light, 4.15:1 dark)
 *   GENERAL     sunken / ink2             bell             (neutral)
 *
 * The chip is decorative: the title says what happened, so colour and glyph
 * are never the only signal.
 */
const TYPES: Record<string, { tone: string; Icon: ChipIcon; href: string | null }> = {
  GRADES: { tone: styles.chipGrades, Icon: sectionIcon('/grades'), href: '/grades' },
  ATTENDANCE: { tone: styles.chipAttendance, Icon: sectionIcon('/attendance'), href: '/attendance' },
  SCHEDULE: { tone: styles.chipSchedule, Icon: sectionIcon('/schedule'), href: '/schedule' },
  NEWS: { tone: styles.chipNews, Icon: sectionIcon('/news'), href: '/news' },
  GENERAL: { tone: styles.chipGeneral, Icon: BellIcon, href: null },
};

function typeOf(type: string) {
  return TYPES[type] ?? TYPES.GENERAL;
}

/** The section a notification of this type belongs to, or null (GENERAL). */
export function notificationHref(type: string): string | null {
  return typeOf(type).href;
}

/** app.css:132-133: 32px, --r-sm, a 15px glyph, tinted by type. */
export function NotificationChip({ type }: { type: string }) {
  const { tone, Icon } = typeOf(type);
  return (
    <span className={`${styles.chip} ${tone}`} aria-hidden="true">
      <Icon className={styles.chipIcon} />
    </span>
  );
}

/**
 * "09:12", "Hier", "Lundi", "10 juin" — in the page's language
 * (relative-time.ts decides which).
 */
export function NotificationTime({ iso, now = Date.now() }: { iso: string; now?: number }) {
  const { t, lang } = useI18n();
  const when = notificationWhen(iso, now);

  switch (when.kind) {
    case 'time':
      // Mono, as Design draws it, and isolated LTR so Arabic cannot reorder it.
      return (
        <bdi dir="ltr" className="mono">
          {when.hours}:{when.minutes}
        </bdi>
      );
    case 'yesterday':
      return <>{t('dashboard.notifications.yesterday')}</>;
    case 'weekday': {
      const name = new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(when.date);
      return <>{lang === 'fr' ? name.charAt(0).toLocaleUpperCase('fr') + name.slice(1) : name}</>;
    }
    case 'date':
      return <ShortDate date={when.date} now={now} />;
  }
}
