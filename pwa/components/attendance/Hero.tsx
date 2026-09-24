'use client';

import { Interpolated } from '@/components/dashboard/Interpolated';
import type { AttendanceOverall } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { WarningIcon } from './icons';
import { PresenceRing } from './PresenceRing';
import styles from './attendance.module.css';

/**
 * The hero stat: the semester's presence percentage, the gauge, and what the
 * percentage is measured against.
 *
 * THE THRESHOLD IS STATED HERE, not only implied by a colour on the subject
 * rows. A student who is at 92% needs to know where the line is before the number
 * means anything, and §10 forbids colour as the only signal anyway — so the
 * requirement is a sentence, and being under it adds an icon and a word on top
 * of the tint rather than instead of it.
 *
 * The caller does not mount this without a percentage: §5's fill "animates from
 * 0% to its target value", and a gauge pinned at zero reads as "you attended
 * nothing" — a different and much worse claim than "nothing has been recorded".
 */
export function Hero({
  overall,
  percentage,
  threshold,
}: {
  overall: AttendanceOverall;
  percentage: number;
  /** From the response; see model.ts for why there is no local default. */
  threshold: number;
}) {
  const { t } = useI18n();

  const below = percentage < threshold;

  return (
    <section className={styles.hero}>
      <PresenceRing
        percentage={percentage}
        label={t('attendance.hero.ring_label', { value: Math.round(percentage) })}
      />

      <div className={styles.heroText}>
        <p className={styles.heroLabel}>{t('attendance.hero.label')}</p>

        <p className={styles.heroValue}>
          {/* The figure stays on the Latin face in Arabic, like every other
              number in the product. */}
          <span className={`${styles.heroNumber} num`}>{Math.round(percentage)}</span>
          <span className={`${styles.heroUnit} num`}>%</span>
        </p>

        <p className={styles.heroSessions}>
          <Interpolated
            template={t('attendance.hero.sessions')}
            values={{ present: overall.present, total: overall.total }}
          />
        </p>

        {/*
          The requirement, always shown — and when it is not met, said in words
          with an icon beside them (§10) rather than left to the tint alone.
        */}
        <p className={`${styles.heroThreshold} ${below ? styles.heroThresholdBelow : ''}`}>
          {below && <WarningIcon className={styles.heroThresholdIcon} />}
          <Interpolated
            template={t(below ? 'attendance.hero.below' : 'attendance.hero.threshold')}
            values={{ threshold }}
          />
        </p>

        {/*
          The three counts behind the percentage. Justified absences are listed
          separately because they do NOT reduce it — the server credits a
          justified session at its full length (utils/attendance.ts), so a
          student looking at "3 justified" and wondering why the figure did not
          move has the answer on the same line.
        */}
        <p className={styles.heroCounts}>
          <span className={styles.heroCount}>
            <Interpolated
              template={t('attendance.hero.absences')}
              values={{ count: overall.absent }}
            />
          </span>
          <span className={styles.heroCount}>
            <Interpolated
              template={t('attendance.hero.justified')}
              values={{ count: overall.justified }}
            />
          </span>
          {/*
            PARTIAL sessions exist in the schema and are counted by the same
            endpoint, but no record in the database uses the status yet. Shown
            only when there is one, so the line does not carry a permanent zero.
          */}
          {overall.partial > 0 && (
            <span className={styles.heroCount}>
              <Interpolated
                template={t('attendance.hero.partial')}
                values={{ count: overall.partial }}
              />
            </span>
          )}
        </p>
      </div>
    </section>
  );
}
