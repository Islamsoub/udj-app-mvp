'use client';

import type { ReactNode } from 'react';
import { NavIcon } from '@/components/shell/icons';
import { NAV_ITEMS } from '@/components/shell/nav-items';
import { useStudent } from '@/components/shell/StudentContext';
import type { ApiNotification } from '@/lib/api-types';
import { isolateLtrRuns } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { Card, CardStates, EmptyState } from './Card';
import { BellIcon } from './icons';
import { notificationWhen } from './relative-time';
import { ShortDate } from './ShortDate';
import styles from './dashboard.module.css';

type ChipIcon = (props: { className?: string }) => ReactNode;

/**
 * The sidebar's own icon for a section, by its route — the NavIcon component
 * and the name NAV_ITEMS gives it, not a copy of the paths. A notification
 * about grades then carries the Notes icon the student already knows from the
 * sidebar and the tab bar, and if that icon ever changes, the chip follows.
 */
function sectionIcon(path: string): ChipIcon {
  const item = NAV_ITEMS.find((nav) => nav.path === path);
  if (!item) throw new Error(`No sidebar section at ${path}`);
  const SectionIcon: ChipIcon = ({ className }) => <NavIcon name={item.icon} className={className} />;
  return SectionIcon;
}

/**
 * The chip for each notification type (backend NotificationType).
 *
 * ICONS: the sidebar's section icons, not dashboard.html:111-113's glyphs
 * (product owner, 2026-11-17 — design-known-divergences.md). GENERAL has no
 * section, so it keeps the bell.
 *
 * TINTS, unchanged:
 *   GRADES      jade-faint / jade-text    Notes icon       (Design's tint)
 *   ATTENDANCE  warning-bg / warning-INK  Présence icon    (Design's hue, darker
 *               ink: --warning on its own tint is 1.93:1 in light, under the
 *               3:1 a graphic needs; --warning-ink is 5.74:1)
 *   SCHEDULE    exam-bg / exam            Planning icon    (Design's tint)
 *   NEWS        info-bg / info            Actualités icon  (the news screen's
 *               "événements" hue; 3.21:1 light, 4.15:1 dark)
 *   GENERAL     sunken / ink2             bell             (neutral)
 *
 * The chip is decorative: the title says what happened, so colour and glyph
 * are never the only signal.
 */
const CHIPS: Record<string, { tone: string; Icon: ChipIcon }> = {
  GRADES: { tone: styles.chipGrades, Icon: sectionIcon('/grades') },
  ATTENDANCE: { tone: styles.chipAttendance, Icon: sectionIcon('/attendance') },
  SCHEDULE: { tone: styles.chipSchedule, Icon: sectionIcon('/schedule') },
  NEWS: { tone: styles.chipNews, Icon: sectionIcon('/news') },
  GENERAL: { tone: styles.chipGeneral, Icon: BellIcon },
};

/**
 * Notifications (dashboard.html:109-115; app.css:131-135): one row per
 * notification, a typed chip, the title, and when it arrived.
 *
 * Renders the shell's GET /student/notifications rather than making its own:
 * the topbar bell needs the same unread count on every route, and one response
 * read in two places cannot disagree with itself. The shell asks for
 * NOTIFICATIONS_PREVIEW_LIMIT (3), which is what Design shows.
 *
 * No "Tout voir": there is no notifications screen to go to yet.
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
  const { notificationsState: state } = useStudent();

  return (
    <Card title={t('dashboard.notifications.title')} className={className} index={index} animate={animate}>
      <CardStates
        state={state}
        skeleton={
          <div className={styles.notifList}>
            {[0, 1, 2].map((row) => (
              <div key={row} className={styles.notifRow}>
                <div className={`${styles.skeleton} ${styles.notifChip}`} />
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
  const chip = CHIPS[notification.type] ?? CHIPS.GENERAL;
  const title = lang === 'ar' ? notification.titleAr : notification.titleFr;

  return (
    <li className={styles.notifRow}>
      <span className={`${styles.notifChip} ${chip.tone}`} aria-hidden="true">
        <chip.Icon className={styles.notifChipIcon} />
      </span>
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

/** "09:12", "Hier", "Lundi", "10 juin" — in the page's language. */
function NotificationTime({ iso, now = Date.now() }: { iso: string; now?: number }) {
  const { t, lang } = useI18n();
  const when = notificationWhen(iso, now);

  switch (when.kind) {
    case 'time':
      // Mono, as Design draws it, and isolated LTR so Arabic cannot reorder it.
      return (
        <bdi dir="ltr" className="mono">
          {when.hours}:{when.minutes}
        </bdi>
      );
    case 'yesterday':
      return <>{t('dashboard.notifications.yesterday')}</>;
    case 'weekday': {
      const name = new Intl.DateTimeFormat(lang, { weekday: 'long' }).format(when.date);
      return <>{lang === 'fr' ? name.charAt(0).toLocaleUpperCase('fr') + name.slice(1) : name}</>;
    }
    case 'date':
      return <ShortDate date={when.date} now={now} />;
  }
}
