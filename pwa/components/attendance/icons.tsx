/**
 * Attendance glyphs — stroke-only, sized by CSS, coloured by `currentColor`.
 * Same construction as the shell's, the dashboard's, the grades' and the
 * schedule's icon sets.
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
 * Warning triangle — the below-threshold marker.
 *
 * §10: "Status colors (danger/warning/info/exam) are never the only signal —
 * always paired with a label or icon." This is that icon, and the row carries
 * the words beside it as well: a student with a colour-vision deficiency, a
 * monochrome display, or a high-contrast OS theme reads the same warning.
 */
export function WarningIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M12 3.8 21 19.5H3L12 3.8Z" />
      <path d="M12 10v4" />
      <path d="M12 16.8h.01" />
    </svg>
  );
}

/** Check in a circle — an absence that has been excused. */
export function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8 12.2 2.8 2.8L16 9.5" />
    </svg>
  );
}

/** Clock — a justification the faculty has not decided on yet. */
export function PendingIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

/** Cross in a circle — a justification the faculty turned down. */
export function RejectedIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m9 9 6 6M15 9l-6 6" />
    </svg>
  );
}

/** Empty circle with a dash — an absence with nothing filed against it. */
export function UnjustifiedIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8.5 12h7" />
    </svg>
  );
}

/** A page with a folded corner — the attached justification document. */
export function DocumentIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M14 3.5H7.5A1.5 1.5 0 0 0 6 5v14a1.5 1.5 0 0 0 1.5 1.5h9A1.5 1.5 0 0 0 18 19V7.5L14 3.5Z" />
      <path d="M13.8 3.6V8h4.1" />
    </svg>
  );
}

/**
 * Arrow leaving a box — the document link opens in a new tab.
 *
 * Drawn pointing up-and-end-ward. It is NOT mirrored in RTL: this is a
 * conventional glyph read as a symbol rather than as a direction of travel, the
 * same way a play button is not mirrored, and every platform draws it this way
 * in both directions.
 */
export function ExternalIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M13.5 5h5.5v5.5" />
      <path d="M19 5l-7.5 7.5" />
      <path d="M18 14.5V18a1.5 1.5 0 0 1-1.5 1.5h-10A1.5 1.5 0 0 1 5 18V8a1.5 1.5 0 0 1 1.5-1.5H10" />
    </svg>
  );
}

/** A chevron pointing toward the inline-end — the absence row's affordance.
 *  Mirrored in RTL by the stylesheet, not by a second path. */
export function ChevronIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="m9.5 5 7 7-7 7" />
    </svg>
  );
}

/** Tray with an up arrow — the (inert) upload control. */
export function UploadIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M12 15.5V4.5" />
      <path d="m8 8.5 4-4 4 4" />
      <path d="M4.5 15.5V18A1.5 1.5 0 0 0 6 19.5h12a1.5 1.5 0 0 0 1.5-1.5v-2.5" />
    </svg>
  );
}
