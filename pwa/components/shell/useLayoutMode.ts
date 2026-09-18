'use client';

import { useEffect, useState } from 'react';

/**
 * Which of §7's three layouts the viewport is in.
 *
 *   desktop (>=1024) — sidebar mounted, expanded unless the student collapsed it
 *   tablet  (640-1023) — sidebar mounted, forced collapsed
 *   mobile  (<640) — sidebar UNMOUNTED, bottom tab bar instead
 */
export type LayoutMode = 'mobile' | 'tablet' | 'desktop';

const TABLET_MIN = 640;
const DESKTOP_MIN = 1024;

function modeForWidth(width: number): LayoutMode {
  if (width < TABLET_MIN) return 'mobile';
  if (width < DESKTOP_MIN) return 'tablet';
  return 'desktop';
}

/**
 * Tracks the layout mode with a ResizeObserver, as §7 specifies ("driven by a
 * resize observer, not a click").
 *
 * A ResizeObserver rather than matchMedia because it reports the *element's*
 * width. On a desktop browser the two agree, but matchMedia answers for the
 * viewport including a classic scrollbar, so a window sized a few pixels either
 * side of 1024 can report a breakpoint the layout is not actually in. Observing
 * documentElement measures the box the shell really gets.
 *
 * Returns null until the first measurement. Callers must treat null as "not yet
 * known" and render no chrome: guessing a mode on the server and correcting it
 * on mount would either flash the wrong layout or, worse, mount the sidebar on a
 * phone for one frame — §7 requires it to be absent below 640, not hidden.
 */
export function useLayoutMode(): LayoutMode | null {
  const [mode, setMode] = useState<LayoutMode | null>(null);

  useEffect(() => {
    const target = document.documentElement;

    const sync = (width: number) => {
      // Functional update: the observer fires on every pixel of a drag, and
      // re-rendering the whole shell 400 times during one resize is what makes
      // a resize feel broken. Only a real mode change gets through.
      setMode((current) => {
        const next = modeForWidth(width);
        return current === next ? current : next;
      });
    };

    sync(target.clientWidth);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) sync(entry.contentRect.width);
    });

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  return mode;
}
