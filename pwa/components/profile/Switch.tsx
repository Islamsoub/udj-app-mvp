'use client';

import { useI18n } from '@/lib/i18n';
import styles from './profile.module.css';

/**
 * A toggle, on the login screen's pattern — a <button role="switch"> with
 * aria-checked, labelled by the row, its 44px target made by a pseudo-element
 * rather than by inflating the box.
 *
 * ── Motion ───────────────────────────────────────────────────────────────────
 *
 * The thumb is larger when on than when off, and it travels. Both are a single
 * transform — translate and scale together, over --dur-fast — so they read as
 * one motion and cost no layout per frame. RTL is handled by a sign read from
 * `dir` (§6), because a transform is not mirrored by the direction on its own.
 * The login switch gets the same result from logical properties instead.
 *
 * It is a transition, not a keyframe animation, so it runs only when the state
 * changes — never on mount, where a thumb sliding into its saved position would
 * announce a change that did not happen.
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
      className={`${styles.switch} ${checked ? styles.switchOn : ''}`}
      style={{ '--switch-dir': dir === 'rtl' ? -1 : 1 } as React.CSSProperties}
      onClick={() => {
        if (locked) return;
        onChange(!checked);
      }}
    >
      <span className={styles.switchThumb} aria-hidden="true" />
    </button>
  );
}
