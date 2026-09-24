/**
 * News glyphs — stroke-only, sized by CSS, coloured by `currentColor`.
 * Same construction as the other screens' icon sets.
 */

type IconProps = { className?: string };

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Chevron pointing toward the inline-START — "Retour". Drawn pointing left;
 *  the stylesheet mirrors it in Arabic through a custom property set from `dir`. */
export function BackIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="m14.5 5-7 7 7 7" />
    </svg>
  );
}

/** A picture frame — the hero image's placeholder when it failed to load. */
export function ImageIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2" />
      <circle cx="9" cy="10" r="1.6" />
      <path d="m20.5 16-4.8-4.8L6 19.5" />
    </svg>
  );
}

/** Exclamation in a circle — the urgent flag, always beside the word. */
export function UrgentIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7.5v5.5" />
      <path d="M12 16.5h.01" />
    </svg>
  );
}
