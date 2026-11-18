import type { TranslationKey } from '@/lib/i18n-types';

/**
 * The four class types the schema defines — CM, TD, TP and EXAM.
 *
 * EXAM is in the enum (backend/prisma/schema.prisma) even though the seeded
 * timetables only use the first three. It is handled here rather than left to
 * fall through, because the one type a student most needs to pick out of a grid
 * is the one that is an exam.
 *
 * THE TYPE NO LONGER PICKS A COLOUR. A class is coloured by its SUBJECT, from
 * the mobile app's palette (lib/subject-colors.ts), so a subject looks the same
 * in the app and the PWA. The type is still written on every block and pill as
 * text, which is what §10 asks for: colour is never the only signal, and the
 * type is readable in greyscale, to a colour-blind student, and to a screen
 * reader.
 */
export type CourseType = 'CM' | 'TD' | 'TP' | 'EXAM';

const TYPE_LABELS: Record<CourseType, TranslationKey> = {
  CM: 'schedule.type.cm',
  TD: 'schedule.type.td',
  TP: 'schedule.type.tp',
  EXAM: 'schedule.type.exam',
};

/** Narrows the API's free-form `type` string, defaulting to the commonest. */
export function courseType(raw: string): CourseType {
  const upper = raw.toUpperCase();
  return upper === 'TD' || upper === 'TP' || upper === 'EXAM' ? upper : 'CM';
}

/** The long name, for the detail panel and for assistive tech. */
export function typeLabelKey(type: CourseType): TranslationKey {
  return TYPE_LABELS[type];
}
