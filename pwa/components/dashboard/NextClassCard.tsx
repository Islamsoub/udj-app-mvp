'use client';

import { useEffect, useState } from 'react';
import { getSchedule } from '@/lib/api-client';
import type { ScheduleResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { Card, CardStates, EmptyState } from './Card';
import { ClockIcon, PersonIcon, PinIcon } from './icons';
import { Interpolated } from './Interpolated';
import { countdownParts, findNextClass, msToNextMinute, type CountdownParts } from './next-class';
import { useCardData } from './useCardData';
import styles from './dashboard.module.css';

export function NextClassCard({ index, animate, online }: { index: number; animate: boolean; online: boolean }) {
  const { t, lang } = useI18n();
  const state = useCardData<ScheduleResponse>(() => getSchedule(), online);

  return (
    <Card
      title={t('dashboard.next_class.title')}
      icon={<ClockIcon />}
      href="/schedule"
      index={index}
      animate={animate}
    >
      <CardStates
        state={state}
        skeleton={
          <div className={styles.skeletonStack}>
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineWide}`} />
          </div>
        }
      >
        {(data) => {
          const next = findNextClass(data.entries, Date.now());
          if (next === null) return <EmptyState body={t('dashboard.next_class.empty')} />;

          const subject = lang === 'ar' ? next.entry.subject.nameAr : next.entry.subject.nameFr;

          return (
            <div>
              <div className={styles.nextClassTop}>
                <p className={styles.subjectName}>{subject}</p>
                <Countdown startsAt={next.startsAt} />
              </div>

              <div className={styles.meta}>
                <span className={styles.metaItem}>
                  <ClockIcon className={styles.metaIcon} />
                  {/* .num: times stay on the Latin face in Arabic. */}
                  <span className="num">
                    {next.entry.startTime} – {next.entry.endTime}
                  </span>
                </span>
                <span className={styles.metaItem}>
                  <PinIcon className={styles.metaIcon} />
                  {next.entry.room}
                </span>
                <span className={styles.metaItem}>
                  <PersonIcon className={styles.metaIcon} />
                  {next.entry.professorName}
                </span>
              </div>
            </div>
          );
        }}
      </CardStates>
    </Card>
  );
}

/**
 * §9: live-updates every 60s with a plain text swap and no transition.
 *
 * The interval is only a prompt to recompute — the number always comes from
 * `Date.now()` against the fixed deadline, so a throttled background tab that
 * fires the timer late, or skips it entirely, still renders the right figure on
 * its next tick instead of drifting by however long it was asleep.
 *
 * The first timeout is aligned to the next whole minute so the text changes when
 * the minute does, rather than 60s after the component happened to mount.
 */
function Countdown({ startsAt }: { startsAt: number }) {
  const { t } = useI18n();
  const [parts, setParts] = useState<CountdownParts>(() => countdownParts(startsAt, Date.now()));

  useEffect(() => {
    setParts(countdownParts(startsAt, Date.now()));

    let interval: number | undefined;

    const align = window.setTimeout(() => {
      setParts(countdownParts(startsAt, Date.now()));
      interval = window.setInterval(() => {
        setParts(countdownParts(startsAt, Date.now()));
      }, 60000);
    }, msToNextMinute(Date.now()));

    return () => {
      window.clearTimeout(align);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [startsAt]);

  return (
    <span className={styles.countdownPill}>
      <CountdownText parts={parts} t={t} />
    </span>
  );
}

function CountdownText({
  parts,
  t,
}: {
  parts: CountdownParts;
  t: ReturnType<typeof useI18n>['t'];
}) {
  switch (parts.kind) {
    case 'now':
      return <>{t('dashboard.next_class.starting_now')}</>;
    case 'minutes':
      return (
        <Interpolated template={t('dashboard.next_class.in_minutes')} values={{ count: parts.count }} />
      );
    case 'hours':
      return (
        <Interpolated template={t('dashboard.next_class.in_hours')} values={{ hours: parts.hours }} />
      );
    case 'hoursMinutes':
      return (
        <Interpolated
          template={t('dashboard.next_class.in_hours_minutes')}
          values={{ hours: parts.hours, minutes: parts.minutes }}
        />
      );
    case 'days':
      return <Interpolated template={t('dashboard.next_class.in_days')} values={{ count: parts.count }} />;
  }
}
