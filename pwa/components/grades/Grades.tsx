'use client';

import { useState } from 'react';
import { useCardData } from '@/components/dashboard/useCardData';
import { useOnline } from '@/components/shell/useOnline';
import { getGrades, getGradesAllSemesters } from '@/lib/api-client';
import { useI18n } from '@/lib/i18n';
import { GradesView, type GradesBundle } from './GradesView';
import { orderSemesters } from './model';
import { ScreenSkeleton } from './skeletons';
import { StateLayers } from './StateLayers';
import styles from './grades.module.css';

/**
 * Opening the screen: the current semester's grades and the semester list.
 *
 * Both in one round trip rather than two sequential ones, and both are needed
 * before anything can render — the list decides which tabs exist, and the
 * current semester decides which of them is selected. `allSemesters=true`
 * deliberately does not say which semester is current; the plain call does, by
 * being the one the backend answers with `isCurrent`.
 *
 * Module scope, so the reference is stable: useCardData holds its fetcher in a
 * ref and re-runs only on retry or reconnect, and an inline arrow here would be
 * a new function on every render for no benefit.
 */
async function loadBundle(): Promise<GradesBundle> {
  const [current, all] = await Promise.all([getGrades(), getGradesAllSemesters()]);
  return { current, semesters: orderSemesters(current, all.semesters) };
}

/**
 * The grades screen.
 *
 * States: the shell owns session expiry (a 401 whose refresh fails raises its
 * modal, once, through lib/api-client) and the offline banner; the five that
 * belong to the screen are here and in GradesView — skeleton with §5's 400ms
 * floor, loaded, empty, error with a retry, and offline.
 */
export function Grades() {
  const { t } = useI18n();
  const { online } = useOnline();

  const state = useCardData<GradesBundle>(loadBundle, online);

  /*
   * The chosen semester lives here, above the loaded view, because reconnecting
   * sends the screen back through its loading phase and unmounts everything
   * below — and the tab a student picked must survive that. Null means "the
   * current semester", which is not known until the bundle arrives; GradesView
   * resolves it.
   */
  const [selectedId, setSelectedId] = useState<string | null>(null);

  return (
    <>
      {/*
        §10 puts the page heading after the topbar actions in the reading order,
        which is here in the content area. The topbar's crossfading title is a
        label, not a heading, so this is the page's only h1.
      */}
      <h1 className={styles.heading}>{t('grades.heading')}</h1>

      <div className={styles.screen}>
        <StateLayers loading={state.phase === 'loading'} skeleton={<ScreenSkeleton />}>
          {state.phase === 'ready' && (
            <GradesView
              bundle={state.data}
              online={online}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          )}

          {state.phase === 'error' && (
            <div className={styles.stateBox} role="status" aria-live="polite">
              <p className={styles.stateText}>{t('grades.state.error')}</p>
              <button type="button" className={styles.retryButton} onClick={state.retry}>
                {t('actions.retry')}
              </button>
            </div>
          )}

          {state.phase === 'offline' && (
            <div className={styles.stateBox} role="status" aria-live="polite">
              {/*
                Nothing is cached — this app has no service worker and no local
                database yet — so there is no stale table to fall back to and no
                last-sync time to disclose. The shell's banner already says the
                device is offline; this says what that costs on this screen.
              */}
              <p className={styles.stateText}>{t('grades.state.offline')}</p>
            </div>
          )}
        </StateLayers>
      </div>
    </>
  );
}
