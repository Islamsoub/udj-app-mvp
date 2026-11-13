import type { NavItem } from './nav-items';

/**
 * Shell glyphs: 24x24 viewBox, sized by the caller through CSS (19px in the
 * sidebar, 21px in the tab bar, per Dashboard Spec.html "Nav icons ... drawn at
 * 19 px (21 px in the tab bar)").
 *
 * The six nav glyphs are the mobile app's tab icons (assets/icons/tab-*.svg,
 * path-identical to dashboard.html's inline nav SVGs) plus the spec's clock for
 * Présence, which has no app tab. They are NOT one style: home, agenda and notes
 * are filled shapes, actus and profile are thin strokes inside their own
 * transforms, and the clock is a stroke-2 utility glyph. Each keeps its source's
 * own <g transform> and fill or stroke attributes, copied verbatim, so the set
 * draws exactly as the app and the spec draw it. Only the nav glyphs follow
 * that rule; the utility glyphs further down share `strokeProps`.
 *
 * Same reasoning as the login screen's icons: inline so they take their colour
 * from `currentColor` (the nav item's colour changes on hover, active and
 * collapse), and so nothing can 404 on a student whose connection dropped.
 *
 * None of them are mirrored in RTL. These are objects and symbols, not arrows:
 * a calendar and a clock read the same in both directions. The one
 * direction-sensitive glyph, the collapse chevron, is flipped by CSS at the call
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

/** assets/icons/tab-home.svg (filled). */
function HomeIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g transform="translate(3.556 2.5) scale(1.05556)">
        <path
          fill="currentColor"
          d="M2 15.5H5V10.5C5 10.2167 5.096 9.97933 5.288 9.788C5.48 9.59667 5.71733 9.50067 6 9.5H10C10.2833 9.5 10.521 9.596 10.713 9.788C10.905 9.98 11.0007 10.2173 11 10.5V15.5H14V6.5L8 2L2 6.5V15.5ZM0 15.5V6.5C0 6.18333 0.0709998 5.88333 0.213 5.6C0.355 5.31667 0.550667 5.08333 0.8 4.9L6.8 0.4C7.15 0.133333 7.55 0 8 0C8.45 0 8.85 0.133333 9.2 0.4L15.2 4.9C15.45 5.08333 15.646 5.31667 15.788 5.6C15.93 5.88333 16.0007 6.18333 16 6.5V15.5C16 16.05 15.804 16.521 15.412 16.913C15.02 17.305 14.5493 17.5007 14 17.5H10C9.71667 17.5 9.47933 17.404 9.288 17.212C9.09667 17.02 9.00067 16.7827 9 16.5V11.5H7V16.5C7 16.7833 6.904 17.021 6.712 17.213C6.52 17.405 6.28267 17.5007 6 17.5H2C1.45 17.5 0.979333 17.3043 0.588 16.913C0.196666 16.5217 0.000666667 16.0507 0 15.5Z"
        />
      </g>
    </svg>
  );
}

/** assets/icons/tab-agenda.svg (filled). */
function CalendarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g transform="translate(2.25 2.25) scale(0.975)">
        <path
          fill="currentColor"
          d="M17 2H15V1C15 0.734784 14.8946 0.48043 14.7071 0.292893C14.5196 0.105357 14.2652 0 14 0C13.7348 0 13.4804 0.105357 13.2929 0.292893C13.1054 0.48043 13 0.734784 13 1V2H7V1C7 0.734784 6.89464 0.48043 6.70711 0.292893C6.51957 0.105357 6.26522 0 6 0C5.73478 0 5.48043 0.105357 5.29289 0.292893C5.10536 0.48043 5 0.734784 5 1V2H3C2.20435 2 1.44129 2.31607 0.87868 2.87868C0.316071 3.44129 0 4.20435 0 5V17C0 17.7956 0.316071 18.5587 0.87868 19.1213C1.44129 19.6839 2.20435 20 3 20H17C17.7956 20 18.5587 19.6839 19.1213 19.1213C19.6839 18.5587 20 17.7956 20 17V5C20 4.20435 19.6839 3.44129 19.1213 2.87868C18.5587 2.31607 17.7956 2 17 2ZM18 17C18 17.2652 17.8946 17.5196 17.7071 17.7071C17.5196 17.8946 17.2652 18 17 18H3C2.73478 18 2.48043 17.8946 2.29289 17.7071C2.10536 17.5196 2 17.2652 2 17V10H18V17ZM18 8H2V5C2 4.73478 2.10536 4.48043 2.29289 4.29289C2.48043 4.10536 2.73478 4 3 4H5V5C5 5.26522 5.10536 5.51957 5.29289 5.70711C5.48043 5.89464 5.73478 6 6 6C6.26522 6 6.51957 5.89464 6.70711 5.70711C6.89464 5.51957 7 5.26522 7 5V4H13V5C13 5.26522 13.1054 5.51957 13.2929 5.70711C13.4804 5.89464 13.7348 6 14 6C14.2652 6 14.5196 5.89464 14.7071 5.70711C14.8946 5.51957 15 5.26522 15 5V4H17C17.2652 4 17.5196 4.10536 17.7071 4.29289C17.8946 4.48043 18 4.73478 18 5V8Z"
        />
      </g>
    </svg>
  );
}

