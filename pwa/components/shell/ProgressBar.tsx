'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import styles from './shell.module.css';

/**
 * §4: a 2px jade bar sweeps along the top edge of the content area over
 * --dur-base on every navigation, to signal a "page load" even though the view
 * swapped instantly.
 *
 * It is mounted only while sweeping and unmounted afterwards, so the animation
 * restarts cleanly on a rapid second navigation instead of being ignored because
 * the element is already mid-animation.
 *
 * Purely decorative: aria-hidden. It reports no real progress — there is no load
 * to measure, the route is already client-side — so exposing it as a progressbar
 * would announce a lie. Navigation itself is announced by the page heading.
 */
export function ProgressBar({ pathname }: { pathname: string }) {
  const { dir } = useI18n();
  const [sweeping, setSweeping] = useState(false);
  const mounted = useRef(false);

  useEffect(() => {
    // First paint is not a navigation. Sweeping on arrival would tell the
    // student a page they are already looking at is still loading.
    if (!mounted.current) {
      mounted.current = true;
      return;
    }
    setSweeping(true);
  }, [pathname]);

  if (!sweeping) return null;

  return (
    <div
      // Keyed on the pathname so a navigation during a sweep remounts the
      // element and the animation starts over from zero width.
      key={pathname}
      className={styles.progress}
      aria-hidden="true"
      /*
       * §6: direction-sensitive animation reads `dir` at animation time rather
       * than assuming LTR. The sweep runs inline-start -> inline-end, which is
       * left -> right in French and right -> left in Arabic. transform-origin
       * has no logical form, so the axis arrives as a custom property instead of
       * a [dir="rtl"] rule.
       */
      style={{ '--sweep-origin': dir === 'rtl' ? 'right' : 'left' } as React.CSSProperties}
      onAnimationEnd={() => setSweeping(false)}
    />
  );
}
