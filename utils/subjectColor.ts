const PALETTE = ['#3B82F6', '#8B5CF6', '#0F6E56', '#F59E0B', '#EF4444'];

export function subjectColor(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return PALETTE[h % PALETTE.length];
}
