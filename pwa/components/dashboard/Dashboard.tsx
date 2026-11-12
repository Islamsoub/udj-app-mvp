'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { useOnline } from '@/components/shell/useOnline';
import { AttendanceCard } from './AttendanceCard';
import { GpaCard } from './GpaCard';
import { NewsCard } from './NewsCard';
import { NextClassCard } from './NextClassCard';
import { NotificationsCard } from './NotificationsCard';
import { QuickLinksCard } from './QuickLinksCard';
import { takeOnce } from './session-flags';
import styles from './dashboard.module.css';

/**
 * The dashboard.
 *
 * Card order is §4's reading order — schedule, GPA, attendance, notifications,
 * quick links, news — and that order is also the stagger order and the DOM
 * order, so the visual sequence, the focus order and the animation all come from
 * the same single arrangement rather than three that could drift apart.
 *
 * Placement (Dashboard Spec §1, §2) is owned here, by the grid, not by the
 * cards: each card sits in a slot that says where it goes, so the cards stay
 * placement-agnostic. At ≥1024 that is three tracks — next class, then GPA over
 * Assiduité in one column, then Notifications — with Accès rapide and the news
 * card each spanning a full row below. At 640–1023 Notifications takes its own
 * full-width row under the first two. Below 640 everything is one column. Every
 * arrangement keeps the DOM order above, so the reading order, the focus order
 * and the stagger order do not change with the layout.
 */
export function Dashboard() {
  const { t } = useI18n();
  const { online } = useOnline();

  /*
   * §4: the entrance "runs once per session on first dashboard visit only, not
   * on every nav click back to it".
   *
   * Claimed in a lazy initialiser so it is taken exactly once per mount, at the
   * first render — and because the cards below receive it as a prop, all six
   * agree on whether this is the first visit even though they mount together.
   */
  const [animate] = useState(() => takeOnce('dashboard_stagger'));

  /*
   * Connectivity is read here and passed down rather than each card calling
   * useOnline itself: six copies of the same two event listeners would flip at
   * slightly different times, and a dashboard where three cards think they are
   * online and three do not is worse than either answer.
   */
  const shared = { animate, online };

  return (
    <>
      {/*
        §10 puts the page heading after the topbar actions in the reading order,
        which is here in the content area. The topbar's crossfading title is a
        label, not a heading, so this is the page's only h1.
      */}
      <h1 className={styles.heading}>{t('dashboard.heading')}</h1>

      <div className={styles.grid}>
        <NextClassCard index={0} {...shared} />

        {/* §2 ②: one grid cell holding two cards, GPA above Assiduité. */}
        <div className={styles.slotColumn}>
          <div className={styles.slotGpa}>
            <GpaCard index={1} {...shared} />
          </div>
          <div className={styles.slotAttendance}>
            <AttendanceCard index={2} {...shared} />
          </div>
        </div>

        <div className={styles.slotNotifications}>
          <NotificationsCard index={3} {...shared} />
        </div>
        <div className={`${styles.slotSpanAll} ${styles.slotQuickLinks}`}>
          <QuickLinksCard index={4} animate={animate} />
        </div>
        <div className={styles.slotSpanAll}>
          <NewsCard index={5} {...shared} />
        </div>
      </div>
    </>
  );
}
