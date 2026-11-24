'use client';

import { useCallback, useEffect, useId, useState } from 'react';
import { OFFLINE_CACHE_KEY } from '@/components/login/OfflineDataSwitch';
import { fmtLtr } from '@/lib/bidi';
import { clearOfflineCache, newestSavedAt, subscribeStored } from '@/lib/offline-cache';
import { useI18n } from '@/lib/i18n';
import { OfflineIcon } from './icons';
import { Switch } from './Switch';
import { TileGroup, TileIcon } from './tiles';
import styles from './profile.module.css';

type ClearStep = 'idle' | 'confirm' | 'clearing' | 'done';

/**
 * "Stockage hors ligne", the prototype's group, full width at the bottom:
 *
 *   • "Garder mes données hors ligne sur cet appareil" — the login screen's
 *     switch, mirrored where a signed-in student can reach it. Same key, same
 *     'true' / 'false', same OFF default, same wording; turning it off empties
 *     the store at once, turning it on stores nothing by itself.
 *   • "Dernière synchronisation" — when this device's offline copy was last
 *     refreshed: the newest entry in the store (lib/offline-cache
 *     newestSavedAt), read again whenever the store changes. "Jamais" when the
 *     store holds nothing (consent off, or nothing loaded since).
 *   • "Vider le cache" — empties that copy, after a confirmation step in the
 *     page (no browser dialog). Consent is left as it is: the next screen
 *     loaded fills the copy again.
 *
 * No per-type sizes (Design's "Emploi du temps 0.6 MB"…): the store does not
 * know them cheaply, and an estimate would be invented (design-known-divergences.md).
 *
 * Per-device, so it is rendered outside the account data's states and works
 * offline.
 */
export function OfflineStorage() {
  const { t } = useI18n();
  const labelId = useId();
  const hintId = useId();
  const syncId = useId();

  // Off until read: localStorage does not exist during the server render, and
  // off is the safe default anyway.
  const [enabled, setEnabled] = useState(false);
  const [lastSync, setLastSync] = useState<number | null>(null);
  const [step, setStep] = useState<ClearStep>('idle');

  const readLastSync = useCallback(() => {
    void newestSavedAt().then(setLastSync);
  }, []);

  useEffect(() => {
    try {
      setEnabled(window.localStorage.getItem(OFFLINE_CACHE_KEY) === 'true');
    } catch {
      // Private mode or blocked storage: stay off.
    }
    readLastSync();
    return subscribeStored(readLastSync);
  }, [readLastSync]);

  const onSwitch = (next: boolean) => {
    setEnabled(next);
    try {
      window.localStorage.setItem(OFFLINE_CACHE_KEY, String(next));
    } catch {
      // Not persisting is survivable — the choice still holds for this page.
    }
    if (!next) void clearOfflineCache();
    else readLastSync();
  };

  const clear = async () => {
    setStep('clearing');
    await clearOfflineCache();
    setStep('done');
  };

  return (
    <TileGroup title={t('profile.storage.title')}>
      <div className={styles.tileRow}>
        <TileIcon tone="jade">
          <OfflineIcon className={styles.tileGlyph} />
        </TileIcon>
        <div className={styles.rowText}>
          <p className={styles.trLabel} id={labelId}>
            {t('login.offline_cache.label')}
          </p>
          <p className={styles.trSub} id={hintId}>
            {t(enabled ? 'login.offline_cache.hint_on' : 'login.offline_cache.hint_off')}
          </p>
        </div>
        <Switch checked={enabled} onChange={onSwitch} labelledBy={labelId} describedBy={hintId} />
      </div>

      {/* The prototype's .settings-row inside the group: "Dernière
          synchronisation" with its date, and "Vider le cache" on the end. */}
      <div className={`${styles.settingsRow} ${styles.storageRow}`}>
        <div className={styles.rowText}>
          <p className={styles.settingsLabel} id={syncId}>
            {t('profile.storage.last_sync')}
          </p>
          <p className={styles.settingsSub} aria-labelledby={syncId}>
            {lastSync === null ? (
              <span className={styles.syncNever}>{t('profile.storage.never')}</span>
            ) : (
              <SyncStamp at={lastSync} />
            )}
          </p>
          {step === 'done' && (
            <p className={styles.storageStatus} role="status">
              {t('profile.storage.cleared')}
            </p>
          )}
        </div>

        {step === 'confirm' || step === 'clearing' ? (
          // The confirmation, in the page: what is about to go, then the two
          // choices. Focus starts on "Annuler", the harmless one.
          <div className={styles.confirm} role="group" aria-label={t('profile.storage.confirm')}>
            <p className={styles.confirmText}>{t('profile.storage.confirm')}</p>
            <div className={styles.confirmActions}>
              <button
                type="button"
                className={styles.ghostButton}
                autoFocus
                disabled={step === 'clearing'}
                onClick={() => setStep('idle')}
              >
                {t('profile.storage.cancel')}
              </button>
              <button
                type="button"
                className={`${styles.ghostButton} ${styles.ghostDanger}`}
                disabled={step === 'clearing'}
                onClick={clear}
              >
                {t('profile.storage.confirm_yes')}
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className={styles.ghostButton}
            // Nothing stored, nothing to clear.
            disabled={lastSync === null}
            onClick={() => setStep('confirm')}
          >
            {t('profile.storage.clear')}
          </button>
        )}
      </div>
    </TileGroup>
  );
}

/**
 * "21/08/2026 09:41", the prototype's form: the device's local time, digits on
 * the mono face in both languages, one LTR run so Arabic does not reorder it.
 */
function SyncStamp({ at }: { at: number }) {
  const d = new Date(at);
  const two = (n: number) => String(n).padStart(2, '0');
  return (
    <span className="mono">
      {fmtLtr(
        `${two(d.getDate())}/${two(d.getMonth() + 1)}/${d.getFullYear()} ${two(d.getHours())}:${two(d.getMinutes())}`
      )}
    </span>
  );
}
