'use client';

import type { TranslationKey } from '@/lib/i18n-types';
import { useI18n } from '@/lib/i18n';
import { AbsenceDate } from './AbsenceDate';
import { justificationState, type FlatAbsence, type JustificationState } from './model';
import styles from './attendance.module.css';

/**
 * The absences, newest first, as the prototype's .absence-row: the date tile,
 * the subject (13.5 / 700) and the status pill.
 *
 * Every row opens the justification panel — including the settled ones. A
 * student whose justification was approved still wants to see the document they
 * sent, and one whose absence was excused at source wants to know why it is not
 * counting against them.
 *
 * The row's accessible name is the subject, the full date and the status, so a
 * screen reader hears the year and the weekday-free date the tile abbreviates.
 *
 * No entrance animation on the rows: §9's filter crossfades the whole list,
 * and rows animating themselves would fight it.
 */
export function AbsenceList({
  absences,
  onSelect,
}: {
  absences: FlatAbsence[];
  onSelect: (absence: FlatAbsence) => void;
}) {
  const { t } = useI18n();

  return (
    <ul className={styles.absences}>
      {absences.map(({ record, subjectCode }) => {
        const state = justificationState(record);

        return (
          <li key={record.id}>
            <button
              type="button"
              className={styles.absence}
              onClick={() => onSelect({ record, subjectCode })}
            >
              <DateTile iso={record.date} />

              <span className={styles.absenceSubject}>
                <AbsenceSubjectName record={record} />
                {/* The full date for assistive tech; the tile is aria-hidden. */}
                <span className={styles.srOnly}>
                  {' · '}
                  <AbsenceDate iso={record.date} />
                </span>
              </span>

              {/* The state as a word as well as a colour (§10). */}
              <span className={`${styles.pillStatus} ${PILL_CLASS[state]}`}>
                {t(PILL_KEY[state])}
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * The prototype's .date-tile: the day, two digits on the mono face, over the
 * short month in capitals. The month is a word, so it keeps the language's
 * face — "NOV." in French, "نوفمبر" in Arabic.
 */
function DateTile({ iso }: { iso: string }) {
  const { lang } = useI18n();
  const date = new Date(iso);
  const day = String(date.getDate()).padStart(2, '0');
  const month = new Intl.DateTimeFormat(lang, { month: 'short' }).format(date);

  return (
    <span className={styles.dateTile} aria-hidden="true">
      <b className="mono">{day}</b>
      <small>{month}</small>
    </span>
  );
}

/** The subject name in the active language. The API sends both faces of it on
 *  every absence, so nothing has to be looked up. */
function AbsenceSubjectName({ record }: { record: FlatAbsence['record'] }) {
  const { lang } = useI18n();
  return <>{lang === 'ar' ? record.subjectNameAr : record.subjectName}</>;
}

/*
 * The prototype's .pill-status colours: unjustified and rejected on the danger
 * tint, pending on the warning tint, approved on the jade tint. `expired` is
 * not in the prototype: it is an unjustified absence nothing can be done about
 * any more, so it takes the neutral tint rather than a call to act.
 */
const PILL_KEY: Record<JustificationState, TranslationKey> = {
  none: 'attendance.status.none',
  expired: 'attendance.status.expired',
  pending: 'attendance.status.pending',
  approved: 'attendance.status.approved',
  rejected: 'attendance.status.rejected',
};

const PILL_CLASS: Record<JustificationState, string> = {
  none: styles.pillDanger,
  expired: styles.pillNeutral,
  pending: styles.pillWarning,
  approved: styles.pillApproved,
  rejected: styles.pillDanger,
};
