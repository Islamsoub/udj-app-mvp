'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import { Card } from './Card';
import { AttendanceIcon, CalendarIcon, ChartIcon, GridIcon, NewsIcon } from './icons';
import styles from './dashboard.module.css';

/**
 * The four sections a student jumps to most, routed to the real screens.
 *
 * Profile is left out: it is one tap away in the sidebar and the tab bar, and a
 * quick link to somewhere already permanently on screen is not quick access.
 */
const LINKS: readonly {
  href: string;
  labelKey: TranslationKey;
  Icon: (props: { className?: string }) => React.ReactElement;
}[] = [
  { href: '/schedule', labelKey: 'nav.schedule', Icon: CalendarIcon },
  { href: '/grades', labelKey: 'nav.grades', Icon: ChartIcon },
  { href: '/attendance', labelKey: 'nav.attendance', Icon: AttendanceIcon },
  { href: '/news', labelKey: 'nav.news', Icon: NewsIcon },
];

/**
 * The one card with no request behind it.
 *
 * It therefore has no loading, error or offline state — there is nothing to
 * fetch and nothing to fail, and a skeleton over static links would be theatre.
 * It still takes its place in the §4 stagger, because the entrance is about the
 * page assembling, not about data arriving.
 */
export function QuickLinksCard({ index, animate }: { index: number; animate: boolean }) {
  const { t } = useI18n();

  return (
    <Card title={t('dashboard.quick_links.title')} icon={<GridIcon />} index={index} animate={animate}>
      <div className={styles.quickGrid}>
        {LINKS.map(({ href, labelKey, Icon }) => (
          <Link key={href} href={href} className={styles.quickLink}>
            <Icon className={styles.quickIcon} />
            {t(labelKey)}
          </Link>
        ))}
      </div>
    </Card>
  );
}
