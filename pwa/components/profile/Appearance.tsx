'use client';

import { SegmentedControl } from '@/components/segmented/SegmentedControl';
import { isLang } from '@/lib/i18n-shared';
import { useI18n } from '@/lib/i18n';
import { isThemePref } from '@/lib/theme-shared';
import { useTheme } from '@/lib/theme';
import styles from './profile.module.css';

/**
 * Theme and language — both per-device display choices, stored in a cookie and
 * localStorage on THIS browser, never on the account.
 *
 * Rendered outside the account data's loading states on purpose: neither needs
 * the network, so a student who is offline, or whose profile failed to load,
 * can still switch to dark or to Arabic.
 *
 * §9: "Theme/language radio-pills use the sliding-pill pattern (§5)" — which is
 * exactly SegmentedControl.
 */
export function Appearance() {
  const { t, lang, setLang } = useI18n();
  const { pref, setPref } = useTheme();

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('profile.appearance.title')}</h2>
      <p className={styles.sectionNote}>{t('profile.appearance.intro')}</p>

      <div className={styles.card}>
        <div className={`${styles.row} ${styles.rowStacked}`}>
          <p className={styles.rowLabel} aria-hidden="true">
            {t('profile.appearance.theme')}
          </p>
          <SegmentedControl
            options={[
              { id: 'light', label: t('profile.appearance.light') },
              { id: 'dark', label: t('profile.appearance.dark') },
              { id: 'system', label: t('profile.appearance.system') },
            ]}
            selectedId={pref}
            onSelect={(id) => {
              if (isThemePref(id)) setPref(id);
            }}
            label={t('profile.appearance.theme')}
          />
        </div>

        <div className={`${styles.row} ${styles.rowStacked}`}>
          <p className={styles.rowLabel} aria-hidden="true">
            {t('profile.appearance.language')}
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
            label={t('profile.appearance.language')}
          />
        </div>
      </div>
    </section>
  );
}
