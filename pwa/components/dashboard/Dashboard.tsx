'use client';

import { useState } from 'react';
import { useOnline } from '@/components/shell/useOnline';
import { getAttendance } from '@/lib/api-client';
import type { AttendanceResponse } from '@/lib/api-types';
import { AttendanceCard } from './AttendanceCard';
import { AverageHero } from './AverageHero';
import { NewsCard } from './NewsCard';
import { NotificationsCard } from './NotificationsCard';
import { QuickLinksCard } from './QuickLinksCard';
import { TodayCard } from './TodayCard';
import { takeOnce } from './session-flags';
import { useCardData } from './useCardData';
import { Welcome } from './Welcome';
import styles from './dashboard.module.css';

/**
 * The dashboard.
 *
 * Card order is §4's reading order — schedule, GPA, attendance, notifications,
 * quick links, news — and that order is also the stagger order and the DOM
 * order, so the visual sequence, the focus order and the animation all come from
 * the same single arrangement rather than three that could drift apart.
 */
export function Dashboard() {
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

  /*
   * One attendance request for two readers: the Présence card and the
   * "Justifier une absence" tile, whose pending count comes from the same
   * absences. Fetched here rather than in either card so they cannot show two
   * different answers, and the endpoint is not asked twice per visit.
   */
  const attendance = useCardData<AttendanceResponse>(() => getAttendance(), online);

  return (
    <>
      {/*
        §10 puts the page heading after the topbar actions in the reading order,
        which is here in the content area. The topbar's crossfading title is a
        label, not a heading, so the welcome block's h1 is the page's only one.
      */}
      <Welcome />

      {/*
        app.css:154-159 with hardening.css:2-4. One column, then two from 640px,
        then three from 1024px:

          >= 1024   Aujourd'hui | average over attendance | Notifications
          640-1023  Aujourd'hui | average over attendance
                    Notifications, full width
          both      Quick links, full width; News, full width
          < 640     everything in one column, in DOM order

        The DOM order IS the one-column reading order, the focus order and the
        stagger order, so the three cannot drift apart.
      */}
      <div className={styles.grid}>
        <TodayCard index={0} {...shared} />
        <div className={styles.stack}>
          <AverageHero index={1} {...shared} />
          <AttendanceCard index={2} animate={animate} state={attendance} className={styles.attendanceCard} />
        </div>
        <NotificationsCard index={3} animate={animate} className={styles.notifCard} />
        <QuickLinksCard index={4} animate={animate} attendance={attendance} className={styles.spanAll} />
        <NewsCard index={5} {...shared} className={styles.spanAll} />
      </div>
    </>
  );
}
