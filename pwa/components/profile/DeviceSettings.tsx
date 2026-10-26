'use client';

import { SegmentedControl } from '@/components/segmented/SegmentedControl';
import { isLang } from '@/lib/i18n-shared';
import { useI18n } from '@/lib/i18n';
import { isThemePref } from '@/lib/theme-shared';
import { useTheme } from '@/lib/theme';
import { OfflineDataRow } from './OfflineDataRow';
import styles from './profile.module.css';

/**
 * Theme and language — both per-device display choices, stored in a cookie and
 * localStorage on THIS browser, never on the account — and the offline-data
 * consent, which is per-device for the same reason.
 *
 * Rendered outside the account data's loading states on purpose: neither needs
 * the network, so a student who is offline, or whose profile failed to load,
 * can still switch to dark or to Arabic.
 *
 * §9: "Theme/language radio-pills use the sliding-pill pattern (§5)" — which is
 * exactly SegmentedControl.
 */
export function DeviceSettings() {
  const { t, lang, setLang } = useI18n();
  const { pref, setPref } = useTheme();

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('profile.device.title')}</h2>
      <p className={styles.sectionNote}>{t('profile.device.intro')}</p>

      <div className={styles.card}>
        <div className={`${styles.row} ${styles.rowStacked}`}>
          <p className={styles.rowLabel} aria-hidden="true">
            {t('profile.device.theme')}
          </p>
          <SegmentedControl
            options={[
              { id: 'light', label: t('profile.device.light') },
              { id: 'dark', label: t('profile.device.dark') },
              { id: 'system', label: t('profile.device.system') },
            ]}
            selectedId={pref}
            onSelect={(id) => {
              if (isThemePref(id)) setPref(id);
            }}
            label={t('profile.device.theme')}
          />
        </div>

        <div className={`${styles.row} ${styles.rowStacked}`}>
          <p className={styles.rowLabel} aria-hidden="true">
            {t('profile.device.language')}
          </p>
          {/*
            Each language is named in itself — "Français", "العربية" — whatever
            the active one, so a student who switched by mistake can find the
            way back without reading the other language.
          */}
          <SegmentedControl
            options={[
              { id: 'fr', label: t('language.fr') },
              { id: 'ar', label: t('language.ar') },
            ]}
            selectedId={lang}
            onSelect={(id) => {
              if (isLang(id)) setLang(id);
            }}
            label={t('profile.device.language')}
          />
        </div>

        <OfflineDataRow />
      </div>
    </section>
  );
}
