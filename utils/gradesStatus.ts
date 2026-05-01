export type SubjectStatus = 'valid' | 'at-risk';

export function getSubjectStatus(finale: number): SubjectStatus {
  return finale >= 10 ? 'valid' : 'at-risk';
}

export function getProgressFill(finale: number, trackWidth: number = 298): number {
  return Math.min((finale / 20) * trackWidth, trackWidth);
}
