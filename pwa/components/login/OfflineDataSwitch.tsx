'use client';

import { useEffect, useId, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { OFFLINE_CACHE_KEY, clearOfflineCache } from '@/lib/offline-cache';
import { ShieldIcon } from './icons';
import styles from './login.module.css';

/*
 * Per-device preference key — defined beside the store it governs, in
 * lib/offline-cache (a lib module must not import a component), and re-exported
 * here, where the control that writes it lives and where callers import it from.
 */
export { OFFLINE_CACHE_KEY };

/**
 * The consent behind lib/offline-cache, which reads OFFLINE_CACHE_KEY on every
 * write and read and treats an absent value as OFF — the safe default on a
 * shared machine, and the default this control ships with. Profile mirrors this
 * switch (components/profile/OfflineDataRow) against the same key.
 *
 * Turning it off empties the store at once, not at the next login: a student
 * who changes their mind at the lab's login screen must not leave their grades
 * behind in this browser until someone signs in.
 */
export function OfflineDataSwitch() {
  const { t } = useI18n();
  const labelId = useId();

  // Off until proven otherwise: localStorage is unreadable while rendering on
  // the server, so starting anywhere else would mean a hydration mismatch, and
  // the safe default on a shared machine is off in any case.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    try {
      setEnabled(window.localStorage.getItem(OFFLINE_CACHE_KEY) === 'true');
    } catch {
      // Private mode or blocked storage: stay off.
    }
  }, []);

  const toggle = () => {
    const next = !enabled;
    setEnabled(next);
    try {
      window.localStorage.setItem(OFFLINE_CACHE_KEY, String(next));
    } catch {
      // Not persisting is survivable — the choice still holds for this session.
    }
    if (!next) void clearOfflineCache();
  };

  return (
    <div className={styles.offlineRow}>
      <div className={styles.offlineIcon}>
        <ShieldIcon />
      </div>

      <div className={styles.offlineText}>
        <div className={styles.offlineLabel} id={labelId}>
          {t('login.offline_cache.label')}
        </div>

        {/*
          Both hints share one grid cell, so the row is permanently as tall as
          the taller of the two and the swap cannot move the fields below it.
          The hidden one is taken out of the accessibility tree rather than left
          for a screen reader to read alongside the visible one.
        */}
        <div className={styles.offlineHints}>
          <span
            className={`${styles.offlineHint} ${enabled ? styles.offlineHintHidden : ''}`}
            aria-hidden={enabled}
          >
            {t('login.offline_cache.hint_off')}
          </span>
          <span
            className={`${styles.offlineHint} ${enabled ? '' : styles.offlineHintHidden}`}
            aria-hidden={!enabled}
          >
            {t('login.offline_cache.hint_on')}
          </span>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={enabled}
        aria-labelledby={labelId}
        className={`${styles.switch} ${enabled ? styles.switchOn : ''}`}
        onClick={toggle}
      />
    </div>
  );
}
