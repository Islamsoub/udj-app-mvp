'use client';

import { useState } from 'react';
import { takeOnce } from '@/components/dashboard/session-flags';
import styles from './attendance.module.css';

/*
 * The prototype's .hero-ring, drawn in its own 96-unit viewBox (r 40, stroke 8,
 * the figure at 22 units on y 53) and rendered at layout b's 1.15 scale, 110.4px.
 * .ring's negative margin gives the layout the prototype's 96px box, which is
 * what `transform: scale(1.15)` leaves it, so the text beside the ring sits
 * exactly where Design's does. Drawn at size rather than transformed, so the
 * stroke and the figure are crisp.
 */
const VIEW = 96;
const STROKE = 8;
const RADIUS = 40;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * The presence gauge, with the percentage inside it (prototype `#pres-hero`
 * text). ONE stroke for every band, the hero's ink: on the green the band
 * colours do not reach 3:1, so the band is said by the status pill beside the
 * ring, in words.
 *
 * §5: "animates from 0% to its target value once, on first paint of that view,
 * over --dur-slow with --ease-in-out. Re-visiting the same view in the same
 * session does not replay it." The travel is in CSS (stroke-dashoffset), so
 * prefers-reduced-motion switches it off and leaves the final value drawn.
 *
 * The once-per-session flag is claimed in a lazy initialiser, so it is spent
 * when this first renders WITH A VALUE rather than when the screen mounts behind
 * its 400ms skeleton.
 *
 * Its own component rather than the dashboard's Ring or Notes' GpaRing: GpaRing
 * is on a /20 scale, and Ring's session key is shared with the dashboard card,
 * which is always spent by the time a student gets here.
 */
export function PresenceRing({ percentage, label }: { percentage: number; label: string }) {
  const [filling] = useState(() => takeOnce('attendance_presence_ring'));

  const clamped = Math.max(0, Math.min(100, percentage));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);
  const centre = VIEW / 2;

  return (
    <svg
      className={styles.ring}
      viewBox={`0 0 ${VIEW} ${VIEW}`}
      role="img"
      aria-label={label}
      style={
        {
          '--ring-circumference': `${CIRCUMFERENCE}`,
          '--ring-offset': `${offset}`,
        } as React.CSSProperties
      }
    >
      <circle className={styles.ringTrack} cx={centre} cy={centre} r={RADIUS} strokeWidth={STROKE} />
      {/* Rotated on the circle, not the svg, so the figure stays upright. The
          sweep is not mirrored in Arabic: a gauge is a dial, clockwise is
          "more" in both directions. */}
      <circle
        className={`${styles.ringValue} ${filling ? styles.ringFilling : ''}`}
        cx={centre}
        cy={centre}
        r={RADIUS}
        strokeWidth={STROKE}
        transform={`rotate(-90 ${centre} ${centre})`}
      />
      {/* "87%" in that order in Arabic too: an LTR run, on the mono face. The
          svg's aria-label carries it to assistive tech. */}
      <text className={styles.ringText} x={centre} y={53} textAnchor="middle" direction="ltr">
        {`${Math.round(clamped)}%`}
      </text>
    </svg>
  );
}
