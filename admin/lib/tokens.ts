/**
 * Design tokens as TypeScript constants — mirrors styles/globals.css exactly.
 * Use these when a color must be passed as a JS value (Recharts fills, inline
 * SVG strokes, course palette…). For styling, prefer the Tailwind utilities
 * (bg-surface, text-ink2, …) which resolve to the same CSS variables.
 *
 * Source: implementation spec §2–4 (verbatim prototype values).
 */
export const C = {
  // Surfaces & text
  bg: '#EEF2F0',
  surface: '#FFFFFF',
  surface2: '#F4F7F5',
  sunken: '#ECF0ED',
  ink: '#1C2320',
  ink2: '#5E6E66',
  ink3: '#93A39B',
  hair: 'rgba(28, 35, 32, 0.08)',
  hair2: 'rgba(28, 35, 32, 0.13)',

  // Jade brand
  jade: '#1D9E75',
  jade6: '#0F6E56',
  jade7: '#0B5544',
  jade9: '#0A3D2E',
  jade50: '#E6F7F1',
  jade100: '#C9ECDF',
  jadeFaint: 'rgba(29, 158, 117, 0.10)',
  jadeFaint2: 'rgba(29, 158, 117, 0.16)',
  jadeText: '#0F6E56',

  // Status accents
  amber: '#D9821A',
  amberBg: 'rgba(217, 130, 26, 0.12)',
  danger: '#E1483D',
  dangerBg: 'rgba(225, 72, 61, 0.10)',
  blue: '#2F7DD1',
  blueBg: 'rgba(47, 125, 209, 0.12)',
  exam: '#7C53E0',
  examBg: 'rgba(124, 83, 224, 0.12)',
  slate: '#5A6B7B',
  slateBg: 'rgba(90, 107, 123, 0.12)',

  // Sidebar (dark jade)
  sideBg: '#0A3D2E',
  sideBg2: '#0E4A38',
  sideText: '#E6F7F1',
  sideMuted: '#7FB6A2',
  sideHair: 'rgba(255, 255, 255, 0.09)',
  sideActive: '#1D9E75',
  sideActiveFill: 'rgba(29, 158, 117, 0.18)',

  // Misc
  toggleOff: '#D5DCD8',
  scrim: 'rgba(16, 22, 20, 0.45)',

  // Shadows
  shadow: '0 1px 2px rgba(28, 35, 32, 0.05), 0 4px 14px rgba(28, 35, 32, 0.05)',
  shadowLg: '0 8px 28px rgba(28, 35, 32, 0.10), 0 2px 6px rgba(28, 35, 32, 0.05)',
  shadowSide: '0 8px 30px rgba(10, 61, 46, 0.18)',
  shadowModal: '0 24px 60px rgba(10, 30, 22, 0.30)',
} as const;

/** Course palette — schedule blocks (impl spec §9, 12 colors). */
export const COURSE_PALETTE = [
  '#6366F1',
  '#2F7DD1',
  '#1E94C4',
  '#119A8B',
  '#2E9E5B',
  '#6B9A2E',
  '#D9821A',
  '#E2673A',
  '#E0556A',
  '#D6519E',
  '#7C53E0',
  '#5A6B7B',
] as const;

export type Tone = 'jade' | 'danger' | 'amber' | 'blue' | 'exam' | 'slate';

/** [foreground, background] pair per tone (impl spec §5 Badge). */
export const TONE_COLORS: Record<Tone, [string, string]> = {
  jade: [C.jadeText, 'rgba(29, 158, 117, 0.12)'],
  danger: ['#B3392F', 'rgba(225, 72, 61, 0.12)'],
  amber: ['#9A5B06', 'rgba(217, 130, 26, 0.14)'],
  blue: ['#1F5FA6', 'rgba(47, 125, 209, 0.12)'],
  exam: ['#6034C9', 'rgba(124, 83, 224, 0.14)'],
  slate: ['#46535F', 'rgba(90, 107, 123, 0.14)'],
};
