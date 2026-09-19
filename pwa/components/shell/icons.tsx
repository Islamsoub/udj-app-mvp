import type { NavItem } from './nav-items';

/**
 * Shell glyphs — stroke-only, 24x24, sized by the caller through CSS.
 *
 * Same reasoning as the login screen's icons: inline so they take their colour
 * from `currentColor` (the nav item's colour changes on hover, active and
 * collapse), and so nothing can 404 on a student whose connection dropped.
 *
 * None of them are mirrored in RTL. These are objects and symbols, not arrows:
 * a calendar and a graduation chart read the same in both directions. The one
 * direction-sensitive glyph, the collapse chevron, is rotated by CSS at the call
 * site rather than being drawn twice.
 */

type IconProps = { className?: string };

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M9.5 20v-6h5v6" />
    </svg>
  );
}

function CalendarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

function ChartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M4 20V11M10 20V4M16 20v-6M22 20H2" />
    </svg>
  );
}

function CheckIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

function NewsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M7 9.5h6M7 13h10M7 16h10" />
    </svg>
  );
}

function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="8.5" r="3.75" />
      <path d="M4.5 20c0-3.6 3.4-5.75 7.5-5.75s7.5 2.15 7.5 5.75" />
    </svg>
  );
}

const BY_NAME: Record<NavItem['icon'], (props: IconProps) => React.ReactElement> = {
  home: HomeIcon,
  calendar: CalendarIcon,
  chart: ChartIcon,
  check: CheckIcon,
  news: NewsIcon,
  user: UserIcon,
};

/** Renders a nav item's glyph by name, so nav-items.ts holds no JSX. */
export function NavIcon({ name, className }: { name: NavItem['icon']; className?: string }) {
  const Glyph = BY_NAME[name];
  return <Glyph className={className} />;
}

/**
 * The sidebar collapse chevron. Points toward the inline-start edge when
 * expanded; CSS rotates it 180° on collapse, in sync with the width (§7).
 */
export function ChevronIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="m14.5 6.5-5.5 5.5 5.5 5.5" />
    </svg>
  );
}

/** Avatar placeholder in the topbar. No photo endpoint is wired up yet. */
export function AvatarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="9" r="3.5" />
      <path d="M5 19.5c0-3.3 3.1-5.25 7-5.25s7 1.95 7 5.25" />
    </svg>
  );
}

/** Cloud with a slash — the offline banner. */
export function OfflineIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M7.5 18.5h10a3.5 3.5 0 0 0 .5-6.96 5.5 5.5 0 0 0-9.2-3.2" />
      <path d="M7.5 18.5a3.5 3.5 0 0 1-.4-6.98" />
      <path d="M3 3l18 18" />
    </svg>
  );
}

/** Door with an arrow — logout, in the avatar menu. */
export function LogoutIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M15 4.5h3.5a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H15" />
      <path d="M11 15.5 14.5 12 11 8.5M14.5 12H4" />
    </svg>
  );
}
