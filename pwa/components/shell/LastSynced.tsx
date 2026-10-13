'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import { fmtLtr, fmtPhrase } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';

const MINUTE_MS = 60_000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

/**
 * "Dernière synchronisation : il y a 2 h" — how old the data on screen is.
 *
 * RELATIVE ONLY WITHIN 24 HOURS. Past that it is an absolute date and time,
 * "12 sept. à 14:30". "Il y a 3 semaines" is easy to skim past as "recently";
 * a date is not, and the whole point of the label is that nobody mistakes last
 * month's grades for today's. The instant is stored in UTC and shown in the
 * device's local time.
 *
 * Re-rendered once a minute while mounted, so "il y a 4 min" does not sit on
 * screen for an hour.
 */
export function LastSynced({ savedAt }: { savedAt: number }) {
  const { t } = useI18n();
  const now = useMinuteClock();

  return <>{fmtPhrase(t('offline.last_sync'), { when: <SyncWhen savedAt={savedAt} now={now} /> })}</>;
}

function SyncWhen({ savedAt, now }: { savedAt: number; now: number }): ReactNode {
  const { t, lang } = useI18n();
  // A copy from "the future" is clock skew between two of this device's own
  // readings; it is as fresh as anything can be.
  const age = Math.max(0, now - savedAt);

  if (age < MINUTE_MS) return t('offline.sync.just_now');
  if (age < HOUR_MS) {
    return (
      <Interpolated
        template={t('offline.sync.minutes')}
        values={{ count: Math.floor(age / MINUTE_MS) }}
      />
    );
  }
  if (age < DAY_MS) {
    return (
      <Interpolated template={t('offline.sync.hours')} values={{ count: Math.floor(age / HOUR_MS) }} />
    );
  }

  /*
   * Same two passes as NewsDate: the month name in the active language is
   * substituted by t() and stays on the body face; Interpolated then puts only
   * the day, the year and the clock time in `.num`. The clock time is also
   * isolated LTR — "14:30" must not be reordered by a surrounding RTL sentence.
   */
  const date = new Date(savedAt);
  const month = new Intl.DateTimeFormat(lang, { month: 'short' }).format(date);
  const time = fmtLtr(
    `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
  );
  // The year only when it is not this one: "12 sept." is unambiguous until
  // January, and after that it is not.
  const sameYear = date.getFullYear() === new Date(now).getFullYear();

  return sameYear ? (
    <Interpolated template={t('offline.sync.date', { month })} values={{ day: date.getDate(), time }} />
  ) : (
    <Interpolated
      template={t('offline.sync.date_year', { month })}
      values={{ day: date.getDate(), year: date.getFullYear(), time }}
    />
  );
}

function useMinuteClock(): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), MINUTE_MS);
    return () => window.clearInterval(timer);
  }, []);
  return now;
}
