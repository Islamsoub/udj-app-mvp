'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar, SIDEBAR_ID } from '@/components/shell/sidebar';
import { TopBar } from '@/components/shell/top-bar';
import { ContextBar, isScopedPath } from '@/components/shell/context-bar';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Authenticated shell (impl spec §7): flex — Sidebar (248px sticky) + column
 * with TopBar (64px sticky) and scrolling <main> (padding 28px 32px 40px,
 * max-width 1280, centered). Redirects to /login when unauthenticated.
 * Waits for zustand/persist hydration before deciding (avoids a flash).
 *
 * Pass C-2: the Context Bar (§30.1) renders between the TopBar and the content,
 * but only on scoped pages (students, grades, attendance, schedule, academics,
 * notifications). It self-guards for role (NEWS_EDITOR hidden) internally.
 *
 * Below 1024px (Tailwind `lg`) the sidebar is a slide-in panel. The TopBar's
 * menu button opens it; Esc, a backdrop click or choosing a page closes it.
 * While it is open the rest of the shell is `inert`, so Tab stays in the panel
 * and screen readers only reach the panel; on close, focus goes back to the
 * menu button. From 1024px up the sidebar is the static column it always was.
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const wasOpen = useRef(false);

  const closeNav = useCallback(() => setNavOpen(false), []);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  // Scroll to top on navigation (prototype behavior), and close the panel:
  // choosing a page is one of the ways out.
  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo(0, 0);
    setNavOpen(false);
  }, [pathname]);

  // Widening past 1024px turns the panel back into the static column; an open
  // panel must not leave the content inert behind it.
  useEffect(() => {
    const wide = window.matchMedia('(min-width: 1024px)');
    const onChange = () => {
      if (wide.matches) setNavOpen(false);
    };
    wide.addEventListener('change', onChange);
    return () => wide.removeEventListener('change', onChange);
  }, []);

  useEffect(() => {
    if (!navOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setNavOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [navOpen]);

  // Back to the button that opened it, however the panel was closed.
  useEffect(() => {
    if (wasOpen.current && !navOpen) menuButtonRef.current?.focus();
    wasOpen.current = navOpen;
  }, [navOpen]);

  if (!hydrated || !isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center bg-bg" />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar open={navOpen} />
      {navOpen && (
        // Above the sticky TopBar (z-40), below the panel (z-50).
        <div
          className="fixed inset-0 z-[45] lg:hidden"
          style={{ background: 'var(--scrim)' }}
          onClick={closeNav}
          aria-hidden="true"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col" inert={navOpen}>
        <TopBar
          menuButtonRef={menuButtonRef}
          navOpen={navOpen}
          navId={SIDEBAR_ID}
          onMenu={() => setNavOpen(true)}
        />
        {isScopedPath(pathname) && <ContextBar />}
        <main id="main-scroll" className="min-w-0 flex-1">
          <div className="mx-auto max-w-content px-4 pb-10 pt-6 md:px-6 lg:px-8 lg:pt-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
