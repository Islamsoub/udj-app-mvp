'use client';

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useLayoutMode } from '@/components/shell/useLayoutMode';
import { useI18n } from '@/lib/i18n';
import { useExitBackstop } from '@/lib/useExitBackstop';
import styles from './panel.module.css';

/**
 * §5's slide-in detail panel. The first one in the app, and deliberately empty
 * of anything specific to the calculator inside it — course detail and the
 * justification flow are the next two, and they should differ only in `children`.
 *
 * "Desktop/tablet: panel slides in from the inline-end edge —
 * translateX(100%)->0 (mirrored to -100%->0 in RTL) over --dur-base --ease-out;
 * a scrim fades in 0->0.4 opacity in parallel. Mobile (<640px): the same panel
 * becomes a bottom sheet — translateY(100%)->0 over the same duration, with
 * rounded top corners. Close on: scrim click, Escape, the x button, or (mobile
 * only) a downward drag past 40% of the sheet's height. Closing reverses the
 * entrance transition."
 *
 * All four close paths are here, plus §3's focus contract: trapped while open,
 * returned to the element that opened it.
 *
 * PORTALLED TO document.body. A fixed-position panel rendered inside the page
 * would be at the mercy of every ancestor between it and the viewport — one
 * `transform` or `filter` anywhere up the tree makes `position: fixed` resolve
 * against that ancestor instead, and the panel would sit inside the content
 * column rather than over the app. The portal removes the question.
 */
