// ─── Light palette ────────────────────────────────────────────────────────────

export interface Palette {
  bgDeep: string;
  bgPrimary: string;
  bgSurface: string;
  bgCard: string;
  jadePrimary: string;
  borderLight: string;
  skeleton: string;

  jade50: string;
  jade100: string;
  jade200: string;
  jade300: string;
  jade400: string;
  jade600: string;
  jade900: string;
  jadeDM: string;

  warning: string;
  danger: string;
  info: string;
  exam: string;
  offline: string;
  success: string;

  background: string;
  surface: string;
  surface2: string;
  border: string;
  hair: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  jadeFaint: string;
  jadeText: string;

  dmBgDeep: string;
  dmBgPrimary: string;
  dmSurface: string;
  dmCard: string;

  jade75: string;
  infoLight: string;
  offlineBg: string;
  dangerLight: string;
  connectorLine: string;
  greyMuted: string;
  scheduleBorder: string;
  mentionBien: string;
  offlineText: string;

  skeletonBase: string;
  skeletonHighlight: string;

  newsHeaderBorder: string;
  urgentPillBg: string;
  newsOfflineBg: string;
  warningLight: string;
  warningBorder: string;
  newsNotifBg: string;
  greyMedium: string;

  // Base neutrals — only ever used through withAlpha() for overlays/scrims,
  // or as solid fills where a true white/black is required.
  white: string;
  black: string;

  // Decorative fills (skeleton blocks + empty/error/modal state icon circles)
  skeletonBox: string;
  errorCircleBg: string;
  examCircleBg: string;

  // Category accent colors + tinted backgrounds
  blue: string;
  slate: string;
  blueBg: string;
  amberBg: string;
  examBg: string;
  slateBg: string;
  dangerBg: string;
}

export const lightColors: Palette = {
  // Aliases / new semantic surface tokens (Phase 1 dark-mode infra)
  bgDeep: '#0D1512',
  bgPrimary: '#F5F7F6',
  bgSurface: '#FFFFFF',
  bgCard: '#FFFFFF',
  jadePrimary: '#1D9E75',
  borderLight: '#E8ECE9',
  skeleton: '#E8ECE9',

  // Jade green palette
  jade50: '#E6F7F1',
  jade100: '#B3E4D3',
  jade200: '#7FCEAF',
  jade300: '#3FB88E',
  jade400: '#1D9E75',
  jade600: '#0F6E56',
  jade900: '#0A3D2E',
  jadeDM: '#2ECC96',

  // Semantic
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  exam: '#8B5CF6',
  offline: '#F97316',
  success: '#1D9E75',

  // Light mode surfaces
  background: '#F2F5F3',
  surface: '#FFFFFF',
  surface2: '#F4F7F5',
  border: '#E8ECE9',
  hair: 'rgba(28, 35, 32, 0.07)',
  textPrimary: '#1C2320',
  textSecondary: '#6B7B74',
  textTertiary: '#9EADA7',
  jadeFaint: 'rgba(29, 158, 117, 0.10)',
  jadeText: '#1D9E75',

  // Dark mode surface raw values (kept for backward compat — still referenced
  // from older code as colors.dmBgDeep etc.)
  dmBgDeep: '#0D1512',
  dmBgPrimary: '#141E1A',
  dmSurface: '#1C2B26',
  dmCard: '#243328',

  // Extended tokens
  jade75: '#D1F0E2',
  infoLight: '#EFF6FF',
  offlineBg: '#FEF3EC',
  dangerLight: '#FECACA',
  connectorLine: '#C7CDCB',
  greyMuted: '#C7CDCB',
  scheduleBorder: '#D9D9D9',
  mentionBien: 'rgb(99,200,168)',
  offlineText: '#9A3412',

  // Skeleton shimmer — neutral grey, no jade tint
  skeletonBase: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',

  // News-specific tokens
  newsHeaderBorder: '#AE9292',
  urgentPillBg: 'rgba(217,217,217,0.5)',
  newsOfflineBg: '#F6EAE0',
  warningLight: 'rgba(245,158,11,0.2)',
  warningBorder: '#FFA629',
  newsNotifBg: '#E1F5F0',
  greyMedium: '#757575',

  white: '#FFFFFF',
  black: '#000000',
  skeletonBox: '#D9D9D9',
  errorCircleBg: '#F5B4B4',
  examCircleBg: '#E0D3FE',

  // Category accent colors + tinted backgrounds
  blue: '#2F7DD1',
  slate: '#5A6B7B',
  blueBg: 'rgba(47, 125, 209, 0.12)',
  amberBg: 'rgba(224, 138, 30, 0.12)',
  examBg: 'rgba(139, 92, 246, 0.12)',
  slateBg: 'rgba(90, 107, 123, 0.12)',
  dangerBg: 'rgba(239, 68, 68, 0.10)',
};

