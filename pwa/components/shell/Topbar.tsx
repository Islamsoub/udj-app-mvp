'use client';

import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { AvatarIcon, LogoutIcon } from './icons';
import { PageTitle } from './PageTitle';
import styles from './shell.module.css';

/**
 * Page title plus the avatar menu. No notification bell — out of scope here, and
 * the §10 focus order accommodates it landing before the avatar later.
 */
export function Topbar({ title, onLogout }: { title: string; onLogout: () => void }) {
  const { t } = useI18n();

  return (
    <header className={styles.topbar}>
      <PageTitle title={title} />
      <div className={styles.topbarActions}>
        <AvatarMenu onLogout={onLogout} label={t('shell.account')} logoutLabel={t('shell.logout')} />
      </div>
    </header>
  );
}

/**
 * §5 popover: closes on outside click, on Escape, or on selecting an item, and
 * §3 returns focus to the trigger on close.
 *
 * Escape closing this is not in tension with the session-expired modal refusing
 * to: that one is a decision the student must make, this one is a menu they can
 * change their mind about.
 */
function AvatarMenu({
  onLogout,
  label,
  logoutLabel,
}: {
  onLogout: () => void;
  label: string;
  logoutLabel: string;
}) {
  const { dir } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLButtonElement>(null);

  // Returns focus to the trigger, which is what §3 requires of anything that
  // traps or moves focus. Without it, dismissing with Escape drops the keyboard
  // user back at the top of the document.
  const close = (restoreFocus: boolean) => {
    setOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  };

  useEffect(() => {
    if (!open) return;

    // Moving focus into the menu is what makes it operable by keyboard at all;
    // otherwise Tab would continue past it into the page behind.
    firstItemRef.current?.focus();

    const onPointerDown = (event: PointerEvent) => {
      if (!wrapRef.current?.contains(event.target as Node)) close(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        close(true);
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
    // `close` is stable enough for this scope — it only reads refs and setState.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <div className={styles.menuWrap} ref={wrapRef}>
      <button
        ref={triggerRef}
        type="button"
        className={styles.iconButton}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
      >
        <AvatarIcon />
      </button>

      {open && (
        <div
          className={styles.menu}
          role="menu"
          aria-label={label}
          // §5 gives this popover a top-inline-end origin. Same dir-derived
          // property as the progress sweep — see ProgressBar for why.
          style={{ '--sweep-origin': dir === 'rtl' ? 'left' : 'right' } as React.CSSProperties}
        >
          <button
            ref={firstItemRef}
            type="button"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => {
              // Closed without restoring focus: the trigger is about to be
              // unmounted along with the rest of the shell.
              setOpen(false);
              onLogout();
            }}
          >
            <LogoutIcon />
            {logoutLabel}
          </button>
        </div>
      )}
    </div>
  );
}
