import { Fragment, type ReactNode } from 'react';

/**
 * Left-to-right isolates for figures that must read the same in both languages.
 *
 * Arabic pages are RTL, but the product writes every number in Latin digits. A
 * lone number survives that. A pair of numbers joined by a separator does not:
 * after an Arabic letter the bidi algorithm treats the digits as Arabic numbers,
 * leaves a hyphen or a percent sign between them neutral, and lays the pieces
 * out right-to-left — so 08:00 – 09:30 is drawn as "09:30 – 08:00", 2024-2025
 * as "2025-2024", and 75% as "%75". A class appears to end before it starts.
 *
 * `<bdi dir="ltr">` fixes the order inside the figure and isolates it from the
 * sentence around it, so the sentence itself still flows right-to-left. In
 * French it changes nothing: an LTR isolate inside LTR text is invisible.
 *
 * This is markup, not a stylesheet rule keyed on direction — there is still no
 * `[dir="rtl"]` selector anywhere — and it lives here so that a range or a
 * percentage is written one way in the whole app rather than at each call site.
 *
 * Fonts are the caller's business: wrap the result in `.num` or `.mono` as
 * before. These helpers only settle direction and form.
 */

/** Any figure that is already one string — "2024-2025", a room, a code. */
export function fmtLtr(value: string | number): ReactNode {
  return <bdi dir="ltr">{value}</bdi>;
}

/** A start–end pair: clock times, dates, years. */
export function fmtRange(start: string | number, end: string | number): ReactNode {
  return (
    <bdi dir="ltr">
      {start} – {end}
    </bdi>
  );
}

/**
 * A figure over its total or its scale: credits earned of total, a mark out of
 * 20. The slash is a separator like the range's dash, and fails the same way —
 * "15 / 30" after Arabic text is drawn "30 / 15".
 */
export function fmtRatio(value: string | number, total: string | number): ReactNode {
  return (
    <bdi dir="ltr">
      {value} / {total}
    </bdi>
  );
}

/**
 * The same, when the figure and its scale are two styled pieces in a flex row —
 * a hero average and its smaller "/ 20". Isolating the text is not enough there:
 * a flex row in an RTL page also places its items right to left, so the pair is
 * grouped into one LTR item. `.ratio` (globals.css) lays it out with the row's
 * own gap and alignment, so the call site's spacing is unchanged.
 */
export function fmtScaled(value: ReactNode, scale: ReactNode): ReactNode {
  return (
    <bdi dir="ltr" className="ratio">
      {value}
      {scale}
    </bdi>
  );
}

/**
 * The one written form of a percentage, for places that can only take a string
 * — an aria-label, an SVG <text>. Rounded, sign attached, no space: "92%".
 * Everything visible goes through fmtPercent, which wraps this same string, so
 * changing the form here changes it everywhere.
 */
export function percentText(value: number): string {
  return `${Math.round(value)}%`;
}

export function fmtPercent(value: number): ReactNode {
  return <bdi dir="ltr">{percentText(value)}</bdi>;
}

/*
 * A range or a percentage inside prose the app did not write — a news title, an
 * article body, a notification. Two numbers (optionally clock times, "08:00" or
 * "8h30") joined by a hyphen or an en dash, or a number followed by a percent
 * sign. A spaced hyphen is deliberately not a range: "salle 12 - 3 places" is
 * two separate numbers, and isolating them would reorder a sentence.
 */
const NUMBER = String.raw`\d+(?:[:.,h]\d+)?`;
const LTR_RUN = new RegExp(
  String.raw`${NUMBER}(?:(?:-|\s?–\s?)${NUMBER})+|${NUMBER}\s?%`,
  'g'
);

/**
 * Free text with its ranges and percentages isolated. The text itself is not
 * rewritten — whatever form the author used is kept, only its order is pinned.
 */
export function isolateLtrRuns(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;

  for (const match of text.matchAll(LTR_RUN)) {
    if (match.index > lastIndex) {
      parts.push(<Fragment key={parts.length}>{text.slice(lastIndex, match.index)}</Fragment>);
    }
    parts.push(
      <bdi key={parts.length} dir="ltr">
        {match[0]}
      </bdi>
    );
    lastIndex = match.index + match[0].length;
  }

  if (parts.length === 0) return text;

  if (lastIndex < text.length) {
    parts.push(<Fragment key={parts.length}>{text.slice(lastIndex)}</Fragment>);
  }

  return <>{parts}</>;
}
