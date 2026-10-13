'use client';

import { useEffect, useId, useState } from 'react';
import { OFFLINE_CACHE_KEY } from '@/components/login/OfflineDataSwitch';
import { clearOfflineCache } from '@/lib/offline-cache';
import { useI18n } from '@/lib/i18n';
import { Switch } from './Switch';
import styles from './profile.module.css';

/**
 * The login screen's offline-data switch, mirrored where a signed-in student can
 * reach it — without this the choice could only be changed by signing out.
 *
 * Same key, same 'true' / 'false' values, same OFF default, same wording; the
 * two controls are one preference. Like theme and language it belongs to this
 * browser, not the account, so it sits beside them and works offline.
 *
 * Turning it off empties the store immediately. Turning it on stores nothing by
 * itself: the next successful load of each screen does.
 */
export function OfflineDataRow() {
  const { t } = useI18n();
  const labelId = useId();
  const hintId = useId();

  // Off until read, for the reason the login switch gives: localStorage does not
  // exist during the server render, and off is the safe default anyway.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      setEnabled(window.localStorage.getItem(OFFLINE_CACHE_KEY) === 'true');
    } catch {
      // Private mode or blocked storage: stay off.
    }
  }, []);

  const onChange = (next: boolean) => {
    setEnabled(next);
    try {
      window.localStorage.setItem(OFFLINE_CACHE_KEY, String(next));
    } catch {
      // Not persisting is survivable — the choice still holds for this page.
    }
    if (!next) void clearOfflineCache();
  };

  return (
    <div className={styles.row}>
      <div className={styles.rowText}>
        <p className={styles.rowLabel} id={labelId}>
          {t('login.offline_cache.label')}
        </p>
        <p className={styles.rowHint} id={hintId}>
          {t(enabled ? 'login.offline_cache.hint_on' : 'login.offline_cache.hint_off')}
        </p>
      </div>

      <Switch checked={enabled} onChange={onChange} labelledBy={labelId} describedBy={hintId} />
    </div>
  );
}
