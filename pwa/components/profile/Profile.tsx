'use client';

import { useId } from 'react';
import { useCardData } from '@/components/dashboard/useCardData';
/*
 * Imported, as the other screens do: §5's skeleton crossfade with nothing
 * screen-specific in it.
 */
import { StateLayers } from '@/components/grades/StateLayers';
import { useOnline } from '@/components/shell/useOnline';
import { getGradesAllSemesters, getMe } from '@/lib/api-client';
import type { MeResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { AccountActions } from './AccountActions';
import { PreferencesCard } from './DeviceSettings';
import { NotificationPrefs } from './NotificationPrefs';
import { OfflineStorage } from './OfflineStorage';
import { NotificationsSkeleton, ProfileSkeleton } from './skeletons';
import { AccountGroups, Identity } from './StudentCard';
import styles from './profile.module.css';

interface ProfileData {
  me: MeResponse;
  /**
   * Whether ANY semester has published results. /student/me cannot say: zero
   * credits earned reads the same whether nothing is published or everything
   * was failed, and the two must not be shown as the same figure. Null when the
   * second request failed — the profile still renders, with the plain figure.
   */
  anyPublished: boolean | null;
}

/** Module scope, so the reference is stable across renders. */
async function loadProfile(): Promise<ProfileData> {
  const [me, all] = await Promise.all([
    getMe(),
    // The profile is the account; a failure of this lookup must not take the
    // whole screen down with it.
    getGradesAllSemesters().catch(() => null),
  ]);

  return {
    me,
    anyPublished: all === null ? null : all.semesters.some((s) => s.gpa !== null),
  };
}

/**
 * The profile screen, as the prototype's view-profile, full content width:
 *
 *   identity block (centred)
 *   Informations · Parcours · Contacter ma faculté      tile groups, full width
 *   Préférences | Notifications                         side by side from 1024px
 *   Compte                                              tile group
 *   Stockage hors ligne                                 tile group
 *
 * Two halves with different needs, and the states follow the split:
 *
 *   • THE ACCOUNT — identity, the three groups, the notification preferences —
 *     comes from GET /student/me and goes through the usual states: skeleton
 *     with §5's 400ms floor, loaded, error with a retry, offline. The shell
 *     owns session expiry and the offline banner. "Empty" is not a state /me
 *     can be in — it answers a student or a 404 — so emptiness is handled per
 *     field: missing contact lines and unpublished figures are omitted or
 *     named, never shown blank.
 *
 *   • THIS DEVICE — Préférences, Compte, Stockage hors ligne — needs no network
 *     and is always rendered, outside those states, so it keeps working offline
 *     or after the account failed to load.
 */
export function Profile() {
  const { t } = useI18n();
  const { online } = useOnline();

  const state = useCardData<ProfileData>(loadProfile, online);

  return (
    <>
      {/* The page's only h1, visually hidden, as on the other screens: the
          topbar already shows "Profil". */}
      <h1 className={styles.srOnly}>{t('profile.heading')}</h1>

      <div className={styles.page}>
        <div className={styles.screen}>
          <StateLayers loading={state.phase === 'loading'} skeleton={<ProfileSkeleton />}>
            {state.phase === 'ready' && (
              <>
                <Identity me={state.data.me} />
                <div className={styles.groups}>
                  <AccountGroups me={state.data.me} anyPublished={state.data.anyPublished} />
                </div>
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
                {/* No offline copy of /student/me to show (consent off, or never
                    stored). It refetches itself the moment the connection returns. */}
                <p className={styles.stateText}>{t('profile.state.offline')}</p>
              </div>
            )}
          </StateLayers>
        </div>

        {/* .grid-cards on this view: two columns from 1024px, stacked below. */}
        <div className={styles.cards}>
          <PreferencesCard />
          {state.phase === 'ready' ? (
            <NotificationPrefs initial={state.data.me.preferences} />
          ) : state.phase === 'loading' ? (
            <NotificationsSkeleton />
          ) : (
            <NotificationsUnavailable offline={state.phase === 'offline'} />
          )}
        </div>

        <AccountActions />
        <OfflineStorage />
      </div>
    </>
  );
}

/**
 * The Notifications card when the account did not load: the settings live on
 * the account, so there is nothing to show or change. Its title stays, so the
 * two cards keep their places, and one line says why.
 */
function NotificationsUnavailable({ offline }: { offline: boolean }) {
  const { t } = useI18n();
  const titleId = useId();
  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 className={styles.cardTitle} id={titleId}>
        {t('profile.notifs.title')}
      </h2>
      <p className={styles.cardNote}>
        {t(offline ? 'profile.notifs.offline' : 'profile.notifs.unavailable')}
      </p>
    </section>
  );
}
