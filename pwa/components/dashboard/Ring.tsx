'use client';

import { useState } from 'react';
import type { AttendanceBand } from '@/lib/api-types';
import { fmtPercent } from '@/lib/bidi';
import { takeOnce } from './session-flags';
import styles from './dashboard.module.css';

/** Dashboard Spec §6 ②: an 88 px gauge whose ring is 9 px thick (hole inset 9). */
const SIZE = 88;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const STROKE_CLASS: Record<AttendanceBand, string> = {
  ok: styles.ringValueOk,
  near: styles.ringValueNear,
  below: styles.ringValueBelow,
};

/**
 * The attendance gauge (§5).
 *
 * Fills from 0% to its value once, on first paint of the view, over --dur-slow
 * with --ease-in-out, and does not replay when the student navigates back in the
 * same session — §5 calls a repeat "gimmicky", and it is: the animation exists
 * to draw the eye to a number that is new, and on the second visit it is not.
 *
 * The fill decision is taken in a lazy initialiser, so the once-per-session flag
 * is claimed when this component first renders WITH a value — not when the
 * dashboard mounts. The card spends its first 400ms as a skeleton, and burning
 * the flag then would mean the ring never animates at all.
 *
 * The stroke follows the server's overall `band` (ROUND2-CLOSEOUT §3, A3),
 * never a comparison of `percentage` with the threshold. The colour only
 * repeats what the card's words already say; it is never the sole signal.
 *
 * The value and its caption ("TAUX", §6 ②) sit in HTML over the SVG rather
 * than in an SVG <text>: the caption is a word, so it must take the active
 * language's face, and the value must go through fmtPercent like every other
 * visible percentage. The wrapper is the one image a screen reader meets; the
 * label it announces already holds the value.
 */
export function Ring({
  percentage,
  band,
  label,
  caption,
}: {
  percentage: number;
  band: AttendanceBand;
  /** The accessible name: the card title and the value. */
  label: string;
  /** The word under the value, "TAUX". */
  caption: string;
}) {
  const [filling] = useState(() => takeOnce('dashboard_ring_attendance'));

  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className={styles.ring} role="img" aria-label={label}>
      <svg
        className={styles.ringSvg}
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        aria-hidden="true"
        style={
          {
            '--ring-circumference': `${CIRCUMFERENCE}`,
            '--ring-offset': `${offset}`,
          } as React.CSSProperties
        }
      >
        <circle className={styles.ringTrack} cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} strokeWidth={STROKE} />
        <circle
          className={`${styles.ringValue} ${STROKE_CLASS[band]} ${filling ? styles.ringFilling : ''}`}
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          strokeWidth={STROKE}
        />
      </svg>
      <div className={styles.ringHole} aria-hidden="true">
        {/* `.num`: the figure stays on the Latin face in Arabic. */}
        <span className={`${styles.ringLabel} num`}>{fmtPercent(clamped)}</span>
        <span className={styles.ringCaption}>{caption}</span>
      </div>
    </div>
  );
}
