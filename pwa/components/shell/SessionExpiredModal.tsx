'use client';

import { useEffect, useId, useRef } from 'react';
import { useI18n } from '@/lib/i18n';
import { OFFLINE_CACHE_KEY } from '@/components/login/OfflineDataSwitch';
import styles from './shell.module.css';

/**
 * Whether there is actually anything to stay for.
 *
 * "Continuer hors ligne" only makes sense if cached data exists to browse. The
 * offline-data switch on the login screen is what decides that, per device, and
 * it defaults to OFF — so for most students, and for every student on a shared
 * machine in the salle info, the local store is empty.
 *
 * Offering the button anyway would dismiss the modal onto a blank app with no
 * way back except finding the reconnect path again. §8 describes the button as
 * letting the student "keep browsing cached data read-only"; with no cache there
 * is no such thing, so the honest control is the reconnect action alone.
 *
 * Read at open time, not at module load: the student may have flipped the switch
 * during the session that is now expiring.
 */
function hasOfflineCache(): boolean {
  try {
    return window.localStorage.getItem(OFFLINE_CACHE_KEY) === 'true';
  } catch {
    // Private mode or blocked storage: no cache is reachable, so no button.
    return false;
  }
}

/**
 * §8: shown when a refresh fails and the session is genuinely over.
 *
 * Cannot be dismissed by clicking outside or by Escape — it requires an explicit
 * choice. That is why there is no scrim onClick and no Escape handler: their
 * absence is the feature, not an omission.
 *
 * §10: role="alertdialog" with aria-modal="true", labelled by its title and
 * described by its body, with focus trapped inside.
 */
export function SessionExpiredModal({
  open,
  onReconnect,
  onContinueOffline,
}: {
  open: boolean;
  onReconnect: () => void;
  onContinueOffline: () => void;
}) {
  const { t } = useI18n();
  const titleId = useId();
  const bodyId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const primaryRef = useRef<HTMLButtonElement>(null);

  // Decided once per opening. Re-reading on every render would let a storage
  // change mid-dialog add or remove a button under the student's cursor.
  const offlineAvailable = useRef(false);
  if (open && !offlineAvailable.current) offlineAvailable.current = hasOfflineCache();
  if (!open && offlineAvailable.current) offlineAvailable.current = false;

  useEffect(() => {
    if (!open) return;

    primaryRef.current?.focus();

    /**
     * The focus trap. Tab and Shift+Tab wrap around the dialog's own focusable
     * elements instead of escaping into the page behind, which is inert but
     * still in the tab order.
     *
     * Escape is deliberately not handled here: §8 requires an explicit choice,
     * and the modal stays until one of the two buttons is pressed.
     */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button');
      if (!focusables || focusables.length === 0) return;

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement;

      // Wrapping is done by hand rather than by letting the browser run off the
      // end, because the elements after this dialog in the DOM are still
      // focusable — aria-modal tells assistive tech to ignore them, but it does
      // not remove them from the tab order.
      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    // No onClick on the scrim: outside clicks must not dismiss (§8).
    <div className={styles.scrim}>
      <div
        ref={dialogRef}
        className={styles.dialog}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={bodyId}
      >
        <h2 id={titleId} className={styles.dialogTitle}>
          {t('session.expired_title')}
        </h2>
        <p id={bodyId} className={styles.dialogBody}>
          {t('session.expired_body')}
        </p>

        <div className={styles.dialogActions}>
          <button
            ref={primaryRef}
            type="button"
            className={styles.buttonPrimary}
            onClick={onReconnect}
          >
            {t('session.reconnect')}
          </button>

          {offlineAvailable.current && (
            <button type="button" className={styles.buttonSecondary} onClick={onContinueOffline}>
              {t('session.continue_offline')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
