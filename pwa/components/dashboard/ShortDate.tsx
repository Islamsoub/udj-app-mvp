'use client';

import { useI18n } from '@/lib/i18n';
import { Interpolated } from './Interpolated';

/**
 * "10 juin" / "10 يونيو" — Design's short date (dashboard.html:127-128), for the
 * news dates and older notifications. The year is added only when it is not the
 * current one: "10 juin" on a card read in November means this June, and a
 * three-year-old notice must not pass for this year's.
 *
 * The month is a word from Intl in the page's language and keeps that
 * language's font; the day and year are figures in `.num`, via Interpolated.
 */
export function ShortDate({ date, now }: { date: Date; now: number }) {
  const { t, lang } = useI18n();
  const month = new Intl.DateTimeFormat(lang, { month: 'long' }).format(date);
  const sameYear = date.getFullYear() === new Date(now).getFullYear();

  return sameYear ? (
    <Interpolated template={t('dashboard.date.day_month', { month })} values={{ day: date.getDate() }} />
  ) : (
    <Interpolated
      template={t('dashboard.date.day_month_year', { month })}
      values={{ day: date.getDate(), year: date.getFullYear() }}
    />
  );
}
