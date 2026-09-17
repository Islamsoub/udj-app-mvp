'use client';

import { useEffect, useId, useState } from 'react';
import { useI18n } from '@/lib/i18n';
import { ShieldIcon } from './icons';
import styles from './login.module.css';

/**
 * Per-device preference key.
 *
 * A display preference, like the language — not a credential. It records a
 * choice about this machine, which is exactly what a shared machine in the
 * salle info needs it to be: it must not follow the student to another device,
 * and it must survive the reload that follows login.
 *
 * Nothing is stored here but 'true' / 'false'. Tokens stay in memory and in the
 * httpOnly cookie, as always.
 */
export const OFFLINE_CACHE_KEY = 'unipocket_offline_cache';

/**
 * NOTHING READS THIS FLAG YET.
 *
 * The caching layer is a later piece of work; this switch only records the
 * student's answer so the choice exists by the time there is something to
 * honour it. Whoever builds the cache should read OFFLINE_CACHE_KEY here and
 * treat an absent value as OFF — the safe default on a shared machine, and the
 * default this control ships with.
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
