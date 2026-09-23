'use client';

import { useCardData } from '@/components/dashboard/useCardData';
/*
 * Imported from Grades rather than copied, the same way Schedule imports it. It
 * is §5's skeleton crossfade with nothing screen-specific in it — stacked layers
 * in one grid cell, the outgoing one held for exactly one animation — and a
 * third copy would be a third thing to keep in step with the spec.
 */
import { StateLayers } from '@/components/grades/StateLayers';
import { useOnline } from '@/components/shell/useOnline';
import { getAttendance } from '@/lib/api-client';
import type { AttendanceResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { AttendanceView } from './AttendanceView';
import { AttendanceSkeleton } from './skeletons';
import styles from './attendance.module.css';

/**
 * Module scope, so the reference is stable: useCardData holds its fetcher in a
 * ref and re-runs only on retry or reconnect, and an inline arrow here would be
 * a new function on every render for no benefit.
 */
function loadAttendance(): Promise<AttendanceResponse> {
  return getAttendance();
}

/**
 * The attendance screen.
 *
 * States: the shell owns session expiry (a 401 whose refresh fails raises its
 * modal, once, through lib/api-client) and the offline banner; the five that
 * belong to the screen are here — skeleton with §5's 400ms floor, loaded, empty,
 * error with a retry, and offline. Same arrangement as Grades and Schedule, down
 * to the shared useCardData.
 *
 * ONE SEMESTER ONLY, which is worth knowing when reading the figures. GET
 * /student/attendance filters to the semester flagged `isCurrent` and returns
 * `{ overall: null, subjects: [] }` when none is — so everything on this screen
 * is the current semester's, and a student's earlier absences are not here and
 * are not counted in the percentage.
 */

export function Attendance() {
  const { t } = useI18n();
  const { online } = useOnline();

  const state = useCardData<AttendanceResponse>(loadAttendance, online);

  return (
    <>
      {/*
        §10 puts the page heading after the topbar actions in the reading order,
        which is here in the content area. The topbar's crossfading title is a
        label, not a heading, so this is the page's only h1.
      */}
      <h1 className={styles.heading}>{t('attendance.heading')}</h1>

      <div className={styles.screen}>
        <StateLayers loading={state.phase === 'loading'} skeleton={<AttendanceSkeleton />}>
          {state.phase === 'ready' && <Settled data={state.data} />}

          {state.phase === 'error' && (
            <div className={styles.stateBox} role="status" aria-live="polite">
              <p className={styles.stateText}>{t('attendance.state.error')}</p>
              <button type="button" className={styles.retryButton} onClick={state.retry}>
                {t('actions.retry')}
              </button>
            </div>
          )}

          {state.phase === 'offline' && (
            <div className={styles.stateBox} role="status" aria-live="polite">
              {/*
                Nothing is cached — this app has no service worker and no local
                database yet — so there is no stale figure to fall back to and no
                last-sync time to disclose. The shell's banner already says the
                device is offline; this says what that costs on this screen. No
                retry: it refetches itself the moment the connection returns.
              */}
              <p className={styles.stateText}>{t('attendance.state.offline')}</p>
            </div>
          )}
        </StateLayers>
      </div>
    </>
  );
}

/**
 * A successful response, sorted into its three shapes.
 *
 * THE TWO EMPTIES ARE DIFFERENT NEWS and must not share a message.
 *
 *   • NOTHING RECORDED — no current semester, no records, or session lengths
 *     that could not be resolved, all of which land as a null `overall` or a
 *     null `percentage`. This one means the screen has no data, and says so.
 *
 *   • NO ABSENCES — records exist, the student attended all of them. This is
 *     good news and is written as good news. Reusing the "nothing recorded"
 *     wording here would tell a student with a perfect record that the
 *     university has lost their attendance, which is both wrong and alarming;
 *     it gets the percentage and the gauge, because there is a real figure to
 *     show, and only the list is replaced.
 */
function Settled({ data }: { data: AttendanceResponse }) {
  const { t } = useI18n();

  const overall = data.overall;
  const percentage = overall?.percentage ?? null;

  if (overall === null || percentage === null || overall.total === 0) {
    return (
      <div className={styles.emptyBox}>
        <p className={styles.emptyTitle}>{t('attendance.empty.none.title')}</p>
        <p className={styles.emptyText}>{t('attendance.empty.none.body')}</p>
      </div>
    );
  }

  return (
    <AttendanceView overall={overall} subjects={data.subjects} percentage={percentage} />
  );
}
