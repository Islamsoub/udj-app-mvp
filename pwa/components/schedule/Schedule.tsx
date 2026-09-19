'use client';

import { useState } from 'react';
import { useCardData } from '@/components/dashboard/useCardData';
import { useOnline } from '@/components/shell/useOnline';
import { getSchedule } from '@/lib/api-client';
import type { ScheduleResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
/*
 * Imported from Grades rather than copied. It is §5's skeleton crossfade with
 * nothing screen-specific in it — stacked layers in one grid cell, the outgoing
 * one held for exactly one animation — and a second copy would be a second thing
 * to keep in step with the spec.
 */
import { StateLayers } from '@/components/grades/StateLayers';
import { ScheduleView } from './ScheduleView';
import { ScheduleSkeleton } from './skeletons';
import { startOfDay } from './week';
import styles from './schedule.module.css';

/**
 * Module scope, so the reference is stable: useCardData holds its fetcher in a
 * ref and re-runs only on retry or reconnect, and an inline arrow here would be
 * a new function on every render for no benefit.
 */
function loadSchedule(): Promise<ScheduleResponse> {
  return getSchedule();
}

/**
 * The schedule screen.
 *
 * States: the shell owns session expiry (a 401 whose refresh fails raises its
 * modal, once, through lib/api-client) and the offline banner; the five that
 * belong to the screen are here — skeleton with §5's 400ms floor, loaded, empty,
 * error with a retry, and offline. Same arrangement as Grades, down to the
 * shared useCardData.
 */
export function Schedule() {
  const { t } = useI18n();
  const { online } = useOnline();

  const state = useCardData<ScheduleResponse>(loadSchedule, online);

  /*
   * Today, taken once per mount. Everything downstream — which column is marked,
   * which week opens, whether "Cette semaine" is disabled — has to agree on what
   * day it is, and re-reading the clock per component would let two of them
   * disagree across a midnight boundary mid-render.
   */
  const [today] = useState(() => startOfDay(new Date()));

  return (
    <>
      {/*
        §10 puts the page heading after the topbar actions in the reading order,
        which is here in the content area. The topbar's crossfading title is a
        label, not a heading, so this is the page's only h1.
      */}
      <h1 className={styles.heading}>{t('schedule.heading')}</h1>

      <div className={styles.screen}>
        <StateLayers loading={state.phase === 'loading'} skeleton={<ScheduleSkeleton />}>
          {state.phase === 'ready' &&
            (state.data.entries.length === 0 ? (
              /*
                NOTHING PUBLISHED AT ALL — distinct from a week or a day with no
                classes, which the views say themselves. This one means the
                faculty has not put a timetable up for the semester, so there is
                no grid to page through and no toggle worth showing.
              */
              <div className={styles.emptyBox}>
                <p className={styles.emptyTitle}>{t('schedule.empty.title')}</p>
                <p className={styles.emptyText}>{t('schedule.empty.body')}</p>
              </div>
            ) : (
              <ScheduleView data={state.data} today={today} />
            ))}

          {state.phase === 'error' && (
            <div className={styles.stateBox} role="status" aria-live="polite">
              <p className={styles.emptyText}>{t('schedule.state.error')}</p>
              <button type="button" className={styles.retryButton} onClick={state.retry}>
                {t('actions.retry')}
              </button>
            </div>
          )}

          {state.phase === 'offline' && (
            <div className={styles.stateBox} role="status" aria-live="polite">
              {/*
                Nothing is cached — this app has no service worker and no local
                database yet — so there is no stale timetable to fall back to and
                no last-sync time to disclose. The shell's banner already says the
                device is offline; this says what that costs on this screen. No
                retry: it refetches itself the moment the connection returns.
              */}
              <p className={styles.emptyText}>{t('schedule.state.offline')}</p>
            </div>
          )}
        </StateLayers>
      </div>
    </>
  );
}
