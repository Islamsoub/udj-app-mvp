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
 * Direction needs no handling for a single number: the parts are emitted in
 * template order and the browser's bidi algorithm places them, so the same
 * template reads correctly in both directions without a mirrored variant. A
 * value that is itself a pair — a range, a percentage — is the exception, and
 * is passed in already isolated by the helpers in lib/bidi.
 */
export function Interpolated({
  template,
  values,
  renderValue = renderNumber,
}: {
  template: string;
  /** A node as well as a string or number, so a value can arrive already
   *  formatted — a percentage or a range from lib/bidi, isolated as LTR. */
  values: Record<string, ReactNode>;
  /**
   * How each substituted value is wrapped. The default is the `.num` span
   * described above. A sentence that interpolates words — a name, a programme —
   * passes its own, because those must keep the language's font: `.num` would
   * put an Arabic programme name on a face with no Arabic glyphs.
   */
  renderValue?: (name: string, value: ReactNode) => ReactNode;
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

    parts.push(<Fragment key={parts.length}>{renderValue(name, value)}</Fragment>);

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < template.length) {
    parts.push(<Fragment key={parts.length}>{template.slice(lastIndex)}</Fragment>);
  }

  return <>{parts}</>;
}

function renderNumber(_name: string, value: ReactNode): ReactNode {
  return <span className="num">{value}</span>;
}
