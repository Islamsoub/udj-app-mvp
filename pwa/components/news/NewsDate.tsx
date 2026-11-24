'use client';

import { Interpolated } from '@/components/dashboard/Interpolated';
import { useI18n } from '@/lib/i18n';

/**
 * A publication date, short: "10 juin", "10 يونيو" — with the year only when it
 * is not the current one ("12 mai 2025"), as the prototype's card and reader
 * write it. Used only by the news screen (the dashboard has its own).
 *
 * ABSOLUTE, NOT RELATIVE. A calendar notice is dated, and the date is what the
 * student will quote to the secrétariat.
 *
 * Two passes, as the attendance dates: the month name is substituted by t() in
 * the active language and left on the body face, then Interpolated wraps only
 * the day and the year in `.num`, because Plus Jakarta Sans has no Arabic glyphs
 * to draw "مايو" with. The stored instant is UTC; it is shown in the device's
 * local time, and "the current year" is the device's too.
 */
export function NewsDate({ iso }: { iso: string }) {
  const { t, lang } = useI18n();
  const date = new Date(iso);

  const month = new Intl.DateTimeFormat(lang, { month: 'long' }).format(date);
  const thisYear = date.getFullYear() === new Date().getFullYear();

  return thisYear ? (
    <Interpolated template={t('news.date', { month })} values={{ day: date.getDate() }} />
  ) : (
    <Interpolated
      template={t('news.date_year', { month })}
      values={{ day: date.getDate(), year: date.getFullYear() }}
    />
  );
}
