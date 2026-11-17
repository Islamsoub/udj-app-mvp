'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { NotificationsPopover } from '@/components/notifications/NotificationsPopover';
import notifStyles from '@/components/notifications/notifications.module.css';
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
  const { t } = useI18n();
  const { me, notificationsOpen, setNotificationsOpen } = useStudent();
  const [avatarOpen, setAvatarOpen] = useState(false);

  const initials = me ? initialsOf(me.firstName, me.lastName) : '';

  /*
   * One popover at a time (dashboard.html:157-158): opening the notifications —
   * from the bell or from the dashboard card's "Tout voir" — closes the avatar
   * menu, and opening the avatar menu closes the notifications.
   */
  useEffect(() => {
    if (notificationsOpen) setAvatarOpen(false);
  }, [notificationsOpen]);

  return (
    <header className={styles.topbar}>
      <PageTitle title={title} />
      <div className={styles.topbarActions}>
        <BellMenu open={notificationsOpen} onOpenChange={setNotificationsOpen} />

        <AvatarMenu
          open={avatarOpen}
          onOpenChange={(open) => {
            setAvatarOpen(open);
            if (open) setNotificationsOpen(false);
          }}
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
 * The bell and its notifications popover (bell-states.html; app.css:128).
 *
 * Its name carries the unread count the dot shows — the dot itself is
 * decorative. aria-haspopup="dialog": the panel holds a list of rows and a
 * button, which is a dialog's content, not a menu's.
 *
 * Closes on Escape, returning focus to the bell; on a click outside it and the
 * bell, handing focus back to the bell unless the click landed on another
 * control, which keeps it; and when a row takes the student to its section,
 * where the route change moves focus.
 */
function BellMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { plural, dir } = useI18n();
  const { unreadCount } = useStudent();
  const wrapRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const labelId = useId();

  const unread = unreadCount ?? 0;

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (wrapRef.current?.contains(event.target as Node)) return;
      const hadFocus = wrapRef.current?.contains(document.activeElement) ?? false;
      onOpenChange(false);
      if (hadFocus) {
        // After the click has moved focus wherever it moves it. A real control
        // (tabIndex >= 0) keeps it; anywhere else — the page body, or <main>,
        // which is tabIndex -1 as the skip link's target and takes focus from
        // any click inside it — hands it back to the bell.
        window.setTimeout(() => {
          const el = document.activeElement as HTMLElement | null;
          if (!el || el === document.body || el.tabIndex < 0) bellRef.current?.focus();
        }, 0);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onOpenChange(false);
        bellRef.current?.focus();
      }
    };

    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onOpenChange]);

  return (
    <div
      ref={wrapRef}
      className={notifStyles.bellWrap}
      // The panel grows from its top inline-end corner — the same dir-derived
      // origin as the avatar menu and the progress sweep.
      style={{ '--sweep-origin': dir === 'rtl' ? 'left' : 'right' } as React.CSSProperties}
    >
      <button
        ref={bellRef}
        type="button"
        className={`${styles.bellButton} ${styles.hitSlop}`}
        aria-label={plural('shell.notifications', unread).replace(/\{\{count\}\}/g, String(unread))}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? panelId : undefined}
        onClick={() => onOpenChange(!open)}
      >
        <BellIcon />
        {unread > 0 && <span className={styles.badgeDot} aria-hidden="true" />}
      </button>

      {open && <NotificationsPopover id={panelId} labelId={labelId} onNavigate={() => onOpenChange(false)} />}
    </div>
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
  open,
  onOpenChange,
  onLogout,
  initials,
  label,
  profileLabel,
  logoutLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLogout: () => void;
  /** Empty until /student/me has answered, and when it never does. */
  initials: string;
  label: string;
  profileLabel: string;
  logoutLabel: string;
}) {
  const { dir } = useI18n();
  const setOpen = onOpenChange;
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
        onClick={() => setOpen(!open)}
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
