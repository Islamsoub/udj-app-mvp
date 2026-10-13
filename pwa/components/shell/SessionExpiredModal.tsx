'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { hasCachedDataWithin } from '@/lib/offline-cache';
import styles from './shell.module.css';

/*
 * Whether there is actually anything to stay for — decided by the effect below.
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
 * The switch being on is not enough, though. It proves consent, not that anything
 * was ever stored — a student who turned it on a minute before expiry, or whose
 * browser refused the writes, has an empty store and the same blank app behind
 * the button. So the condition is both: consent on AND at least one entry
 * (lib/offline-cache's hasCachedData, which checks the two together and answers
 * false on any storage failure — private mode, blocked storage — so no button).
 *
 * Read at open time, not at module load: the student may have flipped the switch
 * during the session that is now expiring.
 */

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

  /*
   * Decided once per opening. Re-reading on every render would let a storage
   * change mid-dialog add or remove a button under the student's cursor.
   *
   * The store is asynchronous, so the answer arrives a moment after `open`. The
   * dialog itself opens at once — the title and body are true either way — but
   * the ACTION ROW, both buttons, is held until the answer is in. Drawing
   * "Se reconnecter" first and adding "Continuer hors ligne" when the answer
   * lands is the very control-arriving-under-the-cursor this rule exists to
   * prevent; the row appears once, complete. null = not decided yet.
   */
  const [offlineAvailable, setOfflineAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    if (!open) {
      setOfflineAvailable(null);
      return;
    }
    let cancelled = false;

    /*
     * The row must appear whatever IndexedDB does. A BLOCKED open already fails
     * fast (lib/offline-cache rejects on `onblocked`), but an open or a
     * transaction that never fires any event at all — some WebKit releases have
     * done exactly that — would leave this dialog with no buttons, no Escape and
     * no scrim dismiss: no way out. So the check has a deadline
     * (STORE_CHECK_TIMEOUT_MS), and on timeout the answer is "no cache": the
     * reconnect-only row.
     */
    void hasCachedDataWithin().then((available) => {
      if (!cancelled) setOfflineAvailable(available);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const decided = open && offlineAvailable !== null;

  /*
   * The moment the row appears, its primary action takes focus. Until then the
   * dialog itself holds it (tabIndex -1, below), so focus has already left the
   * page behind and a screen reader has announced the alertdialog.
   */
  useEffect(() => {
    if (decided) primaryRef.current?.focus();
  }, [decided]);

  useEffect(() => {
    if (!open) return;

    dialogRef.current?.focus();

    /**
     * The focus trap. Tab and Shift+Tab wrap around the dialog's own focusable
     * elements instead of escaping into the page behind, which is inert but
     * still in the tab order. Installed from the opening, not from the row:
     * while the row is held there is nothing to wrap to, and Tab is swallowed.
     *
     * Escape is deliberately not handled here: §8 requires an explicit choice,
     * and the modal stays until one of the two buttons is pressed.
     */
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      const focusables = dialogRef.current?.querySelectorAll<HTMLElement>('button');
      if (!focusables || focusables.length === 0) {
        event.preventDefault();
        return;
      }

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
        tabIndex={-1}
      >
        <h2 id={titleId} className={styles.dialogTitle}>
          {t('session.expired_title')}
        </h2>
        <p id={bodyId} className={styles.dialogBody}>
          {t('session.expired_body')}
        </p>

        {decided && (
          <div className={styles.dialogActions}>
            <button
              ref={primaryRef}
              type="button"
              className={styles.buttonPrimary}
              onClick={onReconnect}
            >
              {t('session.reconnect')}
            </button>

            {offlineAvailable && (
              <button type="button" className={styles.buttonSecondary} onClick={onContinueOffline}>
                {t('session.continue_offline')}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
