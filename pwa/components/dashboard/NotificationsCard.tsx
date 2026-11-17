'use client';

import { NotificationChip, NotificationTime } from '@/components/notifications/NotificationParts';
import { useStudent } from '@/components/shell/StudentContext';
import type { ApiNotification } from '@/lib/api-types';
import { isolateLtrRuns } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { Card, CardStates, EmptyState } from './Card';
import styles from './dashboard.module.css';

/**
 * Notifications (dashboard.html:109-115; app.css:131-135): one row per
 * notification, a typed chip, the title, and when it arrived.
 *
 * The first rows of the shell's one notifications list — the same list as the
 * bell's dot and its popover, so marking something read anywhere changes all
 * three at once. Chip and time come from components/notifications, shared with
 * the popover.
 *
 * "Tout voir" (dashboard.html:109) opens the bell's popover, as Design's
 * #dash-notif-all does; there is no notifications screen.
 */
export function NotificationsCard({
  index,
  animate,
  className,
}: {
  index: number;
  animate: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const { notificationsCard: state, setNotificationsOpen } = useStudent();

  return (
    <Card
      title={t('dashboard.notifications.title')}
      action={{ label: t('dashboard.notifications.see_all'), onClick: () => setNotificationsOpen(true) }}
      className={className}
      index={index}
      animate={animate}
    >
      <CardStates
        state={state}
        skeleton={
          <div className={styles.notifList}>
            {[0, 1, 2].map((row) => (
              <div key={row} className={styles.notifRow}>
                <div className={`${styles.skeleton} ${styles.notifChipSkeleton}`} />
                <div className={styles.skeletonStack} style={{ flex: 1, gap: 6 }}>
                  <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineWide}`} />
                  <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                </div>
              </div>
            ))}
          </div>
        }
      >
        {(data) =>
          data.notifications.length === 0 ? (
            <EmptyState body={t('dashboard.notifications.none')} />
          ) : (
            <ul className={styles.notifList}>
              {data.notifications.map((notification) => (
                <NotificationRow key={notification.id} notification={notification} />
              ))}
            </ul>
          )
        }
      </CardStates>
    </Card>
  );
}

function NotificationRow({ notification }: { notification: ApiNotification }) {
  const { t, lang } = useI18n();
  const title = lang === 'ar' ? notification.titleAr : notification.titleFr;

  return (
    <li className={styles.notifRow}>
      <NotificationChip type={notification.type} />
      <div className={styles.notifText}>
        <p className={styles.notifTitle}>
          {isolateLtrRuns(title)}
          {/* Design draws every row alike; the unread state is still told to
              assistive tech, and the bell carries the count for everyone. */}
          {!notification.isRead && <span className={styles.srOnly}>{t('dashboard.notifications.unread_sr')}</span>}
        </p>
        <p className={styles.notifTime}>
          <NotificationTime iso={notification.createdAt} />
        </p>
      </div>
    </li>
  );
}
