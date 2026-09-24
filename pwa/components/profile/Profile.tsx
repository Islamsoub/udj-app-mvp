'use client';

import { useCardData } from '@/components/dashboard/useCardData';
/*
 * Imported, as the other screens do: §5's skeleton crossfade with nothing
 * screen-specific in it.
 */
import { StateLayers } from '@/components/grades/StateLayers';
import { useOnline } from '@/components/shell/useOnline';
import { getMe } from '@/lib/api-client';
import type { MeResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { AccountActions } from './AccountActions';
import { Appearance } from './Appearance';
import { NotificationPrefs } from './NotificationPrefs';
import { ProfileSkeleton } from './skeletons';
import { StudentCard } from './StudentCard';
import styles from './profile.module.css';

/** Module scope, so the reference is stable across renders. */
function loadMe(): Promise<MeResponse> {
  return getMe();
}

/**
 * The profile screen.
 *
 * Two halves with different needs, and the states follow the split:
 *
 *   • THE ACCOUNT — details, studies, progress, contact, notification
 *     preferences — comes from GET /student/me and goes through the usual
 *     states: skeleton with §5's 400ms floor, loaded, error with a retry,
 *     offline. The shell owns session expiry and the offline banner. "Empty" is
 *     not a state /me can be in — it answers a student or a 404 — so emptiness
 *     is handled per field instead: missing contact lines and unpublished
 *     figures are omitted or named, never shown blank.
 *
 *   • THIS DEVICE — theme, language, sign out — needs no network and is always
 *     rendered, outside those states, so it keeps working offline or after the
 *     account failed to load.
 */
export function Profile() {
  const { t } = useI18n();
  const { online } = useOnline();

  const state = useCardData<MeResponse>(loadMe, online);

  return (
    <>
      <h1 className={styles.heading}>{t('profile.heading')}</h1>

      <div className={styles.page}>
        <div className={styles.screen}>
          <StateLayers loading={state.phase === 'loading'} skeleton={<ProfileSkeleton />}>
            {state.phase === 'ready' && (
              <>
                <StudentCard me={state.data} />
                <NotificationPrefs initial={state.data.preferences} />
              </>
            )}

            {state.phase === 'error' && (
              <div className={styles.stateBox} role="status" aria-live="polite">
                <p className={styles.stateText}>{t('profile.state.error')}</p>
                <button type="button" className={styles.retryButton} onClick={state.retry}>
                  {t('actions.retry')}
                </button>
              </div>
            )}

            {state.phase === 'offline' && (
              <div className={styles.stateBox} role="status" aria-live="polite">
                {/* Nothing is cached, so no stale profile to show. It refetches
                    itself the moment the connection returns. */}
                <p className={styles.stateText}>{t('profile.state.offline')}</p>
              </div>
            )}
          </StateLayers>
        </div>

        <Appearance />
        <AccountActions />
      </div>
    </>
  );
}
