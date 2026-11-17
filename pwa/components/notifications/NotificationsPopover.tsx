'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useRef } from 'react';
import { BellIcon } from '@/components/dashboard/icons';
import { useStudent } from '@/components/shell/StudentContext';
import type { ApiNotification } from '@/lib/api-types';
import { isolateLtrRuns } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { NotificationChip, NotificationTime, notificationHref } from './NotificationParts';
import styles from './notifications.module.css';

/**
 * The panel under the topbar bell — bell-states.html's eight states, decided
 * from the shell's one notifications list (StudentContext):
 *
 *   1 loaded             a list, unread rows bold with the jade dot
 *   2 after mark-all     the same list, all read; no count, no button
 *   3 loading            no list yet: three skeleton rows
 *   4 empty              the list loaded and has nothing in it
 *   5 error, no cache    the request failed and there is nothing to show
 *   6 error with cache   a list is on screen, but the last refresh failed (or
 *                        was answered from the offline store while online)
 *   7 offline, cached    a list from the offline store, the "Hors ligne" strip,
 *                        "Tout marquer comme lu" disabled
 *   8 offline, nothing   no connection and nothing stored
 *
 * The mark-all button follows bell-states.html: shown while something is unread
 * (states 1, 6, 7), disabled offline (7), absent when nothing is unread (2).
 *
 * Focus: moves into the panel when it opens — onto "Tout marquer comme lu" if it
 * can be used, else the first row, else the panel itself — so a keyboard user
 * lands in it rather than behind it. Closing is the Topbar's (Escape, outside
 * click, a row that navigates).
 */
export function NotificationsPopover({
  id,
  labelId,
  onNavigate,
}: {
  id: string;
  labelId: string;
  /** A row took the student to its section: the popover closes. */
  onNavigate: () => void;
}) {
  const { t, plural } = useI18n();
  const router = useRouter();
  const { notifications, online } = useStudent();
  const { data, status, fromCache, refresh, markRead, markAllRead } = notifications;

  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    const target =
      panel.querySelector<HTMLButtonElement>('button[data-markall]:not(:disabled)') ??
      panel.querySelector<HTMLButtonElement>('button[data-row]') ??
      panel;
    target.focus();
    // Once, on open: later re-renders (a refresh landing) must not pull focus
    // back to the top while the student is moving through the rows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const unread = data?.unreadCount ?? 0;
  const hasList = data !== null && data.notifications.length > 0;

  const open = (notification: ApiNotification) => {
    // Optimistic: the row is read now; a refusal rolls it back and the shell
    // says so, wherever the student has gone by then.
    void markRead(notification.id);
    const href = notificationHref(notification.type);
    if (href) {
      onNavigate();
      router.push(href);
    }
  };

  let body: React.ReactNode;
  if (data === null) {
    if (status === 'loading') {
      body = (
        <div aria-hidden="true">
          {[0, 1, 2].map((row) => (
            <div key={row} className={styles.sk}>
              <i className={`${styles.skBlock} ${styles.skChip}`} />
              <div className={styles.skLines}>
                <i className={`${styles.skBlock} ${styles.skTitle}`} />
                <i className={`${styles.skBlock} ${styles.skTime}`} />
              </div>
            </div>
          ))}
          <span className={styles.srOnly} role="status">
            {t('bell.loading')}
          </span>
        </div>
      );
    } else if (!online) {
      body = (
        <State icon={<OfflineIcon />} title={t('bell.offline_title')} body={t('bell.offline_body')} />
      );
    } else {
      body = (
        <State
          icon={<WarnIcon />}
          error
          title={t('bell.error_title')}
          body={t('bell.error_body')}
          action={{ label: t('actions.retry'), onClick: refresh }}
        />
      );
    }
  } else if (!hasList) {
    body = <State icon={<BellIcon />} title={t('bell.empty_title')} body={t('bell.empty_body')} />;
  } else {
    const strip = !online ? 'offline' : status === 'error' || fromCache ? 'error' : null;
    body = (
      <>
        {strip && (
          <p className={`${styles.strip} ${strip === 'error' ? styles.stripError : ''}`} role="status">
            <span className={styles.stripDot} aria-hidden="true" />
            {t(strip === 'error' ? 'bell.strip_error' : 'bell.strip_offline')}
          </p>
        )}
        <ul className={styles.list}>
          {data.notifications.map((notification) => (
            <li key={notification.id}>
              <Row notification={notification} onOpen={open} />
            </li>
          ))}
        </ul>
      </>
    );
  }

  return (
    <div
      ref={panelRef}
      id={id}
      className={styles.panel}
      role="dialog"
      aria-labelledby={labelId}
      tabIndex={-1}
    >
      <div className={styles.head}>
        <h2 id={labelId} className={styles.title}>
          {t('bell.title')}
        </h2>
        {hasList && unread > 0 && (
          <span className={styles.count}>
            <span aria-hidden="true">{unread}</span>
            <span className={styles.srOnly}>{plural('bell.count', unread).replace(/\{\{count\}\}/g, String(unread))}</span>
          </span>
        )}
        {hasList && unread > 0 && (
          <button
            type="button"
            data-markall=""
            className={styles.markAll}
            disabled={!online}
            onClick={() => {
              // The button is about to disappear (nothing left unread, state 2),
              // and focus must not fall to the page with it: it moves to the
              // panel. A refusal brings the button back, where it can be reached.
              panelRef.current?.focus();
              void markAllRead();
            }}
          >
            {t('bell.mark_all')}
          </button>
        )}
      </div>
      {body}
    </div>
  );
}

function Row({ notification, onOpen }: { notification: ApiNotification; onOpen: (n: ApiNotification) => void }) {
  const { t, lang } = useI18n();
  const title = lang === 'ar' ? notification.titleAr : notification.titleFr;
  const unread = !notification.isRead;

  return (
    <button
      type="button"
      data-row=""
      className={`${styles.row} ${unread ? styles.unread : styles.read}`}
      onClick={() => onOpen(notification)}
    >
      <NotificationChip type={notification.type} />
      <span className={styles.rowBody}>
        <span className={styles.rowTitle}>
          {isolateLtrRuns(title)}
          {unread && <span className={styles.srOnly}>{t('dashboard.notifications.unread_sr')}</span>}
        </span>
        <span className={styles.rowTime}>
          <NotificationTime iso={notification.createdAt} />
        </span>
      </span>
      {unread && <span className={styles.dot} aria-hidden="true" />}
    </button>
  );
}

function State({
  icon,
  error = false,
  title,
  body,
  action,
}: {
  icon: React.ReactNode;
  error?: boolean;
  title: string;
  body: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className={styles.state} role="status">
      <span className={`${styles.stateIcon} ${error ? styles.stateIconError : ''}`} aria-hidden="true">
        {icon}
      </span>
      <b className={styles.stateTitle}>{title}</b>
      <span className={styles.stateBody}>{body}</span>
      {action && (
        <button type="button" className={styles.retry} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}

/** bell-states.html's "warn" glyph. */
function WarnIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v6M12 16.5v.5" />
    </svg>
  );
}

/** bell-states.html's "off" glyph: Wi-Fi arcs, struck through. */
function OfflineIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true">
      <path d="M2 9a15 15 0 0 1 20 0M6 13a9 9 0 0 1 12 0M10 17a4 4 0 0 1 4 0" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );
}
