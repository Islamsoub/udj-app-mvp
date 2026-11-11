'use client';

import { Interpolated } from '@/components/dashboard/Interpolated';
import type { AttendanceSubject } from '@/lib/api-types';
import { fmtPercent } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import { WarningIcon } from './icons';
import { sortSubjects } from './model';
import styles from './attendance.module.css';

type RowTone = 'ok' | 'near' | 'below';

type RowFlag =
  | { kind: 'near'; n: number }
  | { kind: 'text'; key: TranslationKey };

/**
 * One subject's row state, per ROUND2-CLOSEOUT §4: the tone (border, bar fill,
 * figure) and the flag beside the session count.
 *
 * Term over (`absencesLeft === null`) is checked first, because §4's term-over
 * rows apply whatever the band. A term-over `below` keeps the below treatment
 * with the term-over sentence; a term-over `near` gets no flag and no near tone,
 * since "n absences left" means nothing once the term has ended.
 */
function subjectRow(entry: AttendanceSubject): { tone: RowTone; flag: RowFlag | null } {
  if (entry.absencesLeft === null) {
    return entry.band === 'below'
      ? { tone: 'below', flag: { kind: 'text', key: 'attendance.subjects.ended_below' } }
      : { tone: 'ok', flag: null };
  }
  switch (entry.band) {
    case 'below':
      return { tone: 'below', flag: { kind: 'text', key: 'attendance.subjects.below' } };
    case 'near':
      return { tone: 'near', flag: { kind: 'near', n: entry.absencesLeft } };
    case 'ok':
      return { tone: 'ok', flag: null };
  }
}

const ROW_CLASS: Record<RowTone, string> = {
  ok: '',
  near: styles.subjectNear,
  below: styles.subjectBelow,
};

/**
 * Attendance per subject, worst first.
 *
 * A meter rather than a table. The question this section answers is "which
 * subject is dragging me down", which is a comparison between bars rather than a
 * reading of eight numbers, and the threshold is drawn as a line ACROSS every
 * bar at the same place so "below the line" is literally visible.
 *
 * EACH ROW'S STATE IS THE SERVER'S `band` AND `absencesLeft` for that subject
 * (ROUND2-CLOSEOUT §4, "Subject rows" and "Row treatment"); the percentage is
 * never compared against the threshold here. The threshold is still displayed:
 * in the section note and as the tick on every bar.
 *
 * §10: "Status colors ... are never the only signal — always paired with a label
 * or icon." A `near` or `below` row therefore carries three independent markers:
 * the border, bar and figure colour, the triangle glyph, and a sentence —
 * "Encore 2 absences avant la limite", "Limite d'absences dépassée", or, once
 * the term is over, "Semestre terminé sous le seuil". Any one of them alone
 * carries it. The rows carry no background tint: §4's treatment table has no
 * background column (Flag 8, Design to confirm).
 *
 * NOT a native <meter>. Its bar is drawn by the UA with no reliable way to place
 * the threshold marker inside it, and its `low`/`optimum` shading is a colour
 * signal the design system does not define. A labelled progressbar gives the
 * same semantics with a bar the stylesheet owns.
 */
export function SubjectBreakdown({
  subjects,
  threshold,
}: {
  subjects: AttendanceSubject[];
  /** From the response; see model.ts for why there is no local default.
   *  Displayed only — each row's state comes from its own `band`. */
  threshold: number;
}) {
  const { t, plural, lang } = useI18n();

  const ordered = sortSubjects(subjects, lang);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('attendance.subjects.title')}</h2>

      {/* The legend for the tick on every bar below: the mark itself, then what
          it stands for. The value is the server's, never a constant. */}
      <p className={styles.sectionNote}>
        <span className={styles.thresholdKey} aria-hidden="true" />
        <Interpolated
          template={t('attendance.subjects.note')}
          values={{ threshold: fmtPercent(threshold) }}
        />
      </p>

      <ul className={styles.subjects}>
        {ordered.map((entry) => {
          const name = lang === 'ar' ? entry.subject.nameAr : entry.subject.nameFr;
          const value = Math.round(entry.percentage);
          const row = subjectRow(entry);

          return (
            <li key={entry.subject.id} className={`${styles.subject} ${ROW_CLASS[row.tone]}`}>
              <div className={styles.subjectHead}>
                <p className={styles.subjectName}>
                  {name}
                  {/* The code is an identifier, so it stays Latin in Arabic. */}
                  <span className={`${styles.subjectCode} num`}>{entry.subject.code}</span>
                </p>

                <p className={`${styles.subjectValue} num`}>
                  {fmtPercent(value)}
                </p>
              </div>

              {/*
                The bar carries the reading for sighted users; the role and its
                aria-* attributes carry the same number to assistive tech, so the
                percentage is never announced twice from the text beside it.
              */}
              <div
                className={styles.bar}
                role="progressbar"
                aria-valuenow={value}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-label={t('attendance.subjects.bar_label', { subject: name })}
                style={
                  {
                    '--bar-value': `${Math.max(0, Math.min(100, value))}%`,
                    '--bar-threshold': `${threshold}%`,
                  } as React.CSSProperties
                }
              >
                <span className={styles.barFill} />
                {/* The threshold, drawn at the same inline offset on every bar.
                    Decorative: the sentence above the list states it in words. */}
                <span className={styles.barThreshold} aria-hidden="true" />
              </div>

              <p className={styles.subjectMeta}>
                <span>
                  <Interpolated
                    template={t('attendance.subjects.sessions')}
                    values={{ present: entry.present, total: entry.total }}
                  />
                </span>

                {row.flag !== null && (
                  <span
                    className={`${styles.subjectFlag} ${row.tone === 'below' ? styles.subjectFlagBelow : ''}`}
                  >
                    <WarningIcon className={styles.subjectFlagIcon} />
                    {row.flag.kind === 'near' ? (
                      // {{n}} goes through .num, Western digits in both
                      // languages; the zero/one/two forms carry no placeholder.
                      <Interpolated
                        template={plural('attendance.subjects.near', row.flag.n)}
                        values={{ n: row.flag.n }}
                      />
                    ) : (
                      t(row.flag.key)
                    )}
                  </span>
                )}
              </p>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
