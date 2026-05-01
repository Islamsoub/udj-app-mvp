export function getMention(gpa: number | null): string | null {
  if (gpa === null) return null;
  if (gpa < 10) return 'Ajourné';
  if (gpa < 12) return 'Passable';
  if (gpa < 14) return 'Assez Bien';
  if (gpa < 16) return 'Bien';
  if (gpa < 18) return 'Très Bien';
  return 'Félicitations';
}
