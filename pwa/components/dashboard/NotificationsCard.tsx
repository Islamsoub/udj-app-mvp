'use client';

import { getNotifications } from '@/lib/api-client';
import type { NotificationsResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { Card, CardStates, EmptyState } from './Card';
import { Interpolated } from './Interpolated';
import { BellIcon } from './icons';
import { useCardData } from './useCardData';
import styles from './dashboard.module.css';

/** Enough to fill the card without turning it into the notifications screen. */
const PREVIEW_LIMIT = 3;

/**
 * Unread count plus a short preview.
 *
 * Not a link: there is no notifications route in this milestone, and a card that
 * lifts on hover but goes nowhere is a broken promise. It gains an href when
 * that screen exists. The topbar bell and its popover are out of scope here.
 */
export function NotificationsCard({ index, animate, online }: { index: number; animate: boolean; online: boolean }) {
  const { t, lang } = useI18n();
  const state = useCardData<NotificationsResponse>(() => getNotifications(PREVIEW_LIMIT), online);

  return (
    <Card title={t('dashboard.notifications.title')} icon={<BellIcon />} index={index} animate={animate}>
      <CardStates
        state={state}
        skeleton={
          <div className={styles.skeletonStack}>
            <div className={`${styles.skeleton} ${styles.skeletonHero}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineWide}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineMedium}`} />
          </div>
        }
      >
        {(data) => {
          if (data.unreadCount === 0 && data.notifications.length === 0) {
            return <EmptyState body={t('dashboard.notifications.none')} />;
          }

          return (
            <div>
              <div className={`${styles.unreadCount} num`}>{data.unreadCount}</div>
              <p className={styles.heroCaption}>
                {data.unreadCount === 1 ? (
                  // Singular gets its own string: "1 non lues" is not French.
                  t('dashboard.notifications.unread_one')
                ) : (
                  <Interpolated
                    template={t('dashboard.notifications.unread')}
                    values={{ count: data.unreadCount }}
                  />
                )}
              </p>

              <ul className={styles.notificationList}>
                {data.notifications.map((notification) => (
                  <li key={notification.id} className={styles.notificationItem}>
                    {/* The dot marks unread; the count above says how many, so
                        the dot is decorative rather than a second announcement. */}
                    {!notification.isRead && <span className={styles.unreadDot} aria-hidden="true" />}
                    <span className={notification.isRead ? undefined : styles.notificationTitle}>
                      {lang === 'ar' ? notification.titleAr : notification.titleFr}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }}
      </CardStates>
    </Card>
  );
}
