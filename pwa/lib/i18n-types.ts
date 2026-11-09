import ar from '@/locales/ar.json';
import fr from '@/locales/fr.json';
import type { PluralCategory } from '@/lib/i18n-shared';

/**
 * Compile-time enforcement that the two locale files hold exactly the same keys.
 *
 * Half-translated screens have been a recurring bug on this project: a key gets
 * added to fr.json during a feature, ar.json is updated "later", and the Arabic
 * build ships raw key names to students. Review does not reliably catch it
 * because the diff looks complete. So the guard is structural rather than
 * procedural — a mismatched pair cannot compile, let alone deploy.
 *
 * French is the reference: it is the default language, and it is the one the
 * spec quotes verbatim. Arabic must match it exactly.
 *
 * The two annotations below are the whole mechanism, and both directions are
 * needed:
 *
 *   • `arMessages: typeof fr` fails when ar.json is MISSING a key fr.json has —
 *     the Arabic object is not assignable to the French shape.
 *   • `frMessages: typeof ar` fails when ar.json has an EXTRA key fr.json lacks
 *     — the French object is then the one missing a property.
 *
 * A one-directional check would let dead keys accumulate in ar.json unnoticed.
 * The errors name the offending property and file, so the fix is obvious.
 */
export const arMessages: typeof fr = ar;
export const frMessages: typeof ar = fr;

/** The message tree's shape, taken from French. */
export type TranslationTree = typeof fr;

/**
 * A plural message: an object with exactly the six CLDR categories, all strings.
 *
 * All six, in BOTH locale files, even though French never reaches `two` or
 * `few` (Intl gives one / many / other, `many` only for exact millions, plus
 * the zero override in pluralCategory). The shape guard above
 * compares fr and ar structurally in both directions, so Arabic's six keys force
 * the same six in French. Keeping the guard strict is worth the unused rows.
 */
export type PluralForms = Record<PluralCategory, string>;

/**
 * True only for an object whose keys are exactly the six categories with string
 * values. An object with the six plus anything else is NOT a plural message; it
 * is an ordinary subtree, and its leaves stay reachable through t().
 */
type IsPluralForms<V> = V extends PluralForms
  ? [Exclude<keyof V, PluralCategory>] extends [never]
    ? true
    : false
  : false;

/**
 * Every string leaf path in the tree, as a dotted string: 'login.title',
 * 'login.errors.locked'. Only leaves are valid — 'login.errors' is an object,
 * not a string, and is correctly rejected.
 *
 * A plural message is neither a leaf nor descended into: t('x.near') and
 * t('x.near.zero') both fail to compile. Plurals go through PluralKey.
 */
type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? K
    : IsPluralForms<T[K]> extends true
      ? never
      : `${K}.${LeafPaths<T[K]>}`;
}[keyof T & string];

/** Every dotted path whose value is a plural message, and nothing else. */
type PluralPaths<T> = {
  [K in keyof T & string]: T[K] extends string
    ? never
    : IsPluralForms<T[K]> extends true
      ? K
      : `${K}.${PluralPaths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = LeafPaths<TranslationTree>;

/**
 * Keys accepted by the plural function, and only by it. Disjoint from
 * TranslationKey by construction. `never` until a locale file holds a plural
 * message.
 */
export type PluralKey = PluralPaths<TranslationTree>;

/** Values substituted into `{{placeholders}}`. */
export type TranslationParams = Record<string, string | number>;
