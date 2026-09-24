'use client';

import { Interpolated } from '@/components/dashboard/Interpolated';
import type { AttendanceSubject } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { WarningIcon } from './icons';
import { sortSubjects } from './model';
import styles from './attendance.module.css';

/**
 * Attendance per subject, worst first.
 *
 * A meter rather than a table. The question this section answers is "which
 * subject is dragging me down", which is a comparison between bars rather than a
 * reading of eight numbers, and the threshold is drawn as a line ACROSS every
 * bar at the same place so "below the line" is literally visible.
 *
 * §10: "Status colors ... are never the only signal — always paired with a label
 * or icon." A subject under the threshold therefore gets three independent
 * markers: the warning tint, the triangle glyph, and the words "Sous le seuil".
 * Any one of them alone carries it.
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
  /** From the response; see model.ts for why there is no local default. */
  threshold: number;
}) {
  const { t, lang } = useI18n();

  const ordered = sortSubjects(subjects);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('attendance.subjects.title')}</h2>

      <p className={styles.sectionNote}>
        <Interpolated
          template={t('attendance.subjects.note')}
          values={{ threshold }}
        />
      </p>

      <ul className={styles.subjects}>
        {ordered.map((entry) => {
          const name = lang === 'ar' ? entry.subject.nameAr : entry.subject.nameFr;
          const value = Math.round(entry.percentage);
          const below = entry.percentage < threshold;

          return (
            <li
              key={entry.subject.id}
              className={`${styles.subject} ${below ? styles.subjectBelow : ''}`}
            >
              <div className={styles.subjectHead}>
                <p className={styles.subjectName}>
                  {name}
                  {/* The code is an identifier, so it stays Latin in Arabic. */}
                  <span className={`${styles.subjectCode} num`}>{entry.subject.code}</span>
                </p>

                <p className={`${styles.subjectValue} ${below ? styles.subjectValueBelow : ''} num`}>
                  {value}%
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

                {below && (
                  <span className={styles.subjectFlag}>
                    <WarningIcon className={styles.subjectFlagIcon} />
                    {t('attendance.subjects.below')}
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
