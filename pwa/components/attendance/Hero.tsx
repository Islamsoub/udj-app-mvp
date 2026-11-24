'use client';

import type { ReactNode } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import type { AttendanceOverall, AttendanceSubject } from '@/lib/api-types';
import { percentText } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { levelCounts, overallLevel, type SubjectLevel } from './model';
import { PresenceRing } from './PresenceRing';
import styles from './attendance.module.css';

const LEVELS: SubjectLevel[] = ['ok', 'near', 'below'];

const DOT_CLASS: Record<SubjectLevel, string> = {
  ok: styles.heroDotOk,
  near: styles.heroDotNear,
  below: styles.heroDotBelow,
};

/** Plain words, not `.num`: the plural phrases carry their own figures. */
const asWords = (_name: string, value: ReactNode) => value;

/**
 * The prototype's #pres-hero at layout b: the ring with the percentage inside,
 * then "Taux de présence", the status pill and "N absences sur M séances", and
 * at the inline end the three subject counts (Validées, Limite, À risque).
 *
 * THE STATUS IS THE SERVER'S. The pill reads `overall.band` through
 * overallLevel, and the counts read each subject's `band` through levelCounts —
 * the same rule the subject rows below are coloured by, so the hero and the
 * card never disagree. The percentage is never compared with the threshold
 * here; the threshold itself is stated in words in the "Par matière" card.
 *
 * "Absences" is every missed session, unjustified and justified alike, which is
 * exactly what the "Mes absences" list holds (the endpoint puts each ABSENT and
 * each JUSTIFIED record there and nothing else).
 *
 * The caller does not mount this without a percentage: a gauge pinned at 0
 * would claim "you attended nothing" for what is really "nothing recorded".
 */
export function Hero({
  overall,
  subjects,
  percentage,
}: {
  overall: AttendanceOverall;
  subjects: AttendanceSubject[];
  percentage: number;
}) {
  const { t, plural } = useI18n();

  const status = overallLevel(overall);
  const counts = levelCounts(subjects);
  const absences = overall.absent + overall.justified;

  return (
    <section className={styles.hero} aria-label={t('attendance.hero.label')}>
      {/* The prototype's .depth-circle: decoration, kept clear of the text (see
          .heroDepth and .heroBreakdown). */}
      <div className={styles.heroDepth} aria-hidden="true" />

      <div className={styles.heroWrap}>
        <PresenceRing
          percentage={percentage}
          label={t('attendance.hero.ring_label', { value: percentText(percentage) })}
        />

        <div className={styles.heroText}>
          <p className={styles.heroLabel}>{t('attendance.hero.label')}</p>

          {/* The status in words; the dot is the prototype's cue on top of
              them, never instead of them (§10). */}
          <p className={styles.heroPill}>
            <span className={`${styles.heroDot} ${DOT_CLASS[status]}`} aria-hidden="true" />
            <span>{t(`attendance.hero.status.${status}` as const)}</span>
          </p>

          <p className={styles.heroSummary}>
            <Interpolated
              template={t('attendance.hero.summary')}
              renderValue={asWords}
              values={{
                absences: (
                  <Interpolated
                    template={plural('attendance.hero.summary_absences', absences)}
                    values={{ n: absences }}
                  />
                ),
                sessions: (
                  <Interpolated
                    template={plural('attendance.hero.summary_sessions', overall.total)}
                    values={{ n: overall.total }}
                  />
                ),
              }}
            />
          </p>
        </div>

        <ul className={styles.heroBreakdown} aria-label={t('attendance.hero.levels.label')}>
          {LEVELS.map((level) => (
            <li key={level} className={styles.heroLevel}>
              <span className={`${styles.heroLevelCount} mono`}>{counts[level]}</span>
              <span className={styles.heroLevelLabel}>{t(`attendance.hero.levels.${level}` as const)}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
