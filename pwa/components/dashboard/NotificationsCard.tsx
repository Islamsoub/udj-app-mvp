'use client';

import { getNotifications } from '@/lib/api-client';
import type { NotificationsResponse } from '@/lib/api-types';
import { isolateLtrRuns } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { Card, CardStates, EmptyState } from './Card';
import { Interpolated } from './Interpolated';
import { BellIcon, NotifAttendanceIcon, NotifExamIcon, NotifGradesIcon } from './icons';
import { useCardData } from './useCardData';
import styles from './dashboard.module.css';

/** Enough to fill the card without turning it into the notifications screen. */
const PREVIEW_LIMIT = 3;

type IconComponent = (props: { className?: string }) => React.ReactElement;

/**
 * Dashboard Spec §6 ③: the chip is coloured per type. The spec draws three:
 * grades (jade-faint / jade-text), attendance (warning-bg) and the exam
 * calendar (exam-bg / exam). SCHEDULE takes the calendar chip, because the
 * spec's exam-calendar notice is a schedule notice.
 *
 * Icon on chip, light / dark (WCAG 2.x, chip composited on --surface):
 *   grades      --jade-text   5.54 : 1 / 6.34 : 1
 *   attendance  --warning-ink 5.73 : 1 / 6.05 : 1
 *   schedule    --exam        3.64 : 1 / 4.19 : 1
 * --warning, the spec's attendance icon colour, is 1.93 : 1 in light, under the
 * 3 : 1 a graphic needs, so the attendance glyph takes --warning-ink as the
 * ring's near stroke does (OVERRIDES R2-near-ring).
 *
 * Any other type (GENERAL, NEWS, or one added later) has no spec chip and falls
 * back to the base jade chip with the bell. Flagged in PROGRESS.md.
 */
const CHIP: Record<string, { tone: string; Icon: IconComponent }> = {
  GRADES: { tone: styles.chipGrades, Icon: NotifGradesIcon },
  ATTENDANCE: { tone: styles.chipAttendance, Icon: NotifAttendanceIcon },
  SCHEDULE: { tone: styles.chipSchedule, Icon: NotifExamIcon },
};

const FALLBACK_CHIP = { tone: styles.chipGrades, Icon: BellIcon };

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
    <Card title={t('dashboard.notifications.title')} index={index} animate={animate}>
      <CardStates
        state={state}
        skeleton={
          /*
           * The loaded card's own boxes, emptied: the count and caption are one
           * line of ghost text each, in their own type and font mix (see
           * .skeletonTextLine), and each of the
           * PREVIEW_LIMIT rows keeps its padding, hairline, gap and chip, with
           * one title line. So the skeleton's height is the loaded card's
           * whenever the server returns PREVIEW_LIMIT one-line titles. A title
           * that wraps adds its extra lines (see PROGRESS.md).
           */
          <div>
            <span className={`${styles.unreadCount} ${styles.skeletonTextLine} ${styles.skeletonCount} num`}>0</span>
            {/* The caption holds a .num figure ("2 non lues"). */}
            <span className={`${styles.notificationCaption} ${styles.skeletonTextLine} ${styles.skeletonW40}`}>
              <span className="num">0</span>
              {'\u00a0'}
            </span>
            <ul className={styles.notificationList}>
              {Array.from({ length: PREVIEW_LIMIT }, (_, i) => (
                <li key={i} className={styles.notificationItem}>
                  <span className={`${styles.notificationChip} ${styles.skeleton}`} />
                  <span className={`${styles.notificationText} ${styles.skeletonTextLine} ${styles.skeletonW70}`}>{'\u00a0'}</span>
                </li>
              ))}
            </ul>
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
              <p className={styles.notificationCaption}>
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
                {data.notifications.map((notification) => {
                  const { tone, Icon } = CHIP[notification.type] ?? FALLBACK_CHIP;
                  return (
                    <li key={notification.id} className={styles.notificationItem}>
                      <span className={`${styles.notificationChip} ${tone}`} aria-hidden="true">
                        <Icon className={styles.notificationChipIcon} />
                      </span>
                      <span
                        className={`${styles.notificationText} ${notification.isRead ? '' : styles.notificationTitle}`}
                      >
                        {isolateLtrRuns(lang === 'ar' ? notification.titleAr : notification.titleFr)}
                      </span>
                      {/* The dot marks unread; the count above says how many, so
                          the dot is decorative rather than a second announcement.
                          The chip now holds the row's start, so it sits at the end. */}
                      {!notification.isRead && <span className={styles.unreadDot} aria-hidden="true" />}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        }}
      </CardStates>
    </Card>
  );
}
