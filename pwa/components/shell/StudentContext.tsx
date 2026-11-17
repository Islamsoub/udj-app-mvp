'use client';

import { createContext, useContext, useRef, type ReactNode } from 'react';
import { useCardData, type CardState } from '@/components/dashboard/useCardData';
import { getMe, getNotifications } from '@/lib/api-client';
import type { MeResponse, NotificationsResponse } from '@/lib/api-types';

/**
 * How many notifications the shell asks for. It was the dashboard card's own
 * PREVIEW_LIMIT: the card now renders from this response instead of fetching its
 * own, so the shell asks for exactly what the card shows. Enough to fill the
 * card without turning it into the notifications screen.
 */
export const NOTIFICATIONS_PREVIEW_LIMIT = 3;

interface StudentContextValue {
  /** The live state of GET /student/me, for surfaces with their own skeleton. */
  meState: CardState<MeResponse>;
  /** The last /student/me that loaded, kept through a later refetch or failure. */
  me: MeResponse | null;
  /** The live state of GET /student/notifications, for the dashboard card. */
  notificationsState: CardState<NotificationsResponse>;
  /** The last unread count that loaded, or null when none ever has. */
  unreadCount: number | null;
}

const StudentContext = createContext<StudentContextValue | null>(null);

/**
 * The student's own record and notifications, fetched ONCE for the whole shell.
 *
 * The topbar is on every route, and it shows the initials and the unread dot on
 * every route — so these two requests belong where the topbar does, not to the
 * dashboard. The dashboard greeting and the Notifications card read the same
 * responses from here rather than making their own, which is what keeps the
 * name in the greeting, the initials in the avatar and the count behind the dot
 * from ever disagreeing.
 *
 * Mounted by AppShell only once the session gate has opened. Rendered any
 * earlier, these requests would go out before a token exists.
 *
 * Offline: /student/me is on lib/offline-cache's allow-list, so the initials
 * survive a dropped connection. /student/notifications is not, so offline there
 * is no unread count and no dot — existing behaviour, deliberately not changed.
 */
export function StudentProvider({ online, children }: { online: boolean; children: ReactNode }) {
  const meState = useCardData(() => getMe(), online);
  const notificationsState = useCardData(
    () => getNotifications(NOTIFICATIONS_PREVIEW_LIMIT),
    online
  );

  /*
   * useCardData drops back to 'loading' on every refetch — reconnecting is one —
   * which is right for a card, where a skeleton is the honest picture. The
   * topbar is not a card: initials that flicker to a placeholder glyph and back
   * each time the network returns read as the student being signed out for a
   * moment. So the topbar reads the last good value instead.
   */
  const me = useLatestReady(meState);
  const notifications = useLatestReady(notificationsState);

  return (
    <StudentContext.Provider
      value={{
        meState,
        me,
        notificationsState,
        unreadCount: notifications?.unreadCount ?? null,
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
