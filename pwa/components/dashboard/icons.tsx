/**
 * Dashboard glyphs — stroke-only, sized by CSS, coloured by `currentColor`.
 * Same reasoning as the shell's icon set: inline, so they take the colour of
 * whatever tint they sit on and nothing can 404 offline.
 *
 * Two stroke weights, as Design draws them: 2 for the countdown clock and the
 * notification bell, 1.8 for the quick-link tiles (dashboard.html:119-121). The
 * other notification chips use the sidebar's section icons (shell/icons.tsx).
 */

type IconProps = { className?: string };

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const chipStrokeProps = { ...strokeProps, strokeWidth: 2 };

/** Clock — the countdown pill. */
export function ClockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...chipStrokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

/** Bell — the GENERAL notification chip, the one type with no sidebar section. */
export function BellIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...chipStrokeProps}>
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

/** Upload — "Justifier une absence" (dashboard.html:119). */
export function UploadIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M12 15V3m0 0 4 4m-4-4-4 4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}

/** Calculator — "Simuler ma moyenne" (dashboard.html:120). */
export function CalculatorIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6M8 12h1M12 12h1M16 12h1" />
    </svg>
  );
}

/** Calendar — "Mon planning" (dashboard.html:121). */
export function CalendarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10h18M8 3v4M16 3v4" />
    </svg>
  );
}
