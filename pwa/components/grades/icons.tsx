/**
 * Grades glyphs — stroke-only, sized by CSS, coloured by `currentColor`. Same
 * construction as the shell's and the dashboard's icon sets.
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
 * The sort caret (§5: "rotates 180° over --dur-fast").
 *
 * Drawn pointing down and flipped by CSS rather than swapped for a second
 * glyph — a transform is what can be transitioned; exchanging two icons would
 * cut instead of rotate. No `aria-hidden` override is offered: the header
 * button's own label carries the meaning for assistive tech, and `aria-sort` on
 * the cell carries the current state.
 */
export function CaretIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M6 9.5 12 15.5 18 9.5" />
    </svg>
  );
}

/** Arrow pointing toward the inline-end — the empty state's "go to that
 *  semester" action. Mirrored in RTL by the stylesheet, not by a second path. */
export function ArrowIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M5 12h14" />
      <path d="m13 6 6 6-6 6" />
    </svg>
  );
}

/** Calculator — the grade-calculator trigger. */
export function CalculatorIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <rect x="4.5" y="3" width="15" height="18" rx="2.5" />
      <path d="M8 7.5h8" />
      <path d="M8.5 12h.01M12 12h.01M15.5 12h.01M8.5 16h.01M12 16h.01M15.5 16h.01" />
    </svg>
  );
}
