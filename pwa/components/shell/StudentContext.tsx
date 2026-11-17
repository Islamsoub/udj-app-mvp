'use client';

import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from 'react';
import { useCardData, type CardState } from '@/components/dashboard/useCardData';
import { getMe } from '@/lib/api-client';
import type { MeResponse, NotificationsResponse } from '@/lib/api-types';
import { NOTIFICATIONS_CARD_ROWS, useNotifications, type NotificationsStore } from './useNotifications';

interface StudentContextValue {
  /** The live state of GET /student/me, for surfaces with their own skeleton. */
  meState: CardState<MeResponse>;
  /** The last /student/me that loaded, kept through a later refetch or failure. */
  me: MeResponse | null;
  /** The one notifications list: the bell, the popover and the dashboard card. */
  notifications: NotificationsStore;
  /** The same list as the dashboard card's CardState, cut to the card's rows. */
  notificationsCard: CardState<NotificationsResponse>;
  /** The unread count on screen, or null before any list has loaded. */
  unreadCount: number | null;
  /** Whether the bell's popover is open — the bell and the card's "Tout voir" both open it. */
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  /** The shell's connectivity, for the popover's offline strip and mark-all. */
  online: boolean;
}

const StudentContext = createContext<StudentContextValue | null>(null);

/**
 * The student's own record and notifications, fetched ONCE for the whole shell.
 *
 * The topbar is on every route, and it shows the initials and the unread dot on
 * every route — so these requests belong where the topbar does, not to the
 * dashboard. The greeting, the Notifications card and the bell's popover read
 * the same data from here rather than making their own, which is what keeps the
 * name, the initials, the dot, the popover's count and the card from ever
 * disagreeing — including right after something is marked read.
 *
 * Mounted by AppShell only once the session gate has opened. Rendered any
 * earlier, these requests would go out before a token exists.
 *
 * Offline: /student/me and /student/notifications are both on lib/offline-cache's
 * allow-list, so the initials, the dot and the last list survive a dropped
 * connection.
 */
export function StudentProvider({
  online,
  onMarkReadFailed,
  children,
}: {
  online: boolean;
  /** Raised when the server refuses a mark-as-read, after the rows are rolled back. */
  onMarkReadFailed: () => void;
  children: ReactNode;
}) {
  const meState = useCardData(() => getMe(), online);
  const notifications = useNotifications(online, onMarkReadFailed);
  const [notificationsOpen, setOpen] = useState(false);

  /*
   * Opening the popover refreshes the list, so it is never stale while the app
   * stays open — notifications arrive without anything else asking for them.
   */
  const { refresh } = notifications;
  const setNotificationsOpen = useCallback(
    (open: boolean) => {
      setOpen(open);
      if (open) refresh();
    },
    [refresh]
  );

  /*
   * useCardData drops back to 'loading' on every refetch — reconnecting is one —
   * which is right for a card, where a skeleton is the honest picture. The
   * topbar is not a card: initials that flicker to a placeholder glyph and back
   * each time the network returns read as the student being signed out for a
   * moment. So the topbar reads the last good value instead.
   */
  const me = useLatestReady(meState);

  const notificationsCard = useMemo<CardState<NotificationsResponse>>(() => {
    const { data, status } = notifications;
    if (data) {
      return {
        phase: 'ready',
        data: { ...data, notifications: data.notifications.slice(0, NOTIFICATIONS_CARD_ROWS) },
      };
    }
    if (status === 'loading') return { phase: 'loading' };
    return online ? { phase: 'error', retry: refresh } : { phase: 'offline', retry: refresh };
  }, [notifications, online, refresh]);

  return (
    <StudentContext.Provider
      value={{
        meState,
        me,
        notifications,
        notificationsCard,
        unreadCount: notifications.data?.unreadCount ?? null,
        notificationsOpen,
        setNotificationsOpen,
        online,
      }}
    >
      {children}
    </StudentContext.Provider>
  );
}

/** The data of the most recent 'ready' state, or null before the first. */
function useLatestReady<T>(state: CardState<T>): T | null {
  const latest = useRef<T | null>(null);
  if (state.phase === 'ready') latest.current = state.data;
  return latest.current;
}

export function useStudent(): StudentContextValue {
  const value = useContext(StudentContext);
  if (!value) throw new Error('useStudent must be used inside StudentProvider');
  return value;
}
