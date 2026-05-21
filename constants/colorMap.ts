import { colors } from './theme';

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
];

export function getSubjectColor(subjectName: string): SubjectColorPair {
  let hash = 0;
  for (const c of subjectName) hash += c.charCodeAt(0);
  return SUBJECT_PALETTE[hash % 8];
}

export function getMentionColor(mention: string): string {
  switch (mention) {
    case 'Très Bien':   return '#D1FAE5';
    case 'Bien':        return '#DBEAFE';
    case 'Assez Bien':  return '#FEF3C7';
    case 'Passable':    return '#FED7AA';
    case 'Insuffisant': return '#FEE2E2';
    default:            return colors.border;
  }
}

export function getMentionTextColor(mention: string): string {
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
