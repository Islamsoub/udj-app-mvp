'use client';

import { useState } from 'react';
import { takeOnce } from '@/components/dashboard/session-flags';
import styles from './grades.module.css';

const SIZE = 104;
const STROKE = 9;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/** Marks are out of 20 throughout the product, so the ring is too. */
const SCALE_MAX = 20;

/**
 * The GPA gauge (§5: "GPA / Attendance ring or gauge fill").
 *
 * "Animates from 0% to its target value once, on first paint of that view, over
 * --dur-slow with --ease-in-out. Re-visiting the same view in the same session
 * does not replay it." The once-per-session flag is claimed in a lazy
 * initialiser, so it is spent when this component first renders WITH A VALUE —
 * not when the grades screen mounts.
 *
 * That distinction is the whole point here rather than a nicety. The screen
 * opens on the current semester, and for the only student in the database with
 * published results the current semester is the unpublished one: she sees no
 * ring at all until she switches tabs. Claiming the flag on mount would burn it
 * on a view that never drew a gauge, and the one gauge she does reach would
 * appear already full.
 *
 * The component is simply not mounted when there is no GPA, which is also what
 * makes "skip the fill when there is no GPA" true by construction.
 */
export function GpaRing({ gpa, label }: { gpa: number; label: string }) {
  const [filling] = useState(() => takeOnce('grades_gpa_ring'));

  const clamped = Math.max(0, Math.min(SCALE_MAX, gpa));
  const offset = CIRCUMFERENCE * (1 - clamped / SCALE_MAX);

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
      <circle
        className={styles.ringTrack}
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        strokeWidth={STROKE}
      />
      <circle
        className={`${styles.ringValue} ${filling ? styles.ringFilling : ''}`}
        cx={SIZE / 2}
        cy={SIZE / 2}
        r={RADIUS}
        strokeWidth={STROKE}
      />
    </svg>
  );
}
