'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { courseType, typeLabelKey } from '@/components/schedule/course-type';
import {
  buildSubjectColorMap,
  subjectStyle,
  subjectSwatch,
  type SubjectSwatch,
} from '@/lib/subject-colors';
import { getSchedule } from '@/lib/api-client';
import type { ScheduleEntry, ScheduleResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import type { Lang } from '@/lib/i18n-shared';
import { Card, CardStates, EmptyState } from './Card';
import { ClockIcon } from './icons';
import { Interpolated } from './Interpolated';
import {
  countdownParts,
  findNextClass,
  msToNextMinute,
  todaysClasses,
  type CountdownParts,
} from './next-class';
import { useCardData } from './useCardData';
import styles from './dashboard.module.css';

/**
 * Aujourd'hui (dashboard.html:87-93): today's date in the heading, "Voir tout"
 * to the timetable, the countdown pill, then every class of the day in time
 * order.
 *
 * Not a link as a whole, unlike the attendance card: Design gives it a "Voir
 * tout" instead, and a card that is one big link cannot also hold one.
 */
export function TodayCard({
  index,
  animate,
  online,
  className,
}: {
  index: number;
  animate: boolean;
  online: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const state = useCardData<ScheduleResponse>(() => getSchedule(), online);
  const now = useMinuteClock();

  return (
    <Card
      title={<TodayTitle now={now} />}
      action={{ href: '/schedule', label: t('dashboard.today.see_all') }}
      className={className}
      index={index}
      animate={animate}
    >
      <CardStates
        state={state}
        skeleton={
          <div>
            <div className={`${styles.skeleton} ${styles.skeletonPill}`} />
            {[0, 1, 2].map((row) => (
              <div key={row} className={styles.miniClass}>
                <div className={`${styles.skeleton} ${styles.miniRail}`} />
                <div className={styles.skeletonStack} style={{ flex: 1, gap: 6 }}>
                  <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
                  <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                </div>
              </div>
            ))}
          </div>
        }
      >
        {(data) => {
          const today = todaysClasses(data.entries, now);
          // From the whole timetable, not today's classes: the same input as
          // the schedule screen and the app, so a subject is one colour in all.
          const colors = buildSubjectColorMap(data.entries);
          const next = findNextClass(data.entries, now);

          return (
            <div>
              {/* The pill points at the next START, today or on a later day —
                  so a free day still says when the next class is. */}
              {next !== null && <CountdownPill parts={countdownParts(next.startsAt, now)} startTime={next.entry.startTime} />}

              {today.length === 0 ? (
                <EmptyState body={t('dashboard.today.none')} />
              ) : (
                <ul className={styles.miniList}>
                  {today.map((entry) => (
                    <MiniClass
                      key={entry.id}
                      entry={entry}
                      swatch={subjectSwatch(colors, entry.subject.nameFr)}
                    />
                  ))}
                </ul>
              )}
            </div>
          );
        }}
      </CardStates>
    </Card>
  );
}

/**
 * One clock for the whole card, re-read every minute and aligned to the minute.
 *
 * Shared by the heading's date, the day's list and the pill, so the three never
 * disagree — a dashboard left open past midnight moves its date, its list and
 * its countdown together. The number always comes from Date.now(), so a
 * throttled background tab that fires late still lands on the right minute
 * (§9's "no drift"); the timer is only a prompt to look at the clock again.
 */
function useMinuteClock(): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    let interval: number | undefined;
    const align = window.setTimeout(() => {
      setNow(Date.now());
      interval = window.setInterval(() => setNow(Date.now()), 60000);
    }, msToNextMinute(Date.now()));

    return () => {
      window.clearTimeout(align);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, []);

  return now;
}

/**
 * "Aujourd'hui · Mardi 10 juin". The weekday and month come from Intl in the
 * active language — every weekday, Friday and Saturday included, which the
 * schedule's own day names do not cover. The day of the month is a figure, so
 * it goes in `.num`; the words keep the language's font.
 */
function TodayTitle({ now }: { now: number }) {
  const { t, lang } = useI18n();
  const date = new Date(now);

  return (
    <Interpolated
      template={t('dashboard.today.title')}
      values={{ weekday: weekdayName(date, lang), day: date.getDate(), month: monthName(date, lang) }}
      renderValue={(name, value) => (name === 'day' ? <span className="num">{value}</span> : value)}
    />
  );
}

/** French writes weekdays in lower case mid-sentence; a heading starts with one. */
function weekdayName(date: Date, lang: Lang): string {
  const name = new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(date);
  return lang === 'fr' ? name.charAt(0).toLocaleUpperCase('fr') + name.slice(1) : name;
}

function monthName(date: Date, lang: Lang): string {
  return new Intl.DateTimeFormat(lang, { month: 'long' }).format(date);
}

/**
 * app.css:177 .countdown. §9: the text swaps every minute with NO transition —
 * there is deliberately none on .countdown.
 */
function CountdownPill({ parts, startTime }: { parts: CountdownParts; startTime: string }) {
  const { t, plural } = useI18n();

  let text: ReactNode;
  switch (parts.kind) {
    case 'now':
      text = t('dashboard.today.pill.now');
      break;
    case 'minutes':
      text = <Interpolated template={t('dashboard.today.pill.minutes')} values={{ count: parts.count }} />;
      break;
    case 'today':
      // Later today: the start TIME, not a duration — "à 13:00" is what a
      // student plans around.
      text = <Interpolated template={t('dashboard.today.pill.today_at')} values={{ time: startTime }} />;
      break;
    case 'days':
      // Calendar days, so 1 is "demain" whatever the hour (next-class.ts).
      text = <Interpolated template={plural('dashboard.today.pill.days', parts.count)} values={{ count: parts.count }} />;
      break;
  }

  return (
    <p className={styles.countdown}>
      <ClockIcon className={styles.countdownIcon} />
      <span>{text}</span>
    </p>
  );
}

/** One row (app.css:170-176): subject rail, subject over room, times stacked. */
function MiniClass({ entry, swatch }: { entry: ScheduleEntry; swatch: SubjectSwatch }) {
  const { t, lang } = useI18n();
  const type = courseType(entry.type);
  const subject = lang === 'ar' ? entry.subject.nameAr : entry.subject.nameFr;

  return (
    <li className={styles.miniClass}>
      {/*
        The SUBJECT's colour, from the mobile app's palette (lib/subject-colors),
        the same as the schedule screen's block and day row. Decorative: the
        subject is named beside it, never colour alone.
      */}
      <span
        className={`${styles.miniRail} subject-color`}
        style={{ ...subjectStyle(swatch), background: 'var(--subj)' }}
        aria-hidden="true"
      />
      <div className={styles.miniBody}>
        {/* title: the full name on hover when the line is cut with "…". */}
        <p className={styles.miniSubject} title={subject}>
          {subject}
          <span className={styles.srOnly}>, {t(typeLabelKey(type))}</span>
        </p>
        <p className={styles.miniRoom}>
          <bdi>{entry.room}</bdi>
        </p>
      </div>
      {/* Mono, start over end. Each time is LTR on its own line, so Arabic
          cannot reorder them. */}
      <p className={`${styles.miniTime} mono`}>
        <bdi dir="ltr">{entry.startTime}</bdi>
        <bdi dir="ltr">{entry.endTime}</bdi>
      </p>
    </li>
  );
}