export function SlidePanel({
  open,
  onClose,
  title,
  subtitle,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const { t, dir } = useI18n();
  const titleId = useId();
  const subtitleId = useId();

  /*
   * The same breakpoint the shell switches its navigation on, imported rather
   * than re-derived. A panel that thought it was a sheet while the app thought
   * it was a desktop would drag in a direction it does not travel.
   */
  const isSheet = useLayoutMode() === 'mobile';

  const panelRef = useRef<HTMLDivElement>(null);
  const returnFocusTo = useRef<HTMLElement | null>(null);

  // ── Mount / unmount around the exit animation ─────────────────────────────

  /*
   * Closing has to outlive `open` going false, or the exit animation would have
   * nothing to play on. Derived during render rather than in an effect so the
   * leaving class lands in the same commit the parent closed in.
   */
  const [rendered, setRendered] = useState(open);
  const [leaving, setLeaving] = useState(false);

  if (open && !rendered) {
    setRendered(true);
    setLeaving(false);
  } else if (!open && rendered && !leaving) {
    setLeaving(true);
  }

  const finishExit = useCallback(() => {
    setRendered(false);
    setLeaving(false);
  }, []);

  // animationend is the fast path; this is the floor for a tab that is hidden
  // when the panel closes and therefore never advances the animation at all.
  useExitBackstop(leaving, finishExit);

  // ── Focus (§3, §10) ───────────────────────────────────────────────────────

  useEffect(() => {
    if (!open) return;

    // Captured before anything inside is focused, so it is genuinely the
    // trigger and not the panel's own first control.
    returnFocusTo.current = document.activeElement as HTMLElement | null;

    const first = panelRef.current?.querySelector<HTMLElement>(FOCUSABLE);
    (first ?? panelRef.current)?.focus();
  }, [open]);

  /*
   * Focus goes back only once the panel is really gone. Restoring it while the
   * exit animation is still running would put the caret on an element the panel
   * is still covering.
   *
   * `returnFocusTo` is null until the first open, which is what stops this from
   * firing on mount and stealing focus from wherever the student actually is.
   */
  useEffect(() => {
    if (rendered) return;
    returnFocusTo.current?.focus();
    returnFocusTo.current = null;
  }, [rendered]);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') return;

      /*
       * Wrapping by hand rather than letting the browser run off the end: the
       * page behind is still in the tab order. aria-modal tells assistive tech
       * to ignore it, but it does not remove anything from the tab sequence, so
       * without this the next Tab would land on the sidebar behind the scrim.
       */
      const focusables = panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE);
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || active === panelRef.current)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  // ── Drag to dismiss, mobile only (§5) ─────────────────────────────────────

  const [dragY, setDragY] = useState(0);
  const drag = useRef<{ startY: number; height: number } | null>(null);
  const [dragging, setDragging] = useState(false);

  const onPointerDown = (event: React.PointerEvent<HTMLElement>) => {
    // Only the sheet drags. On desktop the panel is anchored to an edge the
    // gesture does not travel along, and §5 scopes the drag to mobile anyway.
    if (!isSheet || leaving) return;

    const sheet = panelRef.current;
    if (!sheet) return;

    drag.current = { startY: event.clientY, height: sheet.getBoundingClientRect().height };
    setDragging(true);
    capture(event.currentTarget, event.pointerId, true);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLElement>) => {
    if (!drag.current) return;
    // Downward only. Dragging up would lift the sheet off the bottom edge and
    // expose the scrim beneath it, which is not a state the sheet has.
    setDragY(Math.max(0, event.clientY - drag.current.startY));
  };

  const onPointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const session = drag.current;
    if (!session) return;

    drag.current = null;
    setDragging(false);
    capture(event.currentTarget, event.pointerId, false);

    // §5: past 40% of the sheet's height dismisses; anything less springs back.
    if (dragY > session.height * DISMISS_FRACTION) {
      /*
       * dragY is deliberately NOT reset here. The exit keyframe starts from it,
       * so the sheet carries on downward from where the finger left it instead
       * of snapping back to its resting place for one frame and then sliding.
       */
      onClose();
      return;
    }

    setDragY(0);
  };

  if (!rendered) return null;

  return createPortal(
    <div
      className={`${styles.scrim} ${leaving ? styles.scrimLeaving : ''}`}
      /*
       * Target vs currentTarget rather than stopPropagation on the panel: a
       * click anywhere inside must not be swallowed on its way up, or a future
       * panel with its own delegated handlers would quietly stop working.
       */
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={panelRef}
        className={[
          styles.panel,
          leaving ? styles.panelLeaving : '',
          dragY !== 0 ? styles.panelDragged : '',
          dragging ? styles.panelDragging : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={subtitle === undefined ? undefined : subtitleId}
        tabIndex={-1}
        style={
          {
            // A transform is never mirrored by `dir`, so the direction the panel
            // travels is handed to the stylesheet as a sign read from the active
            // direction — §6's rule for animations that cannot be expressed
            // logically. -1 sends it out through the left edge in Arabic.
            '--panel-slide': dir === 'rtl' ? -1 : 1,
            '--drag-y': `${dragY}px`,
          } as React.CSSProperties
        }
        onAnimationEnd={leaving ? finishExit : undefined}
      >
        <header
          className={styles.head}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
        >
          {/*
            The grab handle, shown only as a sheet. It is what tells the student
            the drag exists — a gesture with no affordance is a gesture nobody
            finds. Decorative: the x button beside it is the accessible way out.
          */}
          <span className={styles.grabber} aria-hidden="true" />

          <div className={styles.headText}>
            <h2 id={titleId} className={styles.title}>
              {title}
            </h2>
            {subtitle !== undefined && (
              <p id={subtitleId} className={styles.subtitle}>
                {subtitle}
              </p>
            )}
          </div>

          <button
            type="button"
            className={styles.close}
            onClick={onClose}
            aria-label={t('actions.close')}
          >
            <CloseIcon />
          </button>
        </header>

        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
}

/** §5: "a downward drag past 40% of the sheet's height". */
const DISMISS_FRACTION = 0.4;

/**
 * Pointer capture, guarded.
 *
 * Both methods throw for a pointer that is no longer active — a finger lifted
 * outside the window, a gesture the browser took over for its own scrolling,
 * anything that ends the pointer between one event and the next. Thrown from
 * inside a React handler that would abandon the drag mid-gesture, leaving the
 * sheet stuck wherever the finger left it. There is nothing to do about a
 * pointer that has already gone, so the failure is swallowed and the handler
 * finishes tidying up.
 */
function capture(element: Element, pointerId: number, on: boolean): void {
  try {
    if (on) element.setPointerCapture(pointerId);
    else element.releasePointerCapture(pointerId);
  } catch {
    // The pointer is gone; the state reset around this call is what matters.
  }
}

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** The x. Stroke-only and sized by CSS, like every other glyph in the app. */
function CloseIcon() {
  return (
    <svg
      className={styles.closeIcon}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
    >
      <path d="m7 7 10 10M17 7 7 17" />
    </svg>
  );
}