/** assets/icons/tab-notes.svg (filled, three lines). */
function ChartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g transform="translate(2.25 5.5) scale(1.08333)">
        <path
          fill="currentColor"
          d="M1 12C0.71667 12 0.479337 11.904 0.288004 11.712C0.0966702 11.52 0.000670115 11.2827 3.44827e-06 11C-0.000663218 10.7173 0.0953369 10.48 0.288004 10.288C0.48067 10.096 0.718003 10 1 10H11C11.2833 10 11.521 10.096 11.713 10.288C11.905 10.48 12.0007 10.7173 12 11C11.9993 11.2827 11.9033 11.5203 11.712 11.713C11.5207 11.9057 11.2833 12.0013 11 12H1ZM1 7C0.71667 7 0.479337 6.904 0.288004 6.712C0.0966702 6.52 0.000670115 6.28267 3.44827e-06 6C-0.000663218 5.71733 0.0953369 5.48 0.288004 5.288C0.48067 5.096 0.718003 5 1 5H17C17.2833 5 17.521 5.096 17.713 5.288C17.905 5.48 18.0007 5.71733 18 6C17.9993 6.28267 17.9033 6.52033 17.712 6.713C17.5207 6.90567 17.2833 7.00133 17 7H1ZM1 2C0.71667 2 0.479337 1.904 0.288004 1.712C0.0966702 1.52 0.000670115 1.28267 3.44827e-06 1C-0.000663218 0.717333 0.0953369 0.48 0.288004 0.288C0.48067 0.0960001 0.718003 0 1 0H17C17.2833 0 17.521 0.0960001 17.713 0.288C17.905 0.48 18.0007 0.717333 18 1C17.9993 1.28267 17.9033 1.52033 17.712 1.713C17.5207 1.90567 17.2833 2.00133 17 2H1Z"
        />
      </g>
    </svg>
  );
}

/** design/spec-pack/specs/pwa/dashboard/icons/nav-attendance.svg (stroke 2, round caps). */
function ClockIcon({ className }: IconProps) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

/** assets/icons/tab-actus.svg (stroke 1.5, round joins). */
function NewsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g transform="translate(1.5 1.5)">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinejoin="round"
          d="M0.750168 17.9082V13.2572C0.750168 12.5472 0.750168 12.1932 0.881168 12.1532C1.01317 12.1132 1.21417 12.4192 1.61617 13.0302C3.00817 15.1442 5.35617 17.4922 7.47017 18.8842C8.08017 19.2862 8.38617 19.4872 8.34717 19.6192C8.30717 19.7492 7.95317 19.7492 7.24317 19.7492H2.59217C1.72417 19.7492 1.28917 19.7492 1.02017 19.4802C0.750168 19.2102 0.750168 18.7762 0.750168 17.9082ZM19.7502 2.59224V7.24324C19.7502 7.95324 19.7502 8.30724 19.6202 8.34724C19.4882 8.38624 19.2872 8.08124 18.8842 7.47024C17.4922 5.35624 15.1442 3.00824 13.0302 1.61624C12.4202 1.21424 12.1142 1.01324 12.1542 0.881244C12.1942 0.750244 12.5482 0.750244 13.2572 0.750244H17.9092C18.7772 0.750244 19.2112 0.750244 19.4812 1.02024C19.7512 1.29024 19.7502 1.72424 19.7502 2.59224ZM0.750168 2.65024V4.87624C0.750168 5.65324 0.750168 6.04124 0.895168 6.39024C1.03917 6.74024 1.31417 7.01424 1.86317 7.56324L12.9372 18.6372C13.4872 19.1872 13.7612 19.4612 14.1102 19.6052C14.4592 19.7492 14.8472 19.7502 15.6242 19.7502H17.8502C18.7462 19.7502 19.1932 19.7502 19.4722 19.4722C19.7502 19.1932 19.7502 18.7462 19.7502 17.8502V15.6242C19.7502 14.8472 19.7502 14.4592 19.6052 14.1102C19.4612 13.7602 19.1862 13.4862 18.6372 12.9372L7.56317 1.86324C7.01317 1.31324 6.73917 1.03924 6.39017 0.895244C6.04117 0.751244 5.65317 0.750244 4.87617 0.750244H2.65017C1.75417 0.750244 1.30617 0.750244 1.02817 1.02824C0.750168 1.30724 0.750168 1.75424 0.750168 2.65024Z"
        />
      </g>
    </svg>
  );
}

/** assets/icons/tab-profile.svg (stroke 1.714 inside scale 0.875, round joins). */
function UserIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <g transform="translate(1.5 1.5) scale(0.875)">
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth={1.714}
          strokeLinejoin="round"
          d="M4 18C4 16.9391 4.42143 15.9217 5.17157 15.1716C5.92172 14.4214 6.93913 14 8 14H16C17.0609 14 18.0783 14.4214 18.8284 15.1716C19.5786 15.9217 20 16.9391 20 18C20 18.5304 19.7893 19.0391 19.4142 19.4142C19.0391 19.7893 18.5304 20 18 20H6C5.46957 20 4.96086 19.7893 4.58579 19.4142C4.21071 19.0391 4 18.5304 4 18Z"
        />
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth={1.714}
          strokeLinejoin="round"
          d="M12 10C13.6569 10 15 8.65685 15 7C15 5.34315 13.6569 4 12 4C10.3431 4 9 5.34315 9 7C9 8.65685 10.3431 10 12 10Z"
        />
      </g>
    </svg>
  );
}

const BY_NAME: Record<NavItem['icon'], (props: IconProps) => React.ReactElement> = {
  home: HomeIcon,
  calendar: CalendarIcon,
  chart: ChartIcon,
  clock: ClockIcon,
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
 * expanded; CSS mirrors it with scaleX(-1) on collapse, in sync with the width
 * (§7).
 *
 * Its own stroke, not `strokeProps`: the spec draws it at 14px with stroke 2
 * (app.css:103 and the collapse button in dashboard.html), where the shared 1.8
 * would read thin. Changing `strokeProps` instead would thicken every utility
 * glyph with it.
 */
const chevronStrokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

export function ChevronIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...chevronStrokeProps}>
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