// ─── Dark palette ─────────────────────────────────────────────────────────────
// Mirrors every key in lightColors so screens migrated to useColors() can swap
// palettes without touching identifiers.

export const darkColors: Palette = {
  // Aliases / new semantic surface tokens
  bgDeep: '#0D1512',
  bgPrimary: '#141E1A',
  bgSurface: '#1C2B26',
  bgCard: '#243328',
  jadePrimary: '#2BB989',
  borderLight: '#1F2E28',
  skeleton: '#1F3029',

  // Jade — brand stays recognizable; bright tints get dark equivalents so
  // tag/pill backgrounds remain readable on dark surfaces.
  jade50: '#0D1F18',
  jade100: '#112A20',
  jade200: '#1A3D2E',
  jade300: '#1A4D3A',
  jade400: '#2ECC96',
  jade600: '#1D9E75',
  jade900: '#0A3D2E',
  jadeDM: '#2ECC96',

  // Semantic — same hues; light variants get dark backgrounds below
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
  exam: '#8B5CF6',
  offline: '#F97316',
  success: '#2ECC96',

  // Surfaces (dark)
  background: '#0E1512',
  surface: '#17211D',
  surface2: '#1E2A25',
  border: '#2A3D36',
  hair: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#ECF1EE',
  textSecondary: '#9DB0A8',
  textTertiary: '#6E847B',
  jadeFaint: 'rgba(43, 185, 137, 0.16)',
  jadeText: '#5FD3A6',

  // Raw dm tokens — same values whether the active palette is light or dark
  dmBgDeep: '#0D1512',
  dmBgPrimary: '#141E1A',
  dmSurface: '#1C2B26',
  dmCard: '#243328',

  // Extended tokens — dark equivalents
  jade75: '#1A3D2E',
  infoLight: '#0F1A2A',
  offlineBg: '#2A1F0A',
  dangerLight: '#2A0F0F',
  connectorLine: '#2A3D36',
  greyMuted: '#2A3D36',
  scheduleBorder: '#2A3D36',
  mentionBien: 'rgb(99,200,168)',
  offlineText: '#F97316',

  skeletonBase: '#1F3029',
  skeletonHighlight: '#2A3D36',

  newsHeaderBorder: '#2A3D36',
  urgentPillBg: 'rgba(217,217,217,0.5)',
  newsOfflineBg: '#2A1F0A',
  warningLight: 'rgba(245,158,11,0.2)',
  warningBorder: '#FFA629',
  newsNotifBg: '#0D1F18',
  greyMedium: '#8FA89E',

  white: '#FFFFFF',
  black: '#000000',
  skeletonBox: '#2A3D36',
  errorCircleBg: '#F5B4B4',
  examCircleBg: '#E0D3FE',

  // Category accent colors + tinted backgrounds
  blue: '#5AA0E6',
  slate: '#9DB0BE',
  blueBg: 'rgba(90, 160, 230, 0.18)',
  amberBg: 'rgba(240, 168, 75, 0.16)',
  examBg: 'rgba(169, 139, 240, 0.18)',
  slateBg: 'rgba(157, 176, 190, 0.16)',
  dangerBg: 'rgba(255, 107, 107, 0.15)',
};



