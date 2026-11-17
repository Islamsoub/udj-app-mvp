'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getNotifications, markAllNotificationsRead, markNotificationRead } from '@/lib/api-client';
import type { NotificationsResponse } from '@/lib/api-types';
import { cacheKeyFor, isServedFromCache } from '@/lib/offline-cache';

/**
 * How many notifications the shell asks for: enough to fill the popover's list
 * (420px of 57px rows, with room to scroll). The dashboard card shows the first
 * NOTIFICATIONS_CARD_ROWS of the same response, so one request feeds both.
 */
export const NOTIFICATIONS_LIMIT = 20;
export const NOTIFICATIONS_CARD_ROWS = 3;

/** The offline-cache key of that one request, to ask whether it was served from the store. */
const CACHE_KEY = cacheKeyFor(`/student/notifications?limit=${NOTIFICATIONS_LIMIT}`);

export interface NotificationsStore {
  /** The list on screen: the last one that loaded, fresh or from the offline store. */
  data: NotificationsResponse | null;
  /**
   * How the last request went. 'loading' only until the first answer; after
   * that a refresh never drops the list — 'error' with data is "refresh failed,
   * this is the list from the last load" (bell-states.html, state 6).
   */
  status: 'loading' | 'ready' | 'error';
  /** The data came from the offline store, not the network (states 6 and 7). */
  fromCache: boolean;
  refresh: () => void;
  /** Optimistic; resolves false (and has rolled back) if the server refused. */
  markRead: (id: string) => Promise<boolean>;
  markAllRead: () => Promise<boolean>;
}

/**
 * The student's notifications — ONE list for the bell's dot, the popover and the
 * dashboard card, so the three can never disagree, including in the moment
 * after something is marked read.
 *
 * Marking is optimistic: the row and the count change at once, the PATCH goes
 * out, and only a refusal puts things back (and `onError` tells the student). A
 * refresh that lands while a PATCH is still in flight must not resurrect the
 * row it is marking, so pending ids are re-applied to every list that arrives.
 * A successful PATCH is followed by a refresh, which also rewrites the offline
 * copy — otherwise the store would still hold the row as unread and bring it
 * back the next time the list is read offline.
 */
export function useNotifications(online: boolean, onError: () => void): NotificationsStore {
  const [data, setDataState] = useState<NotificationsResponse | null>(null);
  /*
   * The same list, readable synchronously. Every change goes through setData,
   * so a mark can decide what it changed and what to roll back from the list as
   * it is NOW — a setState updater may run later, during render.
   */
  const dataRef = useRef<NotificationsResponse | null>(null);
  const setData = useCallback((next: NotificationsResponse | null) => {
    dataRef.current = next;
    setDataState(next);
  }, []);
  const [status, setStatus] = useState<NotificationsStore['status']>('loading');
  const [fromCache, setFromCache] = useState(false);

  /** Ids with a mark-read PATCH in flight; 'all' while read-all is. */
  const pending = useRef<Set<string>>(new Set());
  const pendingAll = useRef(false);
  /** Only the latest refresh may write; an older one landing late is dropped. */
  const seq = useRef(0);

  const onErrorRef = useRef(onError);
  onErrorRef.current = onError;

  /** A list from the server, with every in-flight mark still applied to it. */
  const withPending = useCallback((list: NotificationsResponse): NotificationsResponse => {
    if (!pendingAll.current && pending.current.size === 0) return list;
    let lowered = 0;
    const notifications = list.notifications.map((n) => {
      if (n.isRead) return n;
      if (pendingAll.current || pending.current.has(n.id)) {
        lowered += 1;
        return { ...n, isRead: true };
      }
      return n;
    });
    return {
      notifications,
      unreadCount: pendingAll.current ? 0 : Math.max(0, list.unreadCount - lowered),
    };
  }, []);

  const refresh = useCallback(() => {
    const mine = ++seq.current;
    getNotifications(NOTIFICATIONS_LIMIT)
      .then((list) => {
        if (mine !== seq.current) return;
        setData(withPending(list));
        setFromCache(CACHE_KEY !== null && isServedFromCache(CACHE_KEY));
        setStatus('ready');
      })
      .catch(() => {
        if (mine !== seq.current) return;
        // The list on screen, if any, stays: it is what state 6 shows.
        setStatus('error');
      });
  }, [withPending, setData]);

  // On mount, and again whenever the connection comes back.
  useEffect(() => {
    refresh();
  }, [refresh, online]);

  const markRead = useCallback(
    async (id: string) => {
      const current = dataRef.current;
      const target = current?.notifications.find((n) => n.id === id);
      if (!current || !target || target.isRead) return true;

      setData({
        unreadCount: Math.max(0, current.unreadCount - 1),
        notifications: current.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      });

      pending.current.add(id);
      try {
        await markNotificationRead(id);
        pending.current.delete(id);
        refresh();
        return true;
      } catch {
        pending.current.delete(id);
        // Back to unread, against the list as it is now — unless a read-all has
        // since covered it.
        const now = dataRef.current;
        const row = now?.notifications.find((n) => n.id === id);
        if (now && row?.isRead && !pendingAll.current) {
          setData({
            unreadCount: now.unreadCount + 1,
            notifications: now.notifications.map((n) => (n.id === id ? { ...n, isRead: false } : n)),
          });
        }
        onErrorRef.current();
        return false;
      }
    },
    [refresh, setData]
  );

  const markAllRead = useCallback(async () => {
    const snapshot = dataRef.current;
    if (!snapshot || snapshot.unreadCount === 0) return true;

    setData({
      unreadCount: 0,
      notifications: snapshot.notifications.map((n) => (n.isRead ? n : { ...n, isRead: true })),
    });

    pendingAll.current = true;
    try {
      await markAllNotificationsRead();
      pendingAll.current = false;
      refresh();
      return true;
    } catch {
      pendingAll.current = false;
      // Exactly the rows this call turned read go back, and the count with them.
      const wasUnread = new Set(snapshot.notifications.filter((n) => !n.isRead).map((n) => n.id));
      const now = dataRef.current;
      if (now) {
        setData({
          unreadCount: now.unreadCount + snapshot.unreadCount,
          notifications: now.notifications.map((n) =>
            wasUnread.has(n.id) && !pending.current.has(n.id) ? { ...n, isRead: false } : n
          ),
        });
      }
      onErrorRef.current();
      return false;
    }
  }, [refresh, setData]);

  return { data, status, fromCache, refresh, markRead, markAllRead };
}
