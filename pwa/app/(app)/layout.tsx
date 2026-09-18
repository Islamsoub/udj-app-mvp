import type { ReactNode } from 'react';
import { AppShell } from '@/components/shell/AppShell';

/**
 * Layout for every authenticated route.
 *
 * A route group, so `(app)` contributes nothing to the URL — the dashboard is
 * `/`, not `/app/`. /login sits outside this group and therefore never renders
 * the shell or runs the guard, which is what keeps the two from fighting: the
 * guard redirects to /login, and /login must not be behind the guard.
 *
 * This file stays a server component. AppShell is the client boundary, so the
 * six pages below it are still free to be server components even though the
 * chrome around them is interactive.
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
