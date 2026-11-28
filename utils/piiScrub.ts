// Pure helpers for services/sentry.ts — no React Native imports, so the tests
// run under plain node.
//
// CLAUDE.md (security, P0): no student ID, name or grade in error reports.
// sentry.ts already removes matricules, bearer tokens and JWTs by pattern. Names
// and grades cannot be matched by pattern — any capitalised word could be a
// name, any number a grade — so they are handled by what IS known instead:
//   - names: the signed-in student's own first and last name, matched exactly;
//   - grades: values stored under keys that only ever hold marks.

export const REDACTED = '[redacted]';

// Too short a part ("Al", "Ou") would match inside ordinary words and stack
// frames; such a part stays covered by the full name.
const MIN_PART = 3;

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * One regex for the full name and each part of it, longest first so "Ahmed
 * Omar Said" is replaced whole before "Omar" alone. Unicode-aware boundaries:
 * \b only knows ASCII letters, and these names may carry accents or Arabic.
 * Returns null when there is nothing to match.
 */
export function buildNameMatcher(firstName?: string | null, lastName?: string | null): RegExp | null {
  const full = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (!full) return null;
  const parts = full.split(/\s+/).filter((p) => p.length >= MIN_PART);
  const all = Array.from(new Set([full, ...parts])).sort((a, b) => b.length - a.length);
  return new RegExp(`(?<![\\p{L}\\p{N}])(?:${all.map(escape).join('|')})(?![\\p{L}\\p{N}])`, 'giu');
}

export function redactNames(value: string, matcher: RegExp | null): string {
  if (!matcher) return value;
  matcher.lastIndex = 0;
  return value.replace(matcher, REDACTED);
}

// Keys that only ever carry marks or averages in this app's data: the SQLite
// grades columns (cc_score, exam_score, final_score), the API's camelCase
// (ccScore, examScore, finalScore, average, gpa) and the GPA history.
const GRADE_KEY_RE = /^(?:cc_?score|exam_?score|final_?score|score|scores|grade|grades|gpa|average|averages|moyenne|semester_?average)$/i;

export function isGradeKey(key: string): boolean {
  return GRADE_KEY_RE.test(key);
}
