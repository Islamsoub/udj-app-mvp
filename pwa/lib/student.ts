import type { TranslationKey } from '@/lib/i18n-types';

/**
 * Display helpers for the student's own record, shared by the topbar avatar, the
 * dashboard greeting and the profile card so the three cannot spell the same
 * student two ways.
 */

/** Programme level (the Prisma ProgrammeLevel enum) to its label key. */
const LEVEL_KEY: Record<string, TranslationKey> = {
  DUT: 'profile.level.dut',
  LICENCE: 'profile.level.licence',
  MASTER: 'profile.level.master',
  DOCTORAT: 'profile.level.doctorat',
};

/** The label key for a level, or null for one this build does not know. */
export function levelKeyFor(level: string): TranslationKey | null {
  return LEVEL_KEY[level] ?? null;
}

/**
 * Zero-width non-joiner. Placed between two Arabic initials so they stay two
 * letters: without it, "محمد أحمد" gives م + أ, which is harmless, but most
 * pairs (م + ح, س + ع) would join into one connected shape and stop reading as
 * initials at all. It is invisible, and it has no effect between Latin letters.
 */
const ZWNJ = '‌';

/** First character of a name, as a whole code point — never half a surrogate. */
function firstLetter(name: string): string {
  return Array.from(name.normalize('NFC').trim())[0] ?? '';
}

/**
 * First letter of the first name plus first letter of the last name, upper-cased.
 * Empty when neither name has a letter — the caller then shows the placeholder
 * glyph instead of an empty circle.
 *
 * Direction is NOT handled here. The caller renders this inside a <bdi>, which
 * lets the string take its own script's direction: Latin initials stay "AM" on
 * an Arabic page, and Arabic initials read right to left as Arabic does. Forcing
 * dir="ltr" instead would draw Arabic initials last-name-first.
 */
export function initialsOf(firstName: string, lastName: string): string {
  const letters = [firstLetter(firstName), firstLetter(lastName)].filter(Boolean);
  return letters.map((letter) => letter.toLocaleUpperCase()).join(ZWNJ);
}
