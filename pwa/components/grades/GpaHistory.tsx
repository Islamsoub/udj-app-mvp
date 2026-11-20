'use client';

import { Fragment } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import type { SemesterSummary } from '@/lib/api-types';
import { fmtLtr } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import styles from './grades.module.css';

/*
 * The prototype's chart, in its own units: a 90px-tall SVG, the line between
 * y 20 (highest average) and y 64 (lowest), the semester labels on y 82. Each
 * average is written above its dot.
 */
const Y_TOP = 20;
const Y_BOTTOM = 64;
const Y_LABEL = 82;
/** Baseline of an average above its dot: clear of a 3.5px dot, or of the
 *  selected one's 5px fill and 2px ring. */
const VALUE_GAP = 9;
const VALUE_GAP_SELECTED = 11;

/** The page's number formatting: two decimals, as the hero and the table. */
const fmt = (gpa: number) => gpa.toFixed(2);

interface Trend {
  /** In hundredths, between the two averages as displayed. */
  delta: number;
  /** The semester compared against: the nearest earlier one with an average. */
  from: SemesterSummary;
}

/**
 * The selected semester against the nearest earlier semester that has a
 * published average. Null for the first such semester, and for a selected
 * semester with no average of its own: nothing to compare.
 *
 * Compared as DISPLAYED, to two decimals: 12.284 and 12.276 both read 12.28,
 * and calling that "+0.01" would contradict the two figures on the chart.
 */
export function trendFor(semesters: SemesterSummary[], selectedId: string): Trend | null {
  const index = semesters.findIndex((s) => s.id === selectedId);
  const selected = semesters[index];
  if (selected === undefined || selected.gpa === null) return null;

  for (let i = index - 1; i >= 0; i -= 1) {
    const earlier = semesters[i];
    if (earlier.gpa !== null) {
      const delta = Math.round((Number(fmt(selected.gpa)) - Number(fmt(earlier.gpa))) * 100);
      return { delta, from: earlier };
    }
  }
  return null;
}

/** "+0.02", "−0.40" (a true minus sign, U+2212), or "0.00". */
function deltaText(delta: number): string {
  const value = (Math.abs(delta) / 100).toFixed(2);
  return delta > 0 ? `+${value}` : delta < 0 ? `−${value}` : value;
}

/**
 * "Historique GPA": the published average of each of the student's semesters,
 * oldest first (ASK A3, decided (b) by the product owner, 2026-11-20, then made
 * useful the same day).
 *
 * Drawn only from two published averages (GradesView decides, through
 * history-hint): one point is not a history. The data is the semester list the
 * tabs already loaded — every entry carries its own published gpa — so nothing
 * is fetched: a semester whose average is not published has NO DOT and breaks
 * the line, and is never drawn as a zero or bridged by an invented value.
 *
 * It follows the S1/S2 switch: the selected semester's dot is larger, ringed,
 * and its label is in --ink, and the line under the title compares it with the
 * nearest earlier semester that has an average.
 *
 * WHY NOT THE PROTOTYPE'S SINGLE POLYLINE. The prototype draws a 320x90 viewBox
 * stretched with preserveAspectRatio="none", which squashes its dots into
 * ellipses and its labels into narrow type at any width but 320. Here the x axis
 * is in percent of the plot box (and y in user units of a 90px-tall box), so a
 * dot stays round at every width. A polyline cannot take percentages, so the
 * line is one <line> per pair of published neighbours — which is also what
 * draws a gap: no line is emitted across a semester with no average.
 *
 * RTL. Semesters run right to left in Arabic: x is mirrored from `dir`, since an
 * SVG coordinate is physical and never follows the page direction on its own.
 *
 * ACCESSIBILITY. The drawing and the visible trend are aria-hidden; a visually
 * hidden list says each semester and its average (or that it is not published)
 * and then the trend, so it is read once, in that order.
 */
