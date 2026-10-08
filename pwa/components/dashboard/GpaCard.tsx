'use client';

import { latestPublished, mentionKey, orderSemesters } from '@/components/grades/model';
import { getGrades, getGradesAllSemesters } from '@/lib/api-client';
import type { SemesterRef, SemesterSummary } from '@/lib/api-types';
import { fmtRatio, fmtScaled } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { Card, CardStates, EmptyState } from './Card';
import { GpaIcon } from './icons';
import { Interpolated } from './Interpolated';
import { useCardData } from './useCardData';
import styles from './dashboard.module.css';

interface Averages {
  /** The semester in progress — the one whose results a student is waiting on. */
  current: SemesterRef;
  /** The most recent semester with a published average, if there is one. */
  published: SemesterSummary | null;
}

/**
 * The same two calls the Grades screen opens with, for the same reason: the
 * plain call says which semester is current, and `allSemesters` carries every
 * semester's average. /student/me cannot answer this — its `stats.gpa` is the
 * CURRENT semester's only, so a student whose last semester is published and
 * whose current one is not was told nothing was published at all.
 *
 * Module scope, so the reference is stable across renders.
 */
async function loadAverages(): Promise<Averages> {
  const [current, all] = await Promise.all([getGrades(), getGradesAllSemesters()]);
  return {
    current: current.semester,
    published: latestPublished(orderSemesters(current, all.semesters)),
  };
}

/**
 * Moyenne générale.
 *
 * Shows THE LATEST PUBLISHED AVERAGE, labelled with its semester, and says when
 * the current semester is still pending beneath it. An average the student has
 * is never hidden behind the fact that a newer one is not out yet.
 *
 * With no published average anywhere — which is most students — the empty state
 * is the normal rendering of this card, not an edge case: a plain statement, in
 * ordinary text, with no warning colour, no icon, no retry and no zero. Showing
 * 0,00 would be the worst possible reading of a null: a failing mark for work
 * that has not been marked. Null means "not published", never "zero".
 */
export function GpaCard({ index, animate, online }: { index: number; animate: boolean; online: boolean }) {
  const { t } = useI18n();
  const state = useCardData<Averages>(loadAverages, online);

  return (
    <Card
      title={t('dashboard.gpa.title')}
      icon={<GpaIcon />}
      href="/grades"
      index={index}
      animate={animate}
    >
      <CardStates
        state={state}
        skeleton={
          <div className={styles.skeletonStack}>
            <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
          </div>
        }
      >
        {({ current, published }) => {
          if (published === null || published.gpa === null) {
            return (
              <EmptyState
                title={t('dashboard.gpa.empty_title')}
                body={t('dashboard.gpa.empty_body')}
              />
            );
          }

          const { gpa, mention, credits } = published;
          // The backend sends the French label; the Grades screen's own mapping
          // turns it into a locale key, so both screens say the same word.
          const labelKey = mention === null ? null : mentionKey(mention);

          return (
            <div>
              <div className={styles.heroValue}>
                {/*
                  .num on the figure, the scale and the semester: a GPA must read
                  identically in both languages, so it stays on the Latin face in
                  Arabic. toFixed(2) rather than the raw float — 13.666666 is not
                  a mark. fmtScaled keeps "15.17 / 20" in that order in Arabic;
                  the semester stays outside it and follows in reading order.
                */}
                {fmtScaled(
                  <span className={`${styles.heroNumber} num`}>{gpa.toFixed(2)}</span>,
                  <span className={`${styles.heroScale} num`}>{t('dashboard.gpa.scale')}</span>
                )}
                {/* Which semester the figure belongs to — it may not be the
                    current one. */}
                <span className={`${styles.heroScale} num`}>· {published.label}</span>
              </div>

              {mention !== null && (
                <span className={styles.mention}>
                  {labelKey === null ? mention : t(labelKey)}
                </span>
              )}

              <p className={styles.heroCaption}>
                <Interpolated
                  template={t('grades.hero.credits')}
                  values={{ credits: fmtRatio(credits.earned, credits.total) }}
                />
              </p>

              {published.id !== current.id && (
                <p className={styles.heroCaption}>
                  <Interpolated
                    template={t('dashboard.gpa.pending')}
                    values={{ semester: current.label }}
                  />
                </p>
              )}
            </div>
          );
        }}
      </CardStates>
    </Card>
  );
}
