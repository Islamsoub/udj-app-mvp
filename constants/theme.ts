export const colors = {
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
  background: '#F5F7F6',
  surface: '#FFFFFF',
  border: '#E8ECE9',
  textPrimary: '#1C2320',
  textSecondary: '#6B7B74',
  textTertiary: '#9EADA7',

  // Dark mode surfaces
  dmBgDeep: '#0D1512',
  dmBgPrimary: '#141E1A',
  dmSurface: '#1C2B26',
  dmCard: '#243328',

  // Extended tokens
  jade75: '#D1F0E2',     // "En cours" status pill bg
  infoLight: '#EFF6FF',  // "À venir" status pill bg
  offlineBg: '#FEF3EC',  // offline banner / cache banner bg
  dangerLight: '#FECACA', // error state icon circle bg
  connectorLine: '#C7CDCB', // timeline connector dot/line
  greyMuted: '#C7CDCB',    // past-status accent bar

  // Skeleton shimmer — neutral grey, no jade tint
  skeletonBase: '#E5E7EB',
  skeletonHighlight: '#F3F4F6',
} as const;

export const spacing = {
  sp2: 2,
  sp4: 4,
  sp6: 6,
  sp8: 8,
  sp12: 12,
  sp16: 16,
  sp20: 20,
  sp24: 24,
  sp32: 32,
  sp48: 48,
  sp64: 64,
} as const;

export const radius = {
  rSm: 6,
  rMd: 8,
  rLg: 12,
  rXl: 16,
  r2xl: 20,
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

export const theme = {
  colors,
  spacing,
  radius,
  fonts,
  typographyFR,
  typographyAR,
} as const;

export default theme;
