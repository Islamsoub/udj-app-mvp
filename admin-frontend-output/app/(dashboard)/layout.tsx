'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Sidebar } from '@/components/shell/sidebar';
import { TopBar } from '@/components/shell/top-bar';
import { useAuthStore } from '@/stores/auth-store';

/**
 * Authenticated shell (impl spec §7): flex — Sidebar (248px sticky) + column
 * with TopBar (64px sticky) and scrolling <main> (padding 28px 32px 40px,
 * max-width 1280, centered). Redirects to /login when unauthenticated.
 * Waits for zustand/persist hydration before deciding (avoids a flash).
 */
export default function DashboardLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated && !isAuthenticated) {
      router.replace('/login');
    }
  }, [hydrated, isAuthenticated, router]);

  // Scroll to top on navigation (prototype behavior).
  useEffect(() => {
    document.getElementById('main-scroll')?.scrollTo(0, 0);
  }, [pathname]);

  if (!hydrated || !isAuthenticated) {
    return <div className="flex min-h-screen items-center justify-center bg-bg" />;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        <main id="main-scroll" className="min-w-0 flex-1">
          <div className="mx-auto max-w-content px-8 pb-10 pt-7">{children}</div>
        </main>
      </div>
    </div>
  );
}
