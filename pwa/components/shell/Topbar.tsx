'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { initialsOf } from '@/lib/student';
import { AvatarIcon, BellIcon, ChevronDownIcon, LogoutIcon, NavIcon } from './icons';
import { PageTitle } from './PageTitle';
import { useStudent } from './StudentContext';
import styles from './shell.module.css';

/**
 * Page title, the notification bell, and the avatar menu (app.css:113-121).
 *
 * The title stays the route's own name — "Accueil" on the dashboard, not
 * Design's "Tableau de bord" (.claude/design-known-divergences.md). Only its
 * type follows Design.
 *
 * Bell before avatar: §10's focus order runs topbar actions start to end.
 */
export function Topbar({ title, onLogout }: { title: string; onLogout: () => void }) {
  const { t, plural } = useI18n();
  const { me, unreadCount } = useStudent();

  const unread = unreadCount ?? 0;
  const initials = me ? initialsOf(me.firstName, me.lastName) : '';

  return (
    <header className={styles.topbar}>
      <PageTitle title={title} />
      <div className={styles.topbarActions}>
        {/*
          No action yet: the notification panel is a later mission. A real
          button, so it is focusable and announced, and its name carries the
          unread count the dot shows — the dot itself is decorative.
        */}
        <button
          type="button"
          className={`${styles.bellButton} ${styles.hitSlop}`}
          aria-label={plural('shell.notifications', unread).replace(/\{\{count\}\}/g, String(unread))}
        >
          <BellIcon />
          {unread > 0 && <span className={styles.badgeDot} aria-hidden="true" />}
        </button>

        <AvatarMenu
          onLogout={onLogout}
          initials={initials}
          label={t('shell.account')}
          profileLabel={t('nav.profile')}
          logoutLabel={t('shell.logout')}
        />
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
  initials,
  label,
  profileLabel,
  logoutLabel,
}: {
  onLogout: () => void;
  /** Empty until /student/me has answered, and when it never does. */
  initials: string;
  label: string;
  profileLabel: string;
  logoutLabel: string;
}) {
  const { dir } = useI18n();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const firstItemRef = useRef<HTMLAnchorElement>(null);

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
        className={`${styles.avatarButton} ${styles.hitSlop}`}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
      >
        <span className={styles.avatar} aria-hidden="true">
          {/*
            <bdi>: the initials take their own script's direction, isolated
            from the page's. Latin initials stay "AM" on an Arabic page, and
            Arabic ones read right to left as Arabic does — see initialsOf.
          */}
          {initials ? <bdi>{initials}</bdi> : <AvatarIcon />}
        </span>
        <ChevronDownIcon className={styles.avatarChevron} />
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
          {/*
            Profile lives here rather than in the mobile tab bar. A link, so it
            behaves like one (open in a new tab, the URL on hover); closing on
            click, without restoring focus — the route change moves it.
          */}
          <Link
            ref={firstItemRef}
            href="/profile"
            role="menuitem"
            className={styles.menuItem}
            onClick={() => setOpen(false)}
          >
            <NavIcon name="user" />
            {profileLabel}
          </Link>
          <button
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
