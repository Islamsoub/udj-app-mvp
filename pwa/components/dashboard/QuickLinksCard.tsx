'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import type { AttendanceResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { Card } from './Card';
import { CalculatorIcon, CalendarIcon, UploadIcon } from './icons';
import { Interpolated } from './Interpolated';
import type { CardState } from './useCardData';
import styles from './dashboard.module.css';

/**
 * Justifications the student has sent and the office has not yet decided on,
 * across every subject — the same records the attendance screen lists.
 */
function pendingJustifications(data: AttendanceResponse): number {
  let count = 0;
  for (const subject of data.subjects) {
    for (const absence of subject.absences) {
      if (absence.justificationStatus === 'PENDING') count += 1;
    }
  }
  return count;
}

/**
 * Accès rapide (dashboard.html:117-123; app.css:200-207; hardening.css:5-6, 9,
 * 11): three tiles, in Design's order.
 *
 *   Justifier une absence  -> /attendance, with the real pending count
 *   Simuler ma moyenne     -> /grades. The calculator there opens from a button
 *                             and has no URL of its own, so the tile cannot land
 *                             on it; it lands on the screen that holds it.
 *   Mon planning           -> /schedule. Design says "Imprimer mon planning",
 *                             but the PWA cannot print a timetable, so the tile
 *                             does not promise it (design-known-divergences.md).
 *
 * Only the first tile has data behind it. Its small line follows the dashboard's
 * attendance request: a short shimmer while it loads, the count once it has,
 * and nothing at all when it failed — "Aucune en attente" would be a claim the
 * app cannot make without the data.
 */
export function QuickLinksCard({
  index,
  animate,
  attendance,
  className,
}: {
  index: number;
  animate: boolean;
  attendance: CardState<AttendanceResponse>;
  className?: string;
}) {
  const { t } = useI18n();

  let pending: ReactNode = null;
  if (attendance.phase === 'loading') {
    pending = <span className={`${styles.skeleton} ${styles.quickSmallSkeleton}`} aria-hidden="true" />;
  } else if (attendance.phase === 'ready') {
    const count = pendingJustifications(attendance.data);
    pending =
      count === 0 ? (
        t('dashboard.quick_links.justify.none')
      ) : (
        <Interpolated template={t('dashboard.quick_links.justify.pending')} values={{ count }} />
      );
  }

  return (
    <Card
      title={t('dashboard.quick_links.title')}
      className={`${className ?? ''} ${styles.quickCard}`}
      index={index}
      animate={animate}
    >
      <div className={styles.quickGrid}>
        <QuickTile
          href="/attendance"
          tone={styles.quickToneWarning}
          icon={<UploadIcon className={styles.quickIcon} />}
          title={t('dashboard.quick_links.justify.title')}
          small={pending}
        />
        <QuickTile
          href="/grades"
          tone={styles.quickToneInfo}
          icon={<CalculatorIcon className={styles.quickIcon} />}
          title={t('dashboard.quick_links.simulate.title')}
          small={t('dashboard.quick_links.simulate.small')}
        />
        <QuickTile
          href="/schedule"
          tone={styles.quickToneJade}
          icon={<CalendarIcon className={styles.quickIcon} />}
          title={t('dashboard.quick_links.schedule.title')}
          small={t('dashboard.quick_links.schedule.small')}
        />
      </div>
    </Card>
  );
}

/** app.css:202-207 .qlink: icon square, then the title over the small line. */
function QuickTile({
  href,
  tone,
  icon,
  title,
  small,
}: {
  href: string;
  tone: string;
  icon: ReactNode;
  title: string;
  small: ReactNode;
}) {
  return (
    <Link href={href} className={styles.quickLink}>
      <span className={`${styles.quickSquare} ${tone}`} aria-hidden="true">
        {icon}
      </span>
      <span className={styles.quickText}>
        <span className={styles.quickTitle}>{title}</span>
        {small !== null && <small className={styles.quickSmall}>{small}</small>}
      </span>
    </Link>
  );
}
