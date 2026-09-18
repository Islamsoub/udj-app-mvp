'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/auth-client';
import { onSessionExpired } from '@/lib/auth-token';
import { ensureSession } from './session-guard';
import { useI18n } from '@/lib/i18n';
import { OfflineBanner } from './OfflineBanner';
import { ProgressBar } from './ProgressBar';
import { SessionExpiredModal } from './SessionExpiredModal';
import { Sidebar } from './Sidebar';
import { TabBar } from './TabBar';
import { Toast } from './Toast';
import { Topbar } from './Topbar';
import { UnipocketMark } from './icons';
import { titleKeyFor } from './nav-items';
import { useLayoutMode } from './useLayoutMode';
import { useOnline } from './useOnline';
import styles from './shell.module.css';

/** Where an unauthenticated visitor, or a student who signs out, is sent. */
const LOGIN_PATH = '/login';

type Gate = 'checking' | 'authed';

/**
 * The authenticated shell: route guard, chrome, and the two global surfaces
 * (offline banner, session-expired modal).
 *
 * The guard and the chrome live in one component on purpose. They are a single
 * decision — "is there a session, and therefore is there an app?" — and
 * splitting them would let the chrome mount for a frame before the answer
 * arrives, which is precisely what must not happen.
 */
export function AppShell({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const router = useRouter();
  const pathname = usePathname();

  const [gate, setGate] = useState<Gate>('checking');
  const [expired, setExpired] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const layout = useLayoutMode();
  const { online, justRestored, acknowledgeRestore } = useOnline();

  /*
   * The student's own collapse choice, honoured only on desktop. Between 640 and
   * 1024 §7 makes the collapsed state a property of the viewport, so the value
   * is kept but not consulted — and it is still here when the window widens
   * again, which is what a preference means.
   */
  const [manuallyCollapsed, setManuallyCollapsed] = useState(false);
  const collapsed = layout === 'desktop' ? manuallyCollapsed : true;

  // ── Route guard ───────────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    ensureSession().then((ok) => {
      if (cancelled) return;
      if (ok) {
        setGate('authed');
        return;
      }
      // replace, not push: a failed session check must not leave an entry that
      // the back button returns to, which would bounce straight back here.
      router.replace(LOGIN_PATH);
    });

    return () => {
      cancelled = true;
    };
  }, [router]);

  // ── Session expiry ────────────────────────────────────────────────────────

  /*
   * onSessionExpired holds a SINGLE callback, not a listener list — registering
   * a second one silently replaces the first. This must therefore be the only
   * registration in the app. If another surface ever needs to react to an
   * expired session, it has to be routed through this state rather than given
   * its own registration.
   */
  useEffect(() => onSessionExpired(() => setExpired(true)), []);

  const goToLogin = useCallback(() => {
    setExpired(false);
    router.replace(LOGIN_PATH);
  }, [router]);

  const handleLogout = useCallback(async () => {
    await logout();
    router.replace(LOGIN_PATH);
  }, [router]);

  // ── Reconnect toast (§8) ──────────────────────────────────────────────────

  useEffect(() => {
    if (!justRestored) return;
    setToast(t('offline.restored'));
    // Consumed immediately so a re-render cannot re-fire the same restore.
    acknowledgeRestore();
  }, [justRestored, acknowledgeRestore, t]);

  // ── Render ────────────────────────────────────────────────────────────────

  /*
   * Nothing but the loading state until BOTH the session answer and the first
   * viewport measurement are in.
   *
   * Waiting on the layout mode too is what keeps §7's "unmounts, not hidden"
   * promise honest: rendering before the width is known would mean guessing, and
   * a wrong guess mounts a sidebar on a phone for one frame.
   */
  if (gate !== 'authed' || layout === null) {
    return <Booting label={t('shell.restoring_session')} />;
  }

  const titleKey = titleKeyFor(pathname);
  const title = titleKey ? t(titleKey) : t('app.name');
  const isMobile = layout === 'mobile';

  return (
    <div className={styles.shell}>
      {/*
        §10: the first focusable element in the document. It precedes the
        sidebar in the DOM, which is also the focus order the spec asks for:
        skip link -> sidebar nav -> topbar actions -> page heading -> content.
      */}
      <a className={styles.skipLink} href="#main-content">
        {t('shell.skip_to_content')}
      </a>

      {/* §7: below 640px the sidebar is absent from the tree, not hidden. */}
      {!isMobile && (
        <Sidebar
          collapsed={collapsed}
          canToggle={layout === 'desktop'}
          onToggle={() => setManuallyCollapsed((v) => !v)}
          pathname={pathname}
        />
      )}

      <div className={styles.column}>
        <Topbar title={title} onLogout={handleLogout} />
        <OfflineBanner offline={!online} />

        {/* Sits at the top edge of the content area, per §4. */}
        <ProgressBar pathname={pathname} />

        <main
          id="main-content"
          className={`${styles.content} ${isMobile ? styles.contentMobile : ''}`}
          // The skip link's target. -1 so it can receive focus programmatically
          // without joining the tab order itself.
          tabIndex={-1}
        >
          {children}
        </main>
      </div>

      {isMobile && <TabBar pathname={pathname} />}

      <Toast message={toast} onDone={() => setToast(null)} />

      <SessionExpiredModal
        open={expired}
        onReconnect={goToLogin}
        // §8: dismisses the modal and lets the student keep browsing cached data
        // read-only. Only offered when there is a cache — see the modal.
        onContinueOffline={() => setExpired(false)}
      />
    </div>
  );
}

/**
 * The pre-shell state: a mark, a spinner and a line of text, centred.
 *
 * Deliberately not a skeleton of the shell. A skeleton is a promise that the
 * thing it outlines is arriving, and this check can just as easily end in a
 * redirect to /login — drawing a sidebar that is about to vanish would be a lie
 * about what comes next.
 */
function Booting({ label }: { label: string }) {
  return (
    <div className={styles.booting} role="status" aria-live="polite">
      <UnipocketMark className={styles.bootingMark} />
      <span className={styles.bootingSpinner} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

