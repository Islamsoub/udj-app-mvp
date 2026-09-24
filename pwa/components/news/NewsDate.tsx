'use client';

import { Interpolated } from '@/components/dashboard/Interpolated';
import { useI18n } from '@/lib/i18n';

/**
 * A publication date, absolute: "12 mai 2026", "12 مايو 2026".
 *
 * ABSOLUTE, NOT RELATIVE. The articles are months old, and "il y a 4 mois"
 * both reads oddly and tells the student less than the date does — a calendar
 * notice is dated, and the date is what they will quote to the secrétariat.
 *
 * Same two-pass split as the attendance dates: the month name is substituted by
 * t() in the active language and left on the body face, then Interpolated wraps
 * only the day and the year in `.num`, because Plus Jakarta Sans has no Arabic
 * glyphs to draw "مايو" with. The stored instant is UTC; it is shown in the
 * device's local time, per the project's time-handling rule.
 */
export function NewsDate({ iso }: { iso: string }) {
  const { t, lang } = useI18n();
  const date = new Date(iso);

  const month = new Intl.DateTimeFormat(lang, { month: 'long' }).format(date);

  return (
    <Interpolated
      template={t('news.date', { month })}
      values={{ day: date.getDate(), year: date.getFullYear() }}
    />
  );
}
