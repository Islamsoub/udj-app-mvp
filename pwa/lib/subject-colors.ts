import type { CSSProperties } from 'react';

/**
 * One colour per subject, the SAME colour the mobile app gives it.
 *
 * SOURCE OF TRUTH: constants/colorMap.ts at the repo root (COURSE_PALETTE,
 * buildSubjectColorMap, getSubjectColor). The palette and the assignment rule
 * below are copies of it, and the two must change together. A student who opens
 * the app and the PWA side by side sees "Algorithmique" in one colour in both,
 * or the copy has drifted.
 *
 * The rule, as the app applies it:
 *   1. Input: the semester's full schedule (the app's schedule and home screens
 *      both build from every cached entry, not one week or one day).
 *   2. Unique French subject names, sorted with localeCompare.
 *   3. Index 0, 1, 2... into the 12-hue palette, wrapping with `% 12`.
 *   4. A name not in the map falls back to the sum of its characters' codes.
 *
 * The app calls localeCompare without a locale, so its order follows the
 * device's. Here 'fr' is passed explicitly so the order cannot depend on the
 * browser's language. For Latin subject names, ICU's French and root collations
 * agree, which is what an Android device in French or Arabic uses.
 *
 * Pure functions, no module-level cache: the app keeps a mutable singleton map,
 * which works there because one screen at a time rebuilds it. In the PWA the
 * dashboard and the schedule screen can render together, so each derives its own
 * map from the same input and gets the same answer.
 */

// ── The palette (copied from constants/colorMap.ts, COURSE_PALETTE) ──────────

export const COURSE_PALETTE = [
  { name: 'indigo', light: '#6366F1', dark: '#8488F5' },
  { name: 'blue', light: '#2F7DD1', dark: '#5AA0E6' },
  { name: 'sky', light: '#1E94C4', dark: '#54B4DC' },
  { name: 'teal', light: '#119A8B', dark: '#36BCAC' },
  { name: 'emerald', light: '#2E9E5B', dark: '#4FC07D' },
  { name: 'lime', light: '#6B9A2E', dark: '#93BE54' },
  { name: 'amber', light: '#E08A1E', dark: '#F0A84B' },
  { name: 'orange', light: '#E2673A', dark: '#F08A5F' },
  { name: 'rose', light: '#E0556A', dark: '#F0808F' },
  { name: 'magenta', light: '#D6519E', dark: '#E97FBE' },
  { name: 'violet', light: '#8B5CF6', dark: '#A98BF0' },
  { name: 'slate', light: '#5A6B7B', dark: '#9DB0BE' },
] as const;

export type CourseHueName = (typeof COURSE_PALETTE)[number]['name'];

// ── PWA-only derivatives: the tint and the label ink ─────────────────────────

/**
 * The app draws a subject colour as a rail on a white card. The PWA's cards
 * also fill with a tint of the hue and print the class type in it, so it needs
 * two more values per hue and theme. Neither replaces the app's hex: the border
 * and the rail are the app's value exactly.
 *
 *   tint: the hue at 12% over --surface #FFFFFF (light) and at 18% over
 *         --surface #1C2721 (dark), the same opacities as --info-bg. Stored
 *         opaque so a block reads the same on today's jade column as anywhere.
 *   ink:  the type label's colour. The app's hex where it already reaches 4.5:1
 *         on the tint; otherwise the same hue (HSL hue and saturation kept),
 *         darkened in light mode or lightened in dark mode in 0.5% lightness
 *         steps until it does.
 *
 * Ratios are WCAG 2.x, measured on the stored hex values.
 *
 *            light: hue/tint  ink/tint  hue/surface | dark: hue/tint  ink/tint
 *   indigo          3.85      4.57      4.47        |       3.84      4.56
 *   blue            3.63      4.57      4.22        |       4.14      4.54
 *   sky             3.01      4.58      3.45        |       4.71      4.71 (hue)
 *   teal            3.04      4.55      3.49        |       4.70      4.70 (hue)
 *   emerald         2.99      4.54      3.41        |       4.76      4.76 (hue)
 *   lime            2.95      4.62      3.34        |       5.01      5.01 (hue)
 *   amber           2.40      4.57      2.68        |       5.33      5.33 (hue)
 *   orange          2.95      4.57      3.37        |       4.59      4.59 (hue)
 *   rose            3.21      4.55      3.70        |       4.48      4.54
 *   magenta         3.28      4.55      3.80        |       4.48      4.55
 *   violet          3.64      4.54      4.23        |       4.19      4.58
 *   slate           4.68      4.68 (hue) 5.49       |       4.84      4.84 (hue)
 *
 * BORDERS UNDER 3:1, left as the app's hex on purpose (light mode only; every
 * dark value is above 3.8:1):
 *   against its own tint: emerald 2.99 (-0.01), lime 2.95 (-0.05),
 *                         orange 2.95 (-0.05), amber 2.40 (-0.60)
 *   against --surface:    amber 2.68 (-0.32), which is also the dashboard rail
 * The type is always printed on the block in the ink colour, so no class is
 * identified by its border alone.
 */
