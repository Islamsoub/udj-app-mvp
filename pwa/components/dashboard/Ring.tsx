'use client';

import { useState } from 'react';
import type { AttendanceBand } from '@/lib/api-types';
import { percentText } from '@/lib/bidi';
import { takeOnce } from './session-flags';
import styles from './dashboard.module.css';

const SIZE = 84;
const STROKE = 8;
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
 */
export function Ring({
  percentage,
  band,
  label,
}: {
  percentage: number;
  band: AttendanceBand;
  label: string;
}) {
  const [filling] = useState(() => takeOnce('dashboard_ring_attendance'));

  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <svg
      className={styles.ring}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      role="img"
      aria-label={label}
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
      {/*
        The percentage sits inside the ring. `.num` keeps it on the Latin face in
        Arabic, per the design-system rule that every number does.
      */}
      <text
        className={`${styles.ringLabel} num`}
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="central"
      >
        {/* An SVG <text> cannot hold a <bdi>, and does not need one: with no
            Arabic letter before it in the element, "92%" keeps its order. */}
        {percentText(clamped)}
      </text>
    </svg>
  );
}
