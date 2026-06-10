import type { Palette } from './theme';

// ─── Subject color lookup (uses COURSE_PALETTE — jade excluded) ───────────────

const subjectColorCache = new Map<string, number>();

export function buildSubjectColorMap(subjects: { name: string; nameAr?: string | null }[]): void {
  subjectColorCache.clear();
  const unique = [...new Map(subjects.map((s) => [s.name, s])).values()]
    .sort((a, b) => a.name.localeCompare(b.name));
  unique.forEach(({ name, nameAr }, index) => {
    subjectColorCache.set(name, index);
    if (nameAr) subjectColorCache.set(nameAr, index);
  });
}

export function getSubjectColor(subjectName: string, isDark: boolean = false): { accent: string } {
  const cached = subjectColorCache.get(subjectName);
  if (cached !== undefined) return { accent: getCourseColor(cached, isDark) };

  let hash = 0;
  for (const c of subjectName) hash += c.charCodeAt(0);
  return { accent: getCourseColor(hash, isDark) };
}

export function getMentionColor(mention: string, colors: Palette): string {
  switch (mention) {
    case 'Très Bien':   return '#D1FAE5';
    case 'Bien':        return '#DBEAFE';
    case 'Assez Bien':  return '#FEF3C7';
    case 'Passable':    return '#FED7AA';
    case 'Insuffisant': return '#FEE2E2';
    default:            return colors.border;
  }
}

export function getMentionTextColor(mention: string, colors: Palette): string {
  switch (mention) {
    case 'Très Bien':   return '#059669';
    case 'Bien':        return '#2563EB';
    case 'Assez Bien':  return '#D97706';
    case 'Passable':    return '#EA580C';
    case 'Insuffisant': return '#DC2626';
    default:            return colors.textSecondary;
  }
}

export function getCategoryColor(category: string): { bg: string; text: string } {
  switch (category) {
    case 'official':
    case 'GRADES':
      return { bg: '#D1FAE5', text: '#059669' };
    case 'events':
    case 'Evenement':
    case 'SCHEDULE':
      return { bg: '#DBEAFE', text: '#2563EB' };
    case 'scolarite':
    case 'Scolarite':
    case 'ATTENDANCE':
      return { bg: '#FEF3C7', text: '#D97706' };
    case 'sport':
    case 'Sport':
      return { bg: '#FFE4E6', text: '#F43F5E' };
    case 'youth':
      return { bg: '#F3E8FF', text: '#8B5CF6' };
    case 'sponsors':
      return { bg: '#E0E7FF', text: '#6366F1' };
    case 'GENERAL':
    default:
      return { bg: '#F3F4F6', text: '#6B7280' };
  }
}

// ─── Course color palette ─────────────────────────────────────────────────────
// 12 named hues with light + dark variants. Jade is intentionally excluded so
// course accent rails never read as the "live/active" brand color.

export const COURSE_PALETTE = [
  { name: 'indigo',   light: '#6366F1', dark: '#8488F5' },
  { name: 'blue',     light: '#2F7DD1', dark: '#5AA0E6' },
  { name: 'sky',      light: '#1E94C4', dark: '#54B4DC' },
  { name: 'teal',     light: '#119A8B', dark: '#36BCAC' },
  { name: 'emerald',  light: '#2E9E5B', dark: '#4FC07D' },
  { name: 'lime',     light: '#6B9A2E', dark: '#93BE54' },
  { name: 'amber',    light: '#E08A1E', dark: '#F0A84B' },
  { name: 'orange',   light: '#E2673A', dark: '#F08A5F' },
  { name: 'rose',     light: '#E0556A', dark: '#F0808F' },
  { name: 'magenta',  light: '#D6519E', dark: '#E97FBE' },
  { name: 'violet',   light: '#8B5CF6', dark: '#A98BF0' },
  { name: 'slate',    light: '#5A6B7B', dark: '#9DB0BE' },
] as const;

export function getCourseColor(index: number, isDark: boolean): string {
  const entry = COURSE_PALETTE[index % COURSE_PALETTE.length];
  return isDark ? entry.dark : entry.light;
}

// ─── Notification category colors ────────────────────────────────────────────

export type NotifCategory = 'notes' | 'agenda' | 'presence' | 'actualites' | 'general';

export function getCategoryColors(
  category: NotifCategory,
  colors: any,
): { fg: string; bg: string } {
  switch (category) {
    case 'notes':      return { fg: colors.jadeText,  bg: colors.jadeFaint };
    case 'agenda':     return { fg: colors.blue,      bg: colors.blueBg };
    case 'presence':   return { fg: colors.warning,   bg: colors.amberBg };
    case 'actualites': return { fg: colors.exam,      bg: colors.examBg };
    case 'general':
    default:           return { fg: colors.slate ?? colors.textTertiary, bg: colors.slateBg ?? 'rgba(90,107,123,0.12)' };
  }
}

// ─── News category colors ─────────────────────────────────────────────────────

export function getNewsCategoryColors(
  category: string,
  colors: any,
): { fg: string; bg: string } {
  const lower = category.toLowerCase();
  if (lower.includes('officiel') || lower.includes('official'))  return { fg: colors.jadeText, bg: colors.jadeFaint };
  if (lower.includes('event') || lower.includes('événement'))    return { fg: colors.blue,     bg: colors.blueBg };
  if (lower.includes('scolarité') || lower.includes('académique')) return { fg: colors.warning, bg: colors.amberBg };
  return { fg: colors.exam, bg: colors.examBg };
}
