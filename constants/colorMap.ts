import type { Palette } from './theme';

type SubjectColorPair = { bg: string; accent: string };

const SUBJECT_PALETTE: SubjectColorPair[] = [
  { bg: '#E8F5F0', accent: '#1D9E75' },
  { bg: '#DBEAFE', accent: '#3B82F6' },
  { bg: '#F3E8FF', accent: '#8B5CF6' },
  { bg: '#FEF3C7', accent: '#F59E0B' },
  { bg: '#FEE2E2', accent: '#EF4444' },
  { bg: '#E0E7FF', accent: '#6366F1' },
  { bg: '#D1FAE5', accent: '#10B981' },
  { bg: '#FFE4E6', accent: '#F43F5E' },
  { bg: '#CFFAFE', accent: '#06B6D4' },
  { bg: '#FFEDD5', accent: '#F97316' },
  { bg: '#ECFCCB', accent: '#84CC16' },
  { bg: '#F1F5F9', accent: '#64748B' },
];

const subjectColorCache = new Map<string, SubjectColorPair>();

export function buildSubjectColorMap(subjects: { name: string; nameAr?: string | null }[]): void {
  subjectColorCache.clear();
  const unique = [...new Map(subjects.map((s) => [s.name, s])).values()]
    .sort((a, b) => a.name.localeCompare(b.name));
  unique.forEach(({ name, nameAr }, index) => {
    const color = SUBJECT_PALETTE[index % SUBJECT_PALETTE.length];
    subjectColorCache.set(name, color);
    if (nameAr) subjectColorCache.set(nameAr, color);
  });
}

export function getSubjectColor(subjectName: string): SubjectColorPair {
  const cached = subjectColorCache.get(subjectName);
  if (cached) return cached;

  let hash = 0;
  for (const c of subjectName) hash += c.charCodeAt(0);
  return SUBJECT_PALETTE[hash % SUBJECT_PALETTE.length];
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
