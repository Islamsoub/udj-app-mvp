'use client';

import { Fragment } from 'react';
import type { SemesterSummary } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import styles from './grades.module.css';

/*
 * UNUSED FOR NOW, KEPT ON PURPOSE. The card was taken off the Notes page as an
 * experiment (ASK A3, 2026-11-20): the hero took its place. This file, its
 * styles in grades.module.css (.history*) and its strings (grades.history.*)
 * stay so that option 3 — the chart shown only from 3 published semesters, with
 * each value written on its point and a trend line — can be built from here
 * rather than from scratch. Reverting the commit that removed it puts the card
 * back exactly as it was.
 */

/*
 * The prototype's chart, in its own units: a 90px-tall SVG, the line between
 * y 20 (highest average) and y 64 (lowest), the semester labels on y 82.
 */
const Y_TOP = 20;
const Y_BOTTOM = 64;
const Y_LABEL = 82;

/**
 * "Historique GPA": the published average of each of the student's semesters,
 * oldest first (ASK A3, decided (b) by the product owner, 2026-11-20).
 *
 * The data is the semester list the tabs already loaded — every entry carries
 * its own published gpa — so nothing is fetched and nothing is computed: a
 * semester whose average is not published has NO DOT and breaks the line, and
 * is never drawn as a zero or bridged by an invented value. One published
 * semester is a single dot; none is a sentence.
 *
 * WHY NOT THE PROTOTYPE'S SINGLE POLYLINE. The prototype draws a 320x90 viewBox
 * stretched with preserveAspectRatio="none", which squashes its dots into
 * ellipses and its labels into narrow type at any width but 320. Here the x axis
 * is in percent of the plot box (and y in user units of a 90px-tall box), so a
 * dot stays a 3.5px circle at every width. A polyline cannot take percentages,
 * so the line is one <line> per pair of published neighbours — which is also
 * what draws a gap: no line is emitted across a semester with no average. Round
 * caps on butting segments are indistinguishable from a round join.
 *
 * RTL. Semesters run right to left in Arabic: x is mirrored from `dir`, since an
 * SVG coordinate is physical and never follows the page direction on its own.
 *
 * ACCESSIBILITY. The drawing is aria-hidden; a visually hidden list beside it
 * says each semester and its average, or that it is not published.
 */
export function GpaHistory({ semesters }: { semesters: SemesterSummary[] }) {
  const { t, dir } = useI18n();

  const published = semesters.filter((s) => s.gpa !== null).map((s) => s.gpa as number);

  return (
    <section className={styles.historyCard}>
      <h2 className={styles.historyTitle}>{t('grades.history.title')}</h2>

      {published.length === 0 ? (
        <p className={styles.historyEmpty}>{t('grades.history.empty')}</p>
      ) : (
        <>
          <Chart semesters={semesters} published={published} rtl={dir === 'rtl'} />
          <ul className={styles.srOnly}>
            {semesters.map((s) => (
              <li key={s.id}>
                {s.gpa === null
                  ? t('grades.history.item_none', { semester: s.label })
                  : t('grades.history.item', { semester: s.label, gpa: s.gpa.toFixed(2) })}
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function Chart({
  semesters,
  published,
  rtl,
}: {
  semesters: SemesterSummary[];
  published: number[];
  rtl: boolean;
}) {
  const min = Math.min(...published);
  const max = Math.max(...published);

  /* A single semester, or several with the same average, sits mid-height: there
     is no range to place it in, and the top or bottom would read as a trend. */
  const y = (gpa: number) =>
    max === min ? (Y_TOP + Y_BOTTOM) / 2 : Y_BOTTOM - ((gpa - min) / (max - min)) * (Y_BOTTOM - Y_TOP);

  /* Evenly spaced across the plot box, the ends on its edges; one semester in
     the middle. Percent, mirrored in Arabic. */
  const x = (index: number) => {
    const pct = semesters.length === 1 ? 50 : (index / (semesters.length - 1)) * 100;
    return `${rtl ? 100 - pct : pct}%`;
  };

  return (
    <div className={styles.historyPlot}>
      <svg className={styles.historySvg} width="100%" height="90" aria-hidden="true" focusable="false">
        {semesters.map((s, i) => {
          const next = semesters[i + 1];
          return (
            <Fragment key={s.id}>
              {s.gpa !== null && next !== undefined && next.gpa !== null && (
                <line
                  className={styles.historyLine}
                  x1={x(i)}
                  y1={y(s.gpa)}
                  x2={x(i + 1)}
                  y2={y(next.gpa)}
                />
              )}
            </Fragment>
          );
        })}

        {semesters.map((s, i) =>
          s.gpa === null ? null : (
            <circle key={s.id} className={styles.historyDot} cx={x(i)} cy={y(s.gpa)} r="3.5" />
          )
        )}

        {semesters.map((s, i) => (
          <text key={s.id} className={`${styles.historyLabel} num`} x={x(i)} y={Y_LABEL} textAnchor="middle">
            {s.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
