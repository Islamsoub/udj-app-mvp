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

/** Bookmark — "Enregistrer". Filled when the article is saved: the shape
 *  changes, not only its colour (§10). The prototype's path. */
export function BookmarkIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
      {...strokeProps}
      fill={filled ? 'currentColor' : 'none'}
    >
      <path d="M6 3h12v18l-6-4-6 4V3z" />
    </svg>
  );
}

/** Three linked dots — "Partager". The prototype's glyph. */
export function ShareIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <path d="M8.6 10.6l6.8-3.8M8.6 13.4l6.8 3.8" />
    </svg>
  );
}

/** Magnifier — the search field's glyph, at the prototype's stroke of 2. */
export function SearchIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps} strokeWidth={2}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
    </svg>
  );
}
