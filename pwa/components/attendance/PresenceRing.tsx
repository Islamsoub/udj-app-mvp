'use client';

import { useState } from 'react';
import { takeOnce } from '@/components/dashboard/session-flags';
import styles from './attendance.module.css';

const SIZE = 132;
const STROKE = 11;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The presence gauge — §9 calls the fill-on-load "the hero moment of this
 * screen", so it is the largest of the three rings in the app.
 *
 * §5: "animates from 0% to its target value once, on first paint of that view,
 * over --dur-slow with --ease-in-out. Re-visiting the same view in the same
 * session does not replay it." The travel itself is in CSS (stroke-dashoffset
 * against a dasharray of the full circumference), so prefers-reduced-motion can
 * switch it off with one rule while leaving the final value drawn — the gauge
 * stays correct, only the motion goes.
 *
 * The once-per-session flag is claimed in a lazy initialiser, so it is spent
 * when this component first renders WITH A VALUE rather than when the screen
 * mounts. The screen opens on a skeleton for at least 400ms, and claiming it on
 * mount would burn the flag before there was a ring, so the one fill the student
 * is owed would never play.
 *
 * ── THIS IS THE THIRD COPY OF THIS COMPONENT ─────────────────────────────────
 *
 * components/dashboard/Ring.tsx and components/grades/GpaRing.tsx are the same
 * thirty lines with a different size, scale and session key, and this is a
 * fourth variation on them. They should be ONE component — the differences are
 * four props — and the duplication is now large enough to be worth collapsing.
 *
 * It is not collapsed here because doing so means editing the dashboard and
 * grades screens, which this change is scoped out of. Neither existing ring
 * could be imported as it stands either: GpaRing is hardcoded to a /20 scale,
 * and Ring's session key is `dashboard_ring_attendance`, shared with the
 * dashboard's own attendance card — the dashboard is the landing page, so by the
 * time a student reaches this screen that flag is always already spent and the
 * hero moment would never happen. Hence a local component with its own key, and
 * a note rather than a quiet fourth fork.
 */
export function PresenceRing({ percentage, label }: { percentage: number; label: string }) {
  const [filling] = useState(() => takeOnce('attendance_presence_ring'));

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
