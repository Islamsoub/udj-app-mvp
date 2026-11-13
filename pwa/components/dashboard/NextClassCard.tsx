'use client';

import { useEffect, useState } from 'react';
import { getSchedule } from '@/lib/api-client';
import type { ScheduleResponse } from '@/lib/api-types';
import { fmtLtr } from '@/lib/bidi';
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
      href="/schedule"
      index={index}
      animate={animate}
    >
      <CardStates
        state={state}
        skeleton={
          /*
           * The loaded card's own boxes, emptied: the pill keeps its padding,
           * the row its rail, gap and padding, and every text line is one line
           * of ghost text in the loaded line's type and font mix (see
           * .skeletonTextLine). The skeleton is therefore as tall as the loaded
           * card, because §9's ellipsis keeps the subject and meta to one line.
           */
          <div className={styles.nextClass}>
            <span className={`${styles.countdownPill} ${styles.skeleton}`}>
              {/* The countdown text holds a .num figure ("Dans 45 min"). */}
              <span className={`${styles.skeletonGhost} ${styles.skeletonGhostPill}`}>
                <span className="num">0</span>
                {'\u00a0'}
              </span>
            </span>
            <div className={styles.classRow}>
              <span className={`${styles.classRail} ${styles.skeleton}`} />
              <div className={styles.classBody}>
                <span className={`${styles.subjectName} ${styles.skeletonTextLine} ${styles.skeletonW70}`}>{'\u00a0'}</span>
                <span className={`${styles.classMeta} ${styles.skeletonTextLine} ${styles.skeletonW40}`}>{'\u00a0'}</span>
              </div>
              <div className={`${styles.classTime} mono`}>
                <span className={`${styles.skeletonTextLine} ${styles.skeletonTimeLine}`}>{'\u00a0'}</span>
                <span className={`${styles.skeletonTextLine} ${styles.skeletonTimeLine}`}>{'\u00a0'}</span>
              </div>
            </div>
          </div>
        }
      >
        {(data) => {
          const next = findNextClass(data.entries, Date.now());
          if (next === null) return <EmptyState body={t('dashboard.next_class.empty')} />;

          const subject = lang === 'ar' ? next.entry.subject.nameAr : next.entry.subject.nameFr;

          return (
            <div className={styles.nextClass}>
              <Countdown startsAt={next.startsAt} startTime={next.entry.startTime} />

              {/* §6 ①: one .mini-class row. The card still shows the next
                  class only (Flag 1). */}
              <div className={styles.classRow}>
                {/* Decorative. The payload carries no course colour, so the
                    rail is jade for every course (see PROGRESS.md). */}
                <span className={styles.classRail} aria-hidden="true" />

                <div className={styles.classBody}>
                  <p className={styles.subjectName}>{subject}</p>
                  <p className={styles.classMeta}>
                    <span className={styles.metaItem}>
                      <PinIcon className={styles.metaIcon} />
                      <span className={styles.metaText}>{fmtLtr(next.entry.room)}</span>
                    </span>
                    <span className={`${styles.metaItem} ${styles.metaItemShrink}`}>
                      <PersonIcon className={styles.metaIcon} />
                      <span className={styles.metaText}>{next.entry.professorName}</span>
                    </span>
                  </p>
                </div>

                {/* §5: course times are DM Mono, ink2, lh 1.5, end-aligned, on
                    two lines (start over end). .mono keeps them on the Latin
                    face in Arabic; fmtLtr keeps each time in order. The
                    hidden connector makes a screen reader say "10:00 à 11:30"
                    ("إلى" in Arabic); nothing visible changes. */}
                <p className={`${styles.classTime} mono`}>
                  <span className={styles.classTimeLine}>{fmtLtr(next.entry.startTime)}</span>
                  <span className={styles.srOnly}> {t('dashboard.next_class.time_to')} </span>
                  <span className={styles.classTimeLine}>{fmtLtr(next.entry.endTime)}</span>
                </p>
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
function Countdown({ startsAt, startTime }: { startsAt: number; startTime: string }) {
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
      {/* §6 ①: a 13 px clock, gap 6. */}
      <ClockIcon className={styles.countdownIcon} />
      <span>
        <CountdownText parts={parts} startTime={startTime} t={t} />
      </span>
    </span>
  );
}

function CountdownText({
  parts,
  startTime,
  t,
}: {
  parts: CountdownParts;
  startTime: string;
  t: ReturnType<typeof useI18n>['t'];
}) {
  switch (parts.kind) {
    case 'now':
      return <>{t('dashboard.next_class.starting_now')}</>;
    case 'minutes':
      return (
        <Interpolated template={t('dashboard.next_class.in_minutes')} values={{ count: parts.count }} />
      );
    case 'today':
      // Later today: the start time, not a duration. "Today · 13:00" is the
      // thing a student plans around; "in 0 days" or "in 4 h 12" is not.
      return (
        <Interpolated template={t('dashboard.next_class.today_at')} values={{ time: startTime }} />
      );
    case 'days':
      return <Interpolated template={t('dashboard.next_class.in_days')} values={{ count: parts.count }} />;
  }
}