export function GpaHistory({
  semesters,
  selectedId,
}: {
  semesters: SemesterSummary[];
  selectedId: string;
}) {
  const { t, dir } = useI18n();

  const published = semesters.filter((s) => s.gpa !== null).map((s) => s.gpa as number);
  if (published.length < 2) return null;

  const trend = trendFor(semesters, selectedId);
  const trendTemplate = trend === null ? null : trend.delta === 0 ? t('grades.history.trend_stable') : t('grades.history.trend');
  const trendClass =
    trend === null
      ? ''
      : trend.delta > 0
        ? styles.historyTrendUp
        : trend.delta < 0
          ? styles.historyTrendDown
          : styles.historyTrendStable;

  return (
    <section className={styles.historyCard}>
      <h2 className={`${styles.historyTitle} ${trend !== null ? styles.historyTitleWithTrend : ''}`}>
        {t('grades.history.title')}
      </h2>

      {trend !== null && trendTemplate !== null && (
        <p className={`${styles.historyTrend} ${trendClass}`} aria-hidden="true">
          <Interpolated
            template={trendTemplate}
            values={{
              // The sign belongs to the figure: isolated LTR so Arabic keeps
              // "+0.02" whole, on the Latin face like every number here.
              delta: fmtLtr(deltaText(trend.delta)),
              semester: fmtLtr(trend.from.label),
            }}
          />
        </p>
      )}

      <Chart semesters={semesters} published={published} selectedId={selectedId} rtl={dir === 'rtl'} />

      <ul className={styles.srOnly}>
        {semesters.map((s) => (
          <li key={s.id}>
            {s.gpa === null
              ? t('grades.history.item_none', { semester: s.label })
              : t('grades.history.item', { semester: s.label, gpa: fmt(s.gpa) })}
          </li>
        ))}
        {trend !== null && trendTemplate !== null && (
          <li>
            {t(trend.delta === 0 ? 'grades.history.trend_stable' : 'grades.history.trend', {
              delta: deltaText(trend.delta),
              semester: trend.from.label,
            })}
          </li>
        )}
      </ul>
    </section>
  );
}

function Chart({
  semesters,
  published,
  selectedId,
  rtl,
}: {
  semesters: SemesterSummary[];
  published: number[];
  selectedId: string;
  rtl: boolean;
}) {
  const min = Math.min(...published);
  const max = Math.max(...published);

  /* Several semesters with the same average sit mid-height: there is no range
     to place them in, and the top or bottom would read as a trend. */
  const y = (gpa: number) =>
    max === min ? (Y_TOP + Y_BOTTOM) / 2 : Y_BOTTOM - ((gpa - min) / (max - min)) * (Y_BOTTOM - Y_TOP);

  /* Evenly spaced across the plot box, the ends on its edges. Percent, mirrored
     in Arabic. */
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

        {semesters.map((s, i) => {
          if (s.gpa === null) return null;
          const selected = s.id === selectedId;
          return (
            <Fragment key={s.id}>
              {/* Selected: a 5px jade fill inside a 2px ring of the card's own
                  colour — r 6 with a 2px stroke centred on it covers 5 to 7. */}
              <circle
                className={selected ? styles.historyDotSelected : styles.historyDot}
                cx={x(i)}
                cy={y(s.gpa)}
                r={selected ? 6 : 3.5}
              />
              <text
                className={`${styles.historyValue} mono`}
                x={x(i)}
                y={y(s.gpa) - (selected ? VALUE_GAP_SELECTED : VALUE_GAP)}
                textAnchor="middle"
              >
                {fmt(s.gpa)}
              </text>
            </Fragment>
          );
        })}

        {semesters.map((s, i) => (
          <text
            key={s.id}
            className={`${styles.historyLabel} ${s.id === selectedId ? styles.historyLabelSelected : ''} num`}
            x={x(i)}
            y={Y_LABEL}
            textAnchor="middle"
          >
            {s.label}
          </text>
        ))}
      </svg>
    </div>
  );
}
