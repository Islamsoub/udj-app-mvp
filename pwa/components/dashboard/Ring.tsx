'use client';

import { useState } from 'react';
import { takeOnce } from './session-flags';
import styles from './dashboard.module.css';

const SIZE = 84;
const STROKE = 8;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

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
 */
export function Ring({ percentage, label }: { percentage: number; label: string }) {
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
        className={`${styles.ringValue} ${filling ? styles.ringFilling : ''}`}
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
        {Math.round(clamped)}%
      </text>
    </svg>
  );
}
