import type { Palette } from '@/constants/theme';

export type MentionLevel = 'tresBien' | 'bien' | 'assezBien' | 'passable' | 'insuffisant';

export function getMentionLevel(score: number): MentionLevel {
  if (score >= 16) return 'tresBien';
  if (score >= 14) return 'bien';
  if (score >= 12) return 'assezBien';
  if (score >= 10) return 'passable';
  return 'insuffisant';
}

export function getMention(score: number | null, locale: 'fr' | 'ar' = 'fr'): string | null {
  if (score === null) return null;
  if (locale === 'ar') {
    if (score >= 16) return 'ممتاز';
    if (score >= 14) return 'جيد';
    if (score >= 12) return 'مستحسن';
    if (score >= 10) return 'مقبول';
    return 'غير كافٍ';
  }
  if (score >= 16) return 'Très Bien';
  if (score >= 14) return 'Bien';
  if (score >= 12) return 'Assez Bien';
  if (score >= 10) return 'Passable';
  return 'Insuffisant';
}

// On-gradient hero dots — sit on jade gradient in both themes, so not tokenized
const HERO_DOT: Record<MentionLevel, string> = {
  tresBien:    '#7DF3C4', // mint — on-gradient literal
  bien:        '#9CC7F5', // light blue — on-gradient literal
  assezBien:   '#FFD27D', // warm amber — on-gradient literal
  passable:    '#C7D2DB', // cool slate — on-gradient literal
  insuffisant: '#FFB4B4', // soft red — on-gradient literal
};

export function mentionColor(
  score: number,
  colors: Palette,
): { fg: string; bg: string; dot: string } {
  const level = getMentionLevel(score);
  const dot = HERO_DOT[level];
  switch (level) {
    case 'tresBien':    return { fg: colors.jadeText,  bg: colors.jadeFaint, dot };
    case 'bien':        return { fg: colors.blue,      bg: colors.blueBg,    dot };
    case 'assezBien':   return { fg: colors.warning,   bg: colors.amberBg,   dot };
    case 'passable':    return { fg: colors.slate,     bg: colors.slateBg,   dot };
    case 'insuffisant': return { fg: colors.danger,    bg: colors.dangerBg,  dot };
  }
}
