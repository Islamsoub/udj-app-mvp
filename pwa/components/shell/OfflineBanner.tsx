'use client';

import { useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { OfflineIcon } from './icons';
import { LastSynced } from './LastSynced';
import styles from './shell.module.css';

/**
 * §8: a persistent banner under the topbar while the device is offline — or
 * while anything on screen is the offline copy rather than a fresh answer. Slides
 * down over --dur-base, back up over --dur-fast, warning-tinted.
 *
 * TWO CAUSES, ONE BANNER. `offline` is the browser's own report. `staleSince` is
 * set when lib/api-client answered a request from the offline store — which also
 * happens with the network up, when the backend is cold-starting (502/503/504).
 * Data from the store must never sit on screen unlabelled, so either cause shows
 * the banner; the message says which, and the last-sync line says how old the
 * data is whenever there is store data to date.
 *
 * Offline with nothing from the store (consent off, or nothing stored yet) shows
 * the message alone: no timestamp is printed that the screen does not back.
 *
 * Always mounted, toggled by a class, because both directions are animated and
 * an unmounted element cannot animate out.
 *
 * Only the message is a live region (`role="status"`, polite): losing
 * connectivity is worth announcing, but the last-sync line re-renders every
 * minute and must not be re-read aloud each time. `aria-hidden` while up keeps a
 * screen reader from reading a banner that is not on screen.
 */
export function OfflineBanner({
  offline,
  staleSince,
}: {
  offline: boolean;
  staleSince: number | null;
}) {
  const { t } = useI18n();
  const shown = offline || staleSince !== null;

  // The message the banner last showed, kept while it slides up — otherwise
  // going back online would swap "hors ligne" for "le serveur ne répond pas" on
  // the way out.
  const messageKey = useRef<'offline.banner' | 'offline.unreachable'>('offline.banner');
  if (shown) messageKey.current = offline ? 'offline.banner' : 'offline.unreachable';

  return (
    <div className={`${styles.banner} ${shown ? '' : styles.bannerHidden}`} aria-hidden={!shown}>
      <OfflineIcon className={styles.bannerIcon} />
      <div className={styles.bannerText}>
        <span role="status" aria-live="polite">
          {t(messageKey.current)}
        </span>
        {staleSince !== null && (
          <span className={styles.bannerSync}>
            <LastSynced savedAt={staleSince} />
          </span>
        )}
      </div>
    </div>
  );
}
