/**
 * What counts as an earned credit — the one definition, for every student-facing
 * figure.
 *
 * A credit is earned when the subject's FINAL RESULT IS PUBLISHED AND PASSING.
 * `isValidated` records the passing half; it is not enough on its own, because a
 * row can carry it before the student has been shown the result (seeded and
 * imported rows do). Counting those reported credits as earned for subjects
 * whose marks the student had never seen, and made the dashboard disagree with
 * the grades screen, which was already gating on publication.
 *
 * This does not change what validation means or how it is written — see
 * routes/admin/grades.ts for that. It only decides what is counted.
 */

/** The fields a grade row must be read with for the credit test to apply. */
export interface CreditGrade {
  isValidated: boolean;
  publishedNfAt: Date | null;
  subject: { credits: number };
}

export function isCreditEarned(grade: Pick<CreditGrade, 'isValidated' | 'publishedNfAt'>): boolean {
  return grade.publishedNfAt !== null && grade.isValidated;
}

/** Credits earned across a set of grades. */
export function earnedCredits(grades: readonly CreditGrade[]): number {
  return grades.filter(isCreditEarned).reduce((sum, g) => sum + g.subject.credits, 0);
}
