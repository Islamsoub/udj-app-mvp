/**
 * Profile tile glyphs — stroke-only, 17px in a 34px tile (.tile-icon svg),
 * coloured by `currentColor`. The prototype's paths where it has one (person,
 * info, calendar, mail, logout, the storage rows); the others drawn on the same
 * 24-unit grid and stroke.
 */

type IconProps = { className?: string };

const strokeProps = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

function Svg({ className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" {...strokeProps}>
      {children}
    </svg>
  );
}

/** Filière — the prototype's person. */
export const PersonIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
  </Svg>
);

/** Niveau — a mortarboard. */
export const CapIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M2.5 9.5 12 5l9.5 4.5L12 14 2.5 9.5Z" />
    <path d="M6.5 11.5V16c1.6 1.4 3.4 2 5.5 2s3.9-.6 5.5-2v-4.5" />
  </Svg>
);

/** Semestre — the prototype's calendar. */
export const CalendarIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Svg>
);

/** Faculté — the prototype's info circle. */
export const InfoIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8h.01M12 12v4" />
  </Svg>
);

/** E-mail — the prototype's envelope. */
export const MailIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3 7 9 6 9-6" />
  </Svg>
);

/** Statut (shown only when not "inscrit") — a flag. */
export const FlagIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M5 21V4M5 4h11l-2 4 2 4H5" />
  </Svg>
);

/** Moyenne — a rising line. */
export const ChartIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 19h16" />
    <path d="m5 15 4-4 3 3 7-7" />
  </Svg>
);

/** Crédits du semestre — the prototype's document (Notes row). */
export const DocumentIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M4 4h12l4 4v12H4z" />
    <path d="M8 12h8M8 16h5" />
  </Svg>
);

/** Crédits du cursus — stacked layers. */
export const LayersIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="m12 4 9 4.5-9 4.5-9-4.5L12 4Z" />
    <path d="m3 13 9 4.5 9-4.5" />
  </Svg>
);

/** Présence, Horaires — the prototype's clock. */
export const ClockIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 3" />
  </Svg>
);

/** Téléphone. */
export const PhoneIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1Z" />
  </Svg>
);

/** Adresse — a map pin. */
export const PinIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Svg>
);

/** Se déconnecter — the prototype's door and arrow. */
export const LogoutIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="M16 17l5-5-5-5" />
    <path d="M21 12H9" />
  </Svg>
);

/** Garder mes données hors ligne — a device with a download arrow. */
export const OfflineIcon = ({ className }: IconProps) => (
  <Svg className={className}>
    <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
    <path d="M12 7.5v6m0 0 2.5-2.5M12 13.5 9.5 11" />
  </Svg>
);
