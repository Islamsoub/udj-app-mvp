'use client';

import { Interpolated } from '@/components/dashboard/Interpolated';
import type { AttendanceOverall } from '@/lib/api-types';
import { fmtPercent, percentText } from '@/lib/bidi';
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
        label={t('attendance.hero.ring_label', { value: percentText(percentage) })}
      />

      <div className={styles.heroText}>
        <p className={styles.heroLabel}>{t('attendance.hero.label')}</p>

        <p className={styles.heroValue}>
          {/* The figure stays on the Latin face in Arabic, like every other
              number in the product — and in one LTR isolate, so the sign
              follows the number there instead of leading it. Number and sign
              are two sizes, hence two spans rather than fmtPercent; the form
              is the same "92%". */}
          <bdi dir="ltr" className={styles.heroFigure}>
            <span className={`${styles.heroNumber} num`}>{Math.round(percentage)}</span>
            <span className={`${styles.heroUnit} num`}>%</span>
          </bdi>
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
            values={{ threshold: fmtPercent(threshold) }}
          />
        </p>

        {/*
          The counts behind the percentage.

          "Absences" IS EVERY MISSED SESSION — unjustified and justified alike —
          because that is what the list further down holds: the endpoint puts
          each ABSENT and each JUSTIFIED record in `absences`, and nothing else.
          `overall.absent` on its own is only the unjustified ones, and printing
          it here put "6" above a list of nine, with "of which justified: 3"
          beside it claiming three of those six.

          Justified absences are then broken out because they do NOT reduce the
          percentage — the server credits a justified session at its full length
          (utils/attendance.ts) — so a student wondering why the figure did not
          move has the answer on the same line. What still needs their action is
          the list's own filter, not this line.
        */}
        <p className={styles.heroCounts}>
          <span className={styles.heroCount}>
            <Interpolated
              template={t('attendance.hero.absences')}
              values={{ count: overall.absent + overall.justified }}
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
            Worded as its own count, not "of which": a partial session is not in
            the absences total above and is not in the list.
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
