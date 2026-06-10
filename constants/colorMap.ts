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
  const lower = (category || '').toLowerCase();
  if (lower === 'official' || lower.includes('officiel') || lower === 'رسمي')
    return { fg: colors.jadeText, bg: colors.jadeFaint };
  if (lower === 'events' || lower.includes('événement') || lower.includes('event') || lower === 'فعاليات')
    return { fg: colors.blue, bg: colors.blueBg };
  if (lower === 'scolarite' || lower.includes('scolarité') || lower.includes('académique') || lower === 'الدراسة')
    return { fg: colors.warning, bg: colors.amberBg };
  if (lower.includes('sport') || lower === 'رياضة')
    return { fg: colors.exam, bg: colors.examBg };
  if (lower === 'youth' || lower.includes('jeunesse') || lower === 'شباب')
    return { fg: colors.slate, bg: colors.slateBg };
  if (lower.includes('sponsor') || lower === 'شركاء')
    return { fg: colors.slate, bg: colors.slateBg };
  return { fg: colors.slate, bg: colors.slateBg };
}
