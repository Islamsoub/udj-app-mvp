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

/*
 * The head row's two glyphs are the prototype's own (#btn-calc, #btn-export-pdf),
 * path for path and with its attributes: 1.8 stroke and the SVG default butt
 * caps, not this file's round ones — the keypad "dots" are 1-unit dashes there,
 * and round caps would draw them visibly larger.
 */
const prototypeStroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8 };

/** Calculator — the grade-calculator trigger. */
export function CalculatorIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...prototypeStroke}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <path d="M9 7h6M8 12h1M12 12h1M16 12h1M8 16h1M12 16h1M16 16h1" />
    </svg>
  );
}

/** Upload-out-of-a-tray — "Exporter PDF". */
export function ExportIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...prototypeStroke}>
      <path d="M12 15V3m0 0 4 4m-4-4-4 4" />
      <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
    </svg>
  );
}