// Backward-compat alias — screens still import `colors` until Phase 2.
export const colors = lightColors;

/**
 * Apply an alpha channel to a 6-digit hex color, returning an 8-digit
 * #RRGGBBAA string. Centralizes alpha so components never concatenate raw
 * hex suffixes (e.g. `colors.jade400 + '26'`) or hand-write rgba() literals.
 *
 * @param color 6-digit hex (e.g. '#1D9E75')
 * @param alpha 0–1 opacity (e.g. 0.15)
 */
export function withAlpha(color: string, alpha: number): string {
  const hex = Math.round(alpha * 255).toString(16).padStart(2, '0');
  return color + hex;
}

export const spacing = {
  sp2: 2,
  sp4: 4,
  sp6: 6,
  sp8: 8,
  sp12: 12,
  sp14: 14,
  sp16: 16,
  sp20: 20,
  sp24: 24,
  sp32: 32,
  sp48: 48,
  sp64: 64,
} as const;

// Fixed component dimensions that recur across screens. touchTarget is the
// 44x44 minimum tappable size mandated by the design system.
export const sizing = {
  touchTarget: 44,
  avatarSm: 32,
  avatarMd: 48,
  avatarLg: 64,
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
} as const;

export const radius = {
  rSm: 8,
  rMd: 12,
  rLg: 12,
  rXl: 16,
  rTile: 18,
  rHero: 22,
  r2xl: 24,
  rBtn: 14,
  rFull: 9999,
} as const;

export const fonts = {
  sans: 'PlusJakartaSans',
  arabic: 'NotoNaskhArabic',
  mono: 'DMmono',
} as const;

export const typographyFR = {
  h1: {
    fontSize: 28,
    fontWeight: '800' as const,
    lineHeight: 32,
    letterSpacing: -0.02 * 28,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700' as const,
    lineHeight: 26,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600' as const,
    lineHeight: 23,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  bodySm: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 19,
  },
  caption: {
    fontSize: 11,
    fontWeight: '500' as const,
    letterSpacing: 0.02 * 11,
  },
  label: {
    fontSize: 10,
    fontWeight: '600' as const,
    letterSpacing: 0.1 * 10,
    textTransform: 'uppercase' as const,
  },
  numberGpa: {
    fontSize: 36,
    fontWeight: '800' as const,
    lineHeight: 36,
    letterSpacing: -0.03 * 36,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  mono: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: 'DMmono',
  },
} as const;

export const typographyAR = {
  h1: {
    fontSize: 30,
    fontWeight: '700' as const,
    lineHeight: 39,
    letterSpacing: -0.02 * 30,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    lineHeight: 32,
  },
  h3: {
    fontSize: 19,
    fontWeight: '600' as const,
    lineHeight: 27,
  },
  body: {
    fontSize: 15,
    fontWeight: '400' as const,
    lineHeight: 27,
  },
  bodySm: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  caption: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  label: {
    fontSize: 13,
    fontWeight: '400' as const,
    lineHeight: 22,
  },
  numberGpa: {
    fontSize: 36,
    fontWeight: '800' as const,
    lineHeight: 36,
    letterSpacing: -0.03 * 36,
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  mono: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: 'DMmono',
  },
} as const;

export const elevation = {
  card: {
    shadowColor: '#1C2320',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  cardLg: {
    shadowColor: '#1C2320',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 18,
    elevation: 4,
  },
  navFloat: {
    shadowColor: '#0F6E56',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 22,
    elevation: 8,
  },
  sheet: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 30,
    elevation: 12,
  },
} as const;

export const scrimColor = 'rgba(16, 22, 20, 0.45)';

export const theme = {
  colors,
  spacing,
  sizing,
  radius,
  elevation,
  fonts,
  typographyFR,
  typographyAR,
} as const;

export default theme;
