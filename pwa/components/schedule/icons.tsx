/**
 * Schedule glyphs — stroke-only, sized by CSS, coloured by `currentColor`. Same
 * construction as the shell's, the dashboard's and the grades' icon sets.
 */

type IconProps = { className?: string };

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/**
 * A chevron pointing toward the inline-end.
 *
 * ONE GLYPH FOR BOTH ARROWS, flipped by the stylesheet. Two mirrored paths would
 * be two things to keep in step, and the flip is direction-dependent anyway —
 * "previous" points left in French and right in Arabic, which no single path can
 * express.
 */
export function ChevronIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="m9.5 5 7 7-7 7" />
    </svg>
  );
}

/** Pin — the room. */
export function RoomIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

/** Person — the professor. */
export function ProfessorIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.6 3.1-5.5 7-5.5s7 1.9 7 5.5" />
    </svg>
  );
}

/** Clock — the time row. */
export function ClockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

/** Hash — the subject code. */
export function CodeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M9.5 4 7.5 20M16.5 4l-2 16M4.5 9h15M3.5 15h15" />
    </svg>
  );
}
