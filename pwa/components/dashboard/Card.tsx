'use client';

import Link from 'next/link';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useI18n } from '@/lib/i18n';
import type { CardState } from './useCardData';
import styles from './dashboard.module.css';

/**
 * The surface every dashboard card sits on, and the one place the shared screen
 * states are rendered.
 *
 * Centralising them is the point of this component: five more screens will copy
 * this pattern, and "skeleton, then error with a retry, then offline" must look
 * and behave the same on all of them. A card supplies only what is specific to
 * it — its skeleton's footprint, and what its data looks like once loaded.
 */
export function Card({
  title,
  icon,
  href,
  index,
  animate,
  children,
}: {
  title: string;
  icon: ReactNode;
  /** Set when the whole card navigates; drives the §3 hover lift. */
  href?: string;
  /** Position in §4's reading order, which is also its stagger delay. */
  index: number;
  animate: boolean;
  children: ReactNode;
}) {
  const className = [
    styles.card,
    href ? styles.cardLink : '',
    animate ? styles.cardEnter : '',
  ]
    .filter(Boolean)
    .join(' ');

  // 40ms apart, per §4. Inline rather than six CSS rules so the order is owned
  // by the array the cards are declared in.
  const style = animate ? ({ '--enter-delay': `${index * 40}ms` } as React.CSSProperties) : undefined;

  return (
    <section className={className} style={style}>
      <div className={styles.cardHeader}>
        <span className={styles.cardIcon}>{icon}</span>
        {/*
          h2: the page's h1 is the dashboard heading, so each card is a section
          below it. Keeps the document outline honest for §10.

          When the card navigates, the LINK IS THE TITLE, stretched over the
          whole card by a transparent ::after overlay — not an <a> wrapped around
          everything. Wrapping is what §3's "clickable card" suggests, but a card
          can also contain a retry button, and a <button> inside an <a> is
          invalid HTML: the browser fires the navigation instead of the button's
          handler, so retry would silently take the student to another screen.
          The stretched link keeps the whole surface clickable with no nesting,
          and anything that needs to sit above it just raises its z-index.
        */}
        <h2 className={styles.cardTitle}>
          {href ? (
            <Link href={href} className={styles.cardTitleLink}>
              {title}
            </Link>
          ) : (
            title
          )}
        </h2>
      </div>
      <div className={styles.cardBody}>{children}</div>
    </section>
  );
}

/**
 * Comfortably longer than --dur-fast (180ms), and than the --dur-instant
 * (100ms) that reduced motion collapses it to. Only reached when animationend
 * does not arrive — see the effect that uses it.
 */
const LAYER_EXIT_BACKSTOP_MS = 400;

/**
 * Renders whichever of the states a card is in, crossfading between them.
 *
 * §5 asks skeletons to "crossfade into real content over --dur-fast". A real
 * crossfade needs both layers present for that moment, so the outgoing skeleton
 * is held for exactly one animation and then dropped — stacked in the same grid
 * cell as the incoming content, which is why nothing below the card moves.
 *
 * `empty` is separate from `ready` because only the card knows what empty means
 * for its own shape. Returning null from `children` is the signal.
 */
export function CardStates<T>({
  state,
  skeleton,
  children,
}: {
  state: CardState<T>;
  skeleton: ReactNode;
  /** Returns the loaded body, or null when the response carried nothing. */
  children: (data: T) => ReactNode;
}) {
  const { t } = useI18n();

  const [leavingSkeleton, setLeavingSkeleton] = useState(false);
  const previousPhase = useRef(state.phase);

  useEffect(() => {
    // Only loading -> settled earns a crossfade. Every other transition is
    // between two static states and swaps directly.
    if (previousPhase.current === 'loading' && state.phase !== 'loading') {
      setLeavingSkeleton(true);
    }
    previousPhase.current = state.phase;
  }, [state.phase]);

  /*
   * Backstop for the outgoing layer.
   *
   * `animationend` is the fast path, but it is not guaranteed to arrive: a tab
   * that is hidden when the swap happens does not run animations at all, so the
   * event never fires and the skeleton stays mounted ON TOP of the content it
   * was standing in for. The student then returns to a card shimmering over data
   * that loaded minutes ago.
   *
   * Removal therefore cannot depend on the event alone. Whichever of the two
   * fires first clears the layer; the timer is generous enough to cover both
   * --dur-fast and the --dur-instant that reduced motion collapses it to.
   */
  useEffect(() => {
    if (!leavingSkeleton) return;
    const timer = window.setTimeout(() => setLeavingSkeleton(false), LAYER_EXIT_BACKSTOP_MS);
    return () => window.clearTimeout(timer);
  }, [leavingSkeleton]);

  if (state.phase === 'loading') {
    return (
      <div className={styles.cardLayer} aria-hidden="true">
        {skeleton}
      </div>
    );
  }

  return (
    <>
      {leavingSkeleton && (
        <div
          className={`${styles.cardLayer} ${styles.layerLeaving}`}
          aria-hidden="true"
          onAnimationEnd={() => setLeavingSkeleton(false)}
        >
          {skeleton}
        </div>
      )}

      <div className={`${styles.cardLayer} ${styles.layerEntering}`}>
        {state.phase === 'ready' && children(state.data)}

        {state.phase === 'error' && (
          <div className={styles.stateBox} role="status" aria-live="polite">
            <p className={styles.stateText}>{t('dashboard.state.error')}</p>
            {/*
              Retries this card alone — useCardData owns one request, so the
              other five are untouched and keep whatever they are showing.
            */}
            <button type="button" className={styles.retryButton} onClick={state.retry}>
              {t('actions.retry')}
            </button>
          </div>
        )}

        {state.phase === 'offline' && (
          <div className={`${styles.stateBox} ${styles.stateOffline}`} role="status" aria-live="polite">
            {/*
              No retry button and no "Dernière synchronisation" line. There is no
              cache yet, so there is no sync time to report, and a retry that
              cannot succeed until the network returns is a button that lies —
              the card refetches by itself the moment connectivity comes back.
            */}
            <p className={styles.stateText}>{t('dashboard.state.offline')}</p>
          </div>
        )}
      </div>
    </>
  );
}

/** A card's empty state: a short line, occasionally a heading above it. */
export function EmptyState({ title, body }: { title?: string; body: string }) {
  return (
    <div className={styles.stateBox}>
      {title !== undefined && <p className={styles.stateTitle}>{title}</p>}
      <p className={styles.stateText}>{body}</p>
    </div>
  );
}