interface ThemeSwatch {
  hue: string;
  tint: string;
  ink: string;
}

const DERIVED: Record<CourseHueName, { light: Omit<ThemeSwatch, 'hue'>; dark: Omit<ThemeSwatch, 'hue'> }> = {
  indigo: { light: { tint: '#ECEDFD', ink: '#5356F0' }, dark: { tint: '#2F3847', ink: '#9598F6' } },
  blue: { light: { tint: '#E6EFF9', ink: '#286DB6' }, dark: { tint: '#273D44', ink: '#67A8E8' } },
  sky: { light: { tint: '#E4F2F8', ink: '#18749A' }, dark: { tint: '#264043', ink: '#54B4DC' } },
  teal: { light: { tint: '#E2F3F1', ink: '#0D7A6E' }, dark: { tint: '#21423A', ink: '#36BCAC' } },
  emerald: { light: { tint: '#E6F3EB', ink: '#247C48' }, dark: { tint: '#254332', ink: '#4FC07D' } },
  lime: { light: { tint: '#EDF3E6', ink: '#527723' }, dark: { tint: '#31422A', ink: '#93BE54' } },
  amber: { light: { tint: '#FBF1E4', ink: '#9D6015' }, dark: { tint: '#423E29', ink: '#F0A84B' } },
  orange: { light: { tint: '#FCEDE7', ink: '#BC461C' }, dark: { tint: '#42392C', ink: '#F08A5F' } },
  rose: { light: { tint: '#FBEBED', ink: '#CF263F' }, dark: { tint: '#423735', ink: '#F08291' } },
  magenta: { light: { tint: '#FAEAF3', ink: '#C12E83' }, dark: { tint: '#41373D', ink: '#E981BF' } },
  violet: { light: { tint: '#F1EBFE', ink: '#7A44F5' }, dark: { tint: '#353946', ink: '#B094F1' } },
  slate: { light: { tint: '#EBEDEF', ink: '#5A6B7B' }, dark: { tint: '#33403D', ink: '#9DB0BE' } },
};

export interface SubjectSwatch {
  name: CourseHueName;
  light: ThemeSwatch;
  dark: ThemeSwatch;
}

function swatchAt(index: number): SubjectSwatch {
  const entry = COURSE_PALETTE[index % COURSE_PALETTE.length];
  const derived = DERIVED[entry.name];
  return {
    name: entry.name,
    light: { hue: entry.light, ...derived.light },
    dark: { hue: entry.dark, ...derived.dark },
  };
}

// ── The assignment rule (copied from constants/colorMap.ts) ──────────────────

/** Subject name -> palette index. Build it once per schedule response. */
export type SubjectColorMap = ReadonlyMap<string, number>;

/**
 * buildSubjectColorMap, without the singleton. Keyed on the FRENCH name, as the
 * app's sort is; the app also registers the Arabic name under the same index,
 * which the PWA does not need, because every lookup here passes nameFr.
 */
export function buildSubjectColorMap(
  entries: readonly { subject: { nameFr: string } }[]
): SubjectColorMap {
  const unique = [...new Set(entries.map((entry) => entry.subject.nameFr))].sort((a, b) =>
    a.localeCompare(b, 'fr')
  );
  return new Map(unique.map((name, index) => [name, index]));
}

/**
 * getSubjectColor. The fallback is the app's exactly: `for...of` walks code
 * points and takes each one's first UTF-16 unit, which is what the app's loop
 * does too. Kept identical so a subject missing from the map (never, while the
 * map is built from the same entries) still lands on the app's colour.
 */
export function subjectSwatch(map: SubjectColorMap, nameFr: string): SubjectSwatch {
  const index = map.get(nameFr);
  if (index !== undefined) return swatchAt(index);

  let hash = 0;
  for (const c of nameFr) hash += c.charCodeAt(0);
  return swatchAt(hash);
}

/**
 * Both themes' values as custom properties on the element. The global
 * `.subject-color` rule in app/globals.css picks the active theme's three into
 * --subj, --subj-tint and --subj-ink, so a theme switch repaints in CSS with no
 * re-render, and the server-rendered first paint is already right.
 *
 * Use with className "subject-color".
 */
export function subjectStyle(swatch: SubjectSwatch): CSSProperties {
  return {
    '--subj-l': swatch.light.hue,
    '--subj-tint-l': swatch.light.tint,
    '--subj-ink-l': swatch.light.ink,
    '--subj-d': swatch.dark.hue,
    '--subj-tint-d': swatch.dark.tint,
    '--subj-ink-d': swatch.dark.ink,
  } as CSSProperties;
}
