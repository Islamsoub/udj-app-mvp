'use client';

import { Fragment, type ReactNode } from 'react';

const PLACEHOLDER = /\{\{(\w+)\}\}/g;

/**
 * Renders a translated sentence with its numbers on the Latin face.
 *
 * The design system requires every number, time and GPA to stay in Plus Jakarta
 * Sans even in Arabic — that is what `.num` does. A number interpolated into a
 * sentence makes that awkward: wrapping the whole string in `.num` would drag
 * the Arabic words onto a font with no Arabic glyphs, and wrapping nothing
 * leaves the digits in Noto Naskh.
 *
 * So the substitution happens here instead of in `t()`. Passing a key to `t()`
 * with no params returns the template with its `{{placeholders}}` intact — the
 * provider deliberately leaves unmatched ones in place — and this splits on
 * them, emitting the words as plain text and each value inside a `.num` span.
 *
 * Direction needs no handling: the parts are emitted in template order and the
 * browser's bidi algorithm places them, so the same template reads correctly in
 * both directions without a mirrored variant.
 */
export function Interpolated({
  template,
  values,
}: {
  template: string;
  values: Record<string, string | number>;
}) {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // The regex is global and stateful, so it is reset before use — a shared
  // lastIndex across calls would silently skip the first placeholder.
  PLACEHOLDER.lastIndex = 0;

  while ((match = PLACEHOLDER.exec(template)) !== null) {
    if (match.index > lastIndex) {
      parts.push(<Fragment key={parts.length}>{template.slice(lastIndex, match.index)}</Fragment>);
    }

    const name = match[1];
    const value = Object.prototype.hasOwnProperty.call(values, name) ? values[name] : match[0];

    parts.push(
      <span key={parts.length} className="num">
        {value}
      </span>
    );

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < template.length) {
    parts.push(<Fragment key={parts.length}>{template.slice(lastIndex)}</Fragment>);
  }

  return <>{parts}</>;
}
