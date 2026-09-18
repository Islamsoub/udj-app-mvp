'use client';

import { getAttendance } from '@/lib/api-client';
import type { AttendanceResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { Card, CardStates, EmptyState } from './Card';
import { Interpolated } from './Interpolated';
import { AttendanceIcon } from './icons';
import { Ring } from './Ring';
import { useCardData } from './useCardData';
import styles from './dashboard.module.css';

/**
 * Assiduité, with the §5 gauge.
 *
 * `overall` is null when no semester is marked current, and `percentage` is
 * separately null when no session lengths could be resolved. Either way there is
 * no figure to draw, so the ring is skipped entirely rather than rendered at
 * zero — an empty gauge reads as "you attended nothing", which is a different
 * and much worse claim than "nothing has been recorded".
 */
export function AttendanceCard({ index, animate, online }: { index: number; animate: boolean; online: boolean }) {
  const { t } = useI18n();
  const state = useCardData<AttendanceResponse>(() => getAttendance(), online);

  return (
    <Card
      title={t('dashboard.attendance.title')}
      icon={<AttendanceIcon />}
      href="/attendance"
      index={index}
      animate={animate}
    >
      <CardStates
        state={state}
        skeleton={
          <div className={styles.skeletonRow}>
            <div className={`${styles.skeleton} ${styles.skeletonRing}`} />
            <div className={styles.skeletonStack} style={{ flex: 1 }}>
              <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineWide}`} />
              <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            </div>
          </div>
        }
      >
        {(data) => {
          const overall = data.overall;

          if (overall === null || overall.percentage === null) {
            return <EmptyState body={t('dashboard.attendance.empty')} />;
          }

          const percentage = overall.percentage;

          return (
            <div className={styles.heroRow}>
              <Ring
                percentage={percentage}
                label={t('dashboard.attendance.title') + ' ' + Math.round(percentage) + '%'}
              />
              <p className={styles.stateText}>
                {/* Interpolated, not t(...) with params: the two counts have to
                    land on the Latin face without taking the Arabic words with
                    them. */}
                <Interpolated
                  template={t('dashboard.attendance.sessions')}
                  values={{ present: overall.present, total: overall.total }}
                />
              </p>
            </div>
          );
        }}
      </CardStates>
    </Card>
  );
}
