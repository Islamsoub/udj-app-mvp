/**
 * Inline stroke-only SVGs, sized by the caller through CSS.
 *
 * Inline rather than files in /public: they are a handful of paths, they must
 * take their colour from `currentColor` to work on the jade hero and on the
 * light surface alike, and an icon that ships inside the bundle cannot 404 on a
 * student whose connection dropped mid-load.
 */

type IconProps = { className?: string };

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Globe — the language chip. */
export function GlobeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 4 6 4 9s-1.5 6.5-4 9c-2.5-2.5-4-6-4-9s1.5-6.5 4-9z" />
    </svg>
  );
}

/** Shield — the offline-data row. */
export function ShieldIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M12 3l7 3v6c0 5-3.5 8-7 9-3.5-1-7-4-7-9V6z" />
    </svg>
  );
}

/** Wifi — the rate-limit card. Signals "network", never "you got it wrong". */
export function WifiIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M2 8.5a16 16 0 0 1 20 0" />
      <path d="M5.5 12.5a11 11 0 0 1 13 0" />
      <path d="M9 16.5a5.5 5.5 0 0 1 6 0" />
      <circle cx="12" cy="20" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** Eye — password currently hidden, tap to reveal. */
export function EyeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

/** Eye with a slash — password currently visible, tap to hide. */
export function EyeOffIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M10.6 6.2A9.9 9.9 0 0 1 12 6c6.5 0 10 7 10 7a17 17 0 0 1-3 3.9" />
      <path d="M6.6 7.6C3.9 9.3 2 12 2 12s3.5 7 10 7a9.8 9.8 0 0 0 4.4-1" />
      <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

/**
 * The Unipocket mark.
 *
 * Drawn rather than referenced: the design mock points at
 * assets/unipocket-icon-foreground.png, which has no counterpart anywhere in
 * pwa/ — there is no public/ directory yet. A missing <img> on the first screen
 * a student ever sees is worse than a simple mark, so this stands in until the
 * real icon set is added.
 */
export function UnipocketMark({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 64 64" aria-hidden="true" fill="none">
      <rect x="8" y="14" width="48" height="36" rx="9" stroke="currentColor" strokeWidth="3.5" />
      <path d="M8 30h14a4 4 0 0 1 4 4 6 6 0 0 0 12 0 4 4 0 0 1 4-4h14" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
      <path d="M24 14V9a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v5" stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" />
    </svg>
  );
}
