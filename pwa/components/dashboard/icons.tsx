/**
 * Inline glyphs inside the dashboard cards — stroke-only, sized by CSS,
 * coloured by `currentColor`. Same reasoning as the shell's icon set. Card
 * titles carry no icon (Dashboard Spec §6).
 */

type IconProps = { className?: string };

/** Dashboard Spec §7: the quick-access icons use stroke 1.8. */
const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/** Dashboard Spec §7: utility icons (the notification chips) use stroke 2. */
const utilityStrokeProps = { ...strokeProps, strokeWidth: 2 };

/** Clock — the countdown pill, and the meta row. */
export function ClockIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3.5 2" />
    </svg>
  );
}

/** Check in a circle — the attendance quick link. */
export function AttendanceIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </svg>
  );
}

/*
 * The notification-row chips (Dashboard Spec §6 ③, icons/notif-*.svg). The
 * paths are the spec's; the C2PA metadata in those files is not copied.
 */

/** Layers — a grades notification (icons/notif-grades.svg). */
export function NotifGradesIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...utilityStrokeProps}>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
    </svg>
  );
}

/** Clock — an attendance notification (icons/notif-attendance.svg). */
export function NotifAttendanceIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...utilityStrokeProps}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 3" />
    </svg>
  );
}

/** Calendar — a schedule or exam-calendar notification (icons/notif-exam.svg). */
export function NotifExamIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...utilityStrokeProps}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
    </svg>
  );
}

/**
 * Bell — a notification of any other type (GENERAL, NEWS). The spec draws no
 * chip for those; the glyph is the bell from bell-states.html.
 */
export function BellIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...utilityStrokeProps}>
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6" />
      <path d="M10 20a2 2 0 0 0 4 0" />
    </svg>
  );
}

/** Newspaper — the news quick link. */
export function NewsIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <rect x="3.5" y="5" width="17" height="14" rx="2.5" />
      <path d="M7 9.5h6M7 13h10M7 16h10" />
    </svg>
  );
}

/** Pin — the room row. */
export function PinIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </svg>
  );
}

/** Person — the lecturer row. */
export function PersonIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M5 19.5c0-3.3 3.1-5.25 7-5.25s7 1.95 7 5.25" />
    </svg>
  );
}

/** Calendar — the schedule quick link. */
export function CalendarIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" />
      <path d="M3.5 9.5h17M8 3v4M16 3v4" />
    </svg>
  );
}

/** Bars — the grades quick link. */
export function ChartIcon({ className }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      <path d="M4 20V11M10 20V4M16 20v-6M22 20H2" />
    </svg>
  );
}
