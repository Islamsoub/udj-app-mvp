import ar from '@/locales/ar.json';
import fr from '@/locales/fr.json';

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
 * Every leaf path in the tree, as a dotted string: 'login.title',
 * 'login.errors.locked'. Only leaves are valid — 'login.errors' is an object,
 * not a string, and is correctly rejected.
 */
type LeafPaths<T> = {
  [K in keyof T & string]: T[K] extends string ? K : `${K}.${LeafPaths<T[K]>}`;
}[keyof T & string];

export type TranslationKey = LeafPaths<TranslationTree>;

/** Values substituted into `{{placeholders}}`. */
export type TranslationParams = Record<string, string | number>;
