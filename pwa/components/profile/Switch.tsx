'use client';

import { useState } from 'react';
import { useI18n } from '@/lib/i18n';
import styles from './profile.module.css';

/**
 * A toggle, on the login screen's pattern — a <button role="switch"> with
 * aria-checked, labelled by the row, its 44px target made by a pseudo-element
 * rather than by inflating the box.
 *
 * ── §9: "thumb translateX over --dur-instant with a slight easing overshoot" ─
 *
 * The login switch moves its thumb by transitioning inset-inline-start. This
 * one uses a transform, as §9 asks — compositor-only, no layout per frame — and
 * RTL is handled by a sign read from `dir` (§6), because a transform is not
 * mirrored by the direction on its own.
 *
 * The overshoot is NOT a new easing. §2 allows two curves and neither
 * overshoots, so it is built from the tokens: a keyframe that runs a couple of
 * pixels past the end and settles, over --dur-instant on --ease-out. It plays
 * only after a change the student made — never on mount, where a thumb
 * bouncing into its saved position would announce a change that did not
 * happen.
 */
export function Switch({
  checked,
  onChange,
  labelledBy,
  describedBy,
  disabled = false,
  locked = false,
  busy = false,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  labelledBy: string;
  describedBy?: string;
  /** Unavailable (offline): natively disabled, out of the tab order. */
  disabled?: boolean;
  /**
   * Temporarily not accepting input — a save is in flight somewhere in the
   * section. aria-disabled rather than `disabled`, because disabling the
   * focused control would throw the keyboard user's focus to <body> mid-save.
   */
  locked?: boolean;
  /** The in-flight save is THIS switch's. */
  busy?: boolean;
}) {
  const { dir } = useI18n();
  const [moved, setMoved] = useState(false);

  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      aria-busy={busy || undefined}
      aria-disabled={locked || undefined}
      disabled={disabled}
      className={[
        styles.switch,
        checked ? styles.switchOn : '',
        moved ? (checked ? styles.switchMovedOn : styles.switchMovedOff) : '',
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ '--switch-dir': dir === 'rtl' ? -1 : 1 } as React.CSSProperties}
      onClick={() => {
        if (locked) return;
        setMoved(true);
        onChange(!checked);
      }}
    >
      <span className={styles.switchThumb} aria-hidden="true" />
    </button>
  );
}
