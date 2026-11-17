'use client';

import Link from 'next/link';
import { latestPublished, mentionKey, orderSemesters } from '@/components/grades/model';
import { getGrades, getGradesAllSemesters } from '@/lib/api-client';
import type { SemesterRef, SemesterSummary } from '@/lib/api-types';
import { fmtScaled } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import type { TranslationKey } from '@/lib/i18n-types';
import { CardStates } from './Card';
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
 * whose current one is not would be told nothing was published at all.
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

/** The badge's dot, per mention (prototype-v1 MENTIONS). Keyed on the same
 *  translation key the label uses, so the two cannot disagree. */
const MENTION_DOT: Partial<Record<TranslationKey, string>> = {
  'grades.mention.tres_bien': 'var(--mention-tres-bien)',
  'grades.mention.bien': 'var(--mention-bien)',
  'grades.mention.assez_bien': 'var(--mention-assez-bien)',
  'grades.mention.passable': 'var(--mention-passable)',
  'grades.mention.insuffisant': 'var(--mention-insuffisant)',
};

/**
 * Moyenne générale, as Design's jade hero (dashboard.html:95-100; app.css:380-385,
 * with the dashboard's 18px padding and 32px value).
 *
 * The rules are the ones the old card had. It shows THE LATEST PUBLISHED
 * AVERAGE, labelled with its semester, and says when the current semester is
 * still pending beneath it — an average the student has is never hidden behind
 * the fact that a newer one is not out yet. With nothing published, which is
 * most students, it says so in a plain sentence: never 0, never 0,00. Null means
 * "not published", not "zero".
 *
 * Not a card, so not a stretched link: the mention badge is the link to /grades,
 * as in Design. Every screen state still renders here through CardStates, with
 * hero-coloured text (see .heroJade in the stylesheet).
 */
export function AverageHero({ index, animate, online }: { index: number; animate: boolean; online: boolean }) {
  const { t } = useI18n();
  const state = useCardData<Averages>(loadAverages, online);

  const style = animate ? ({ '--enter-delay': `${index * 40}ms` } as React.CSSProperties) : undefined;

  return (
    <section className={`${styles.heroJade} ${animate ? styles.cardEnter : ''}`} style={style}>
      <span className={styles.heroDepth} aria-hidden="true" />
      <h2 className={styles.heroJadeLabel}>{t('dashboard.gpa.title')}</h2>

      <div className={styles.cardBody}>
        <CardStates
          state={state}
          skeleton={
            <div className={styles.skeletonStack}>
              <div className={`${styles.skeleton} ${styles.skeletonHeroValue}`} />
              <div className={`${styles.skeleton} ${styles.skeletonPill}`} />
            </div>
          }
        >
          {({ current, published }) => {
            if (published === null || published.gpa === null) {
              return <p className={styles.heroJadeNone}>{t('dashboard.gpa.empty_body')}</p>;
            }

            const { gpa, mention } = published;
            // The backend sends the French label; the Grades screen's mapping
            // turns it into a key, so both screens say the same word.
            const labelKey = mention === null ? null : mentionKey(mention);
            const dot = labelKey === null ? undefined : MENTION_DOT[labelKey];

            return (
              <div>
                <p className={styles.heroJadeValue}>
                  {/*
                    Mono, as Design draws it. fmtScaled keeps "12.28/20" in that
                    order in Arabic; the semester follows in reading order, the
                    label that says which semester the figure belongs to — it may
                    not be the current one. toFixed(2): 13.666666 is not a mark.
                  */}
                  {fmtScaled(
                    <span className="mono">{gpa.toFixed(2)}</span>,
                    <span className={`${styles.heroJadeSuffix} mono`}>{t('dashboard.gpa.scale_short')}</span>
                  )}
                  <span className={`${styles.heroJadeSuffix} num`}> · {published.label}</span>
                </p>

                {mention !== null && (
                  <Link href="/grades" className={styles.mentionBadge}>
                    {dot && <span className={styles.mentionDot} style={{ background: dot }} aria-hidden="true" />}
                    {labelKey === null ? mention : t(labelKey)}
                  </Link>
                )}

                {published.id !== current.id && (
                  <p className={styles.heroJadeNote}>
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
      </div>
    </section>
  );
}
