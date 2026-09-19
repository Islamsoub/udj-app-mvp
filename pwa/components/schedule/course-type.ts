import type { TranslationKey } from '@/lib/i18n-types';
import styles from './schedule.module.css';

/**
 * The four class types the schema defines — CM, TD, TP and EXAM.
 *
 * EXAM is in the enum (backend/prisma/schema.prisma) even though the seeded
 * timetables only use the first three. It is handled here rather than left to
 * fall through unstyled, because the one type a student most needs to pick out
 * of a grid at a glance is the one that is an exam.
 *
 * §10: "Status colors are never the only signal — always paired with a label or
 * icon." Every block therefore carries its type as TEXT as well as a colour, so
 * the grid is still readable in greyscale, to a colour-blind student, and to a
 * screen reader.
 */
export type CourseType = 'CM' | 'TD' | 'TP' | 'EXAM';

/**
 * Existing semantic tokens only — no new colours were introduced for this.
 *
 *   CM   -> --info    a lecture, the neutral default of the timetable
 *   TD   -> --jade    tutorials, on the brand colour
 *   TP   -> --warning lab work, which needs a room and kit and is worth spotting
 *   EXAM -> --exam    the token that exists for exactly this
 *
 * The pairing is not arbitrary: --exam was defined for exam slots, and the other
 * three are the remaining semantic hues, assigned so the commonest type (CM)
 * takes the quietest.
 */
const TYPE_CLASS: Record<CourseType, string> = {
  CM: styles.typeCm,
  TD: styles.typeTd,
  TP: styles.typeTp,
  EXAM: styles.typeExam,
};

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

export function typeClass(type: CourseType): string {
  return TYPE_CLASS[type];
}

/** The long name, for the detail panel and for assistive tech. */
export function typeLabelKey(type: CourseType): TranslationKey {
  return TYPE_LABELS[type];
}
