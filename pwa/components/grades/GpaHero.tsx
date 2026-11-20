'use client';

import { useState } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import type { SemesterSummary } from '@/lib/api-types';
import { fmtLtr, fmtScaled } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { useExitBackstop } from '@/lib/useExitBackstop';
import { MENTION_DOT, mentionKey } from './model';
import styles from './grades.module.css';

/**
 * The hero stat: one semester's average, mention and credits, as the
 * prototype's green .hero-jade (view-grades, #gpa-hero). It replaced the white
 * card with the progress ring (ASK A2, decided (b) by the product owner,
 * 2026-11-20); see .claude/design-known-divergences.md for where it departs
 * from Design's numbers and why.
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
 * THE WHOLE FIGURE CROSSFADES, not the number alone. Number, mention and
 * credits are three readings of one semester; fading the number while the
 * mention beside it cut would misattribute the old mention to the new average
 * for a fifth of a second. The depth circle is decoration and stays put.
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
      <span className={styles.heroDepth} aria-hidden="true" />

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
  // The dashboard's key, for the word and the dot alike, so the two screens
  // cannot name the same mention differently.
  const key = mention === null ? null : mentionKey(mention);
  const dot = key === null ? undefined : MENTION_DOT[key];

  return (
    <>
      <p className={styles.heroLabel}>
        {/* "S1" is Latin inside an Arabic sentence; isolated so the middle dot
            stays between the words and the label in both directions. */}
        <Interpolated template={t('grades.hero.label')} values={{ semester: fmtLtr(semester.label) }} />
      </p>

      {gpa === null ? (
        <>
          {/*
            No published average: a plain sentence where the figure would be.
            Never 0, never 0.00 — null means "not published", not "zero" — and
            no mention, no bar: both would be verdicts on finals nobody has
            published. The credits are stated as what is at stake.
          */}
          <p className={styles.heroNoGpa}>{t('grades.hero.no_gpa')}</p>
          <p className={styles.heroCredits}>
            <Interpolated template={t('grades.hero.at_stake')} values={{ total: credits.total }} />
          </p>
        </>
      ) : (
        <>
          {/*
            The figure is drawn for the eye and spoken from the sentence beside
            it — the ring's old label — because "15.17/20" read aloud is "15.17
            slash 20". Mono, as the prototype's .hj-value; toFixed(2) because
            13.666666 is not a mark; fmtScaled keeps "15.17/20" in that order in
            Arabic.
          */}
          <p className={styles.heroValue} aria-hidden="true">
            {fmtScaled(
              <span className="mono">{gpa.toFixed(2)}</span>,
              <span className={`${styles.heroSuffix} mono`}>{t('grades.hero.scale')}</span>
            )}
          </p>
          <p className={styles.srOnly}>{t('grades.hero.ring_label', { gpa: gpa.toFixed(2) })}</p>

          {mention !== null && (
            // Not a link here, unlike the dashboard's: this IS the grades page.
            <p className={styles.mentionBadge}>
              {dot && <span className={styles.mentionDot} style={{ background: dot }} aria-hidden="true" />}
              {key === null ? mention : t(key)}
            </p>
          )}

          <p className={styles.heroCredits}>
            <Interpolated
              template={t('grades.hero.credits')}
              values={{
                // One LTR run with no spaces, as the prototype's "24/32";
                // isolated so Arabic does not draw it "32/24".
                credits: (
                  <bdi dir="ltr">
                    {credits.earned}/{credits.total}
                  </bdi>
                ),
              }}
            />
          </p>

          {/* Decorative: the line above already says it in words and figures. */}
          <div className={styles.heroTrack} aria-hidden="true">
            <div
              className={styles.heroFill}
              style={{ width: `${credits.total > 0 ? Math.min(100, (credits.earned / credits.total) * 100) : 0}%` }}
            />
          </div>
        </>
      )}
    </>
  );
}
