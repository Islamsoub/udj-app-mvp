'use client';

import { Interpolated } from '@/components/dashboard/Interpolated';
import { useI18n } from '@/lib/i18n';

/**
 * One absence's session date, with its figures on the Latin face.
 *
 * TWO PASSES, and the split is the same one the schedule's navigation label
 * makes. Interpolated puts every value it substitutes into a `.num` span, which
 * is right for the day and the year and wrong for "سبتمبر" — Plus Jakarta Sans
 * has no Arabic glyphs, so an Arabic month name pushed through it falls back to
 * whatever the stack resolves next.
 *
 * So the MONTH is substituted first, by t() itself, which leaves the
 * placeholders it was not given intact; Interpolated then sees only {{day}} and
 * {{year}} and wraps exactly the two things that should be Latin.
 *
 * Direction needs no handling: the parts are emitted in template order and the
 * browser's bidi algorithm places them.
 */
export function AbsenceDate({ iso }: { iso: string }) {
  const { t, lang } = useI18n();
  const date = new Date(iso);

  const month = new Intl.DateTimeFormat(lang, { month: 'long' }).format(date);

  return (
    <Interpolated
      template={t('attendance.absence.date', { month })}
      values={{ day: date.getDate(), year: date.getFullYear() }}
    />
  );
}
