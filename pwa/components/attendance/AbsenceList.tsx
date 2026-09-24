'use client';

import type { TranslationKey } from '@/lib/i18n-types';
import { useI18n } from '@/lib/i18n';
import { AbsenceDate } from './AbsenceDate';
import { CheckIcon, ChevronIcon, PendingIcon, RejectedIcon, UnjustifiedIcon } from './icons';
import { justificationState, type FlatAbsence, type JustificationState } from './model';
import styles from './attendance.module.css';

/**
 * The absences, newest first, one row each.
 *
 * Every row opens the justification panel — including the settled ones. A
 * student whose justification was approved still wants to see the document they
 * sent, and one whose absence was excused at source wants to know why it is not
 * counting against them; a list where only some rows are clickable would hide
 * both.
 *
 * No entrance animation on the rows, deliberately. §9: filtering "crossfades the
 * list rather than re-animating each row in — this is a filter, not new data",
 * and rows that animated themselves on mount would fight the crossfade the
 * parent is running around them.
 */
export function AbsenceList({
  absences,
  onSelect,
}: {
  absences: FlatAbsence[];
  onSelect: (absence: FlatAbsence) => void;
}) {
  const { t, dir } = useI18n();

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
              /*
                The chevron points toward the inline-end and a transform is never
                mirrored by `dir`, so the flip arrives as a custom property read
                from the active direction — the mechanism §6 prescribes, and the
                reason the stylesheet still has no [dir="rtl"] selector.
              */
              style={{ '--chevron-flip': dir === 'rtl' ? -1 : 1 } as React.CSSProperties}
            >
              <StatusDot state={state} />

              <span className={styles.absenceText}>
                <span className={styles.absenceSubject}>
                  <AbsenceSubjectName record={record} />
                  <span className={`${styles.absenceCode} num`}>{subjectCode}</span>
                </span>

                {/*
                  NO OUTER `.num`. AbsenceDate wraps the day and the year in it
                  itself and deliberately leaves the month name outside, because
                  Plus Jakarta Sans has no Arabic glyphs — a `.num` on the
                  wrapper would put "سبتمبر" on a face that cannot draw it.
                */}
                <span className={styles.absenceDate}>
                  <AbsenceDate iso={record.date} />
                </span>
              </span>

              {/*
                The state as a word as well as a colour (§10). This is the row's
                whole point — "is this one dealt with?" — so it is never left to
                the dot alone.
              */}
              <span className={`${styles.chip} ${CHIP_CLASS[state]}`}>{t(CHIP_KEY[state])}</span>

              <ChevronIcon className={styles.absenceChevron} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** The subject name in the active language. The API sends both faces of it on
 *  every absence, so nothing has to be looked up. */
function AbsenceSubjectName({ record }: { record: FlatAbsence['record'] }) {
  const { lang } = useI18n();
  return <>{lang === 'ar' ? record.subjectNameAr : record.subjectName}</>;
}

/**
 * The leading glyph. Decorative — the chip beside it names the state in words,
 * so announcing it again here would read the row twice.
 */
function StatusDot({ state }: { state: JustificationState }) {
  const className = `${styles.absenceIcon} ${ICON_CLASS[state]}`;

  switch (state) {
    case 'approved':
      return <CheckIcon className={className} />;
    case 'pending':
      return <PendingIcon className={className} />;
    case 'rejected':
      return <RejectedIcon className={className} />;
    default:
      return <UnjustifiedIcon className={className} />;
  }
}

/*
 * `expired` shares `none`'s styling: it is the same unjustified absence, and
 * only the word changes — "À justifier" on a row the "À justifier" filter
 * leaves out would contradict it.
 */
const CHIP_KEY: Record<JustificationState, TranslationKey> = {
  none: 'attendance.status.none',
  expired: 'attendance.status.expired',
  pending: 'attendance.status.pending',
  approved: 'attendance.status.approved',
  rejected: 'attendance.status.rejected',
};

const CHIP_CLASS: Record<JustificationState, string> = {
  none: styles.chipNone,
  expired: styles.chipNone,
  pending: styles.chipPending,
  approved: styles.chipApproved,
  rejected: styles.chipRejected,
};

const ICON_CLASS: Record<JustificationState, string> = {
  none: styles.iconNone,
  expired: styles.iconNone,
  pending: styles.iconPending,
  approved: styles.iconApproved,
  rejected: styles.iconRejected,
};
