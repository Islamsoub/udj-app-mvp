export type SubjectStatus = 'valid' | 'at-risk';

export function getSubjectStatus(finale: number): SubjectStatus {
  return finale >= 10 ? 'valid' : 'at-risk';
}
