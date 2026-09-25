'use client';

import { mentionKey } from '@/components/grades/model';
import { getMe } from '@/lib/api-client';
import type { MeResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { Card, CardStates, EmptyState } from './Card';
import { GpaIcon } from './icons';
import { useCardData } from './useCardData';
import styles from './dashboard.module.css';

/**
 * Moyenne générale.
 *
 * `stats.gpa` is null for all but a handful of students — only eight grades are
 * published in the whole database — so THE EMPTY STATE IS THE NORMAL RENDERING
 * of this card, not an edge case. It is written accordingly: a plain statement
 * that results are not published yet, in ordinary text, with no warning colour,
 * no icon, no retry and no zero.
 *
 * Showing 0,00 would be the worst possible reading of a null here: a student
 * who has not been graded would see a failing mark for work that has not been
 * marked. Null means "not published", never "zero" — the same rule the grades
 * API documents for noteCf and noteFinale.
 */
export function GpaCard({ index, animate, online }: { index: number; animate: boolean; online: boolean }) {
  const { t } = useI18n();
  const state = useCardData<MeResponse>(() => getMe(), online);

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
        {(data) => {
          const { gpa, mention, totalCredits } = data.stats;
          // The backend sends the French label; the Grades screen's own mapping
          // turns it into a locale key, so both screens say the same word.
          const labelKey = mention === null ? null : mentionKey(mention);

          if (gpa === null) {
            return (
              <EmptyState
                title={t('dashboard.gpa.empty_title')}
                body={t('dashboard.gpa.empty_body')}
              />
            );
          }

          return (
            <div>
              <div className={styles.heroValue}>
                {/*
                  .num on the figure and the scale: a GPA must read identically
                  in both languages, so it stays on the Latin face in Arabic.
                  toFixed(2) rather than the raw float — 13.666666 is not a mark.
                */}
                <span className={`${styles.heroNumber} num`}>{gpa.toFixed(2)}</span>
                <span className={`${styles.heroScale} num`}>{t('dashboard.gpa.scale')}</span>
              </div>

              {mention !== null && (
                <span className={styles.mention}>
                  {labelKey === null ? mention : t(labelKey)}
                </span>
              )}

              <p className={styles.heroCaption}>
                <span className="num">
                  {totalCredits.earned}/{totalCredits.total}
                </span>{' '}
                ECTS
              </p>
            </div>
          );
        }}
      </CardStates>
    </Card>
  );
}
