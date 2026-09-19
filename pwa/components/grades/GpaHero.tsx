'use client';

import { useState } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import type { SemesterSummary } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { useExitBackstop } from '@/lib/useExitBackstop';
import { GpaRing } from './GpaRing';
import { mentionKey } from './model';
import styles from './grades.module.css';

/**
 * The hero stat: one semester's average, mention and credits.
 *
 * §9: "Semester tab switch fades the GPA hero's number via a quick crossfade
 * (old value fades out 100ms, new fades in over the next 150ms -- slight overlap
 * avoids a 'blank' flash) rather than sliding, since the two semesters aren't
 * spatially related."
 *
 * Implemented by holding the outgoing semester for exactly one crossfade and
 * stacking it in the same grid cell as the incoming one, so the two overlap
 * without the hero changing height and without anything below it moving.
 *
 * THE WHOLE FIGURE CROSSFADES, not the number alone. Number, mention, credits
 * and gauge are four readings of one semester; fading the number while the
 * mention beside it cut would misattribute the old mention to the new average
 * for a fifth of a second. Keeping them in one layer also handles the case the
 * data makes common — switching between a semester with results and one without
 * — where there is no number to crossfade at all, only a sentence.
 */
export function GpaHero({ semester }: { semester: SemesterSummary }) {
  /*
   * Derived-from-props state rather than an effect. An effect would run after
   * the commit, so the frame in which the new semester first paints would have
   * no outgoing layer at all — exactly the blank flash the overlap exists to
   * prevent. Setting state during render re-renders before painting, so both
   * layers land in the same commit.
   */
  const [shown, setShown] = useState(semester);
  const [leaving, setLeaving] = useState<SemesterSummary | null>(null);

  if (shown.id !== semester.id) {
    setLeaving(shown);
    setShown(semester);
  }

  /*
   * The ENTERING layer clears the outgoing one, not the leaving layer: the exit
   * finishes at 100ms and the entrance at ~230ms, so clearing on the exit would
   * unmount the pair — and cut the entrance animation — while it was still
   * running. The backstop covers a tab that is hidden when the switch happens,
   * where no animationend ever arrives (see lib/useExitBackstop).
   */
  useExitBackstop(leaving?.id, () => setLeaving(null));

  return (
    <section className={styles.hero} aria-live="polite">
      {leaving !== null && (
        <div className={`${styles.heroLayer} ${styles.heroLeaving}`} aria-hidden="true">
          <HeroFigures semester={leaving} />
        </div>
      )}

      <div
        className={`${styles.heroLayer} ${leaving !== null ? styles.heroEntering : ''}`}
        onAnimationEnd={() => setLeaving(null)}
      >
        <HeroFigures semester={shown} />
      </div>
    </section>
  );
}

/** One semester's reading of itself. Rendered once per crossfade layer. */
function HeroFigures({ semester }: { semester: SemesterSummary }) {
  const { t } = useI18n();

  const { gpa, mention, credits } = semester;
  const key = mention === null ? null : mentionKey(mention);

  return (
    <>
      {/*
        No ring when there is no average — §5's fill animates "from 0% to its
        target value", and a gauge pinned at zero would read as a zero.
      */}
      {gpa !== null && (
        <GpaRing gpa={gpa} label={t('grades.hero.ring_label', { gpa: gpa.toFixed(2) })} />
      )}

      <div className={styles.heroText}>
        <p className={styles.heroLabel}>{t('grades.hero.label')}</p>

        {gpa === null ? (
          <p className={styles.heroNoGpa}>{t('grades.hero.no_gpa')}</p>
        ) : (
          <p className={styles.heroValue}>
            {/*
              .num on both: a GPA must read identically in both languages, so it
              stays on the Latin face in Arabic. toFixed(2) rather than the raw
              float — 13.666666 is not a mark.
            */}
            <span className={`${styles.heroNumber} num`}>{gpa.toFixed(2)}</span>
            <span className={`${styles.heroScale} num`}>{t('grades.hero.scale')}</span>
          </p>
        )}

        <p className={styles.heroMeta}>
          {mention !== null && (
            <span className={styles.mention}>{key === null ? mention : t(key)}</span>
          )}
          <span className={styles.heroCredits}>
            <Interpolated
              template={t('grades.hero.credits')}
              values={{ earned: credits.earned, total: credits.total }}
            />
          </span>
        </p>

        <p className={styles.heroYear}>
          <Interpolated
            template={t('grades.academic_year')}
            values={{ year: semester.academicYear }}
          />
        </p>
      </div>
    </>
  );
}
