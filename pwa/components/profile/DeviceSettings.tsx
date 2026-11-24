'use client';

import { useId } from 'react';
import { isLang, type Lang } from '@/lib/i18n-shared';
import { useI18n } from '@/lib/i18n';
import { isThemePref, type ThemePref } from '@/lib/theme-shared';
import { useTheme } from '@/lib/theme';
import styles from './profile.module.css';

/**
 * "Préférences", the prototype's card: Langue as small FR / AR pills, Thème as
 * small Clair / Sombre / Système pills (.radio-pills, .radio-pill). Système is
 * the PWA's own and kept (design-known-divergences.md).
 *
 * Both are per-device display choices, stored in a cookie and localStorage on
 * THIS browser, never on the account — so the card is rendered outside the
 * account data's loading states and keeps working offline, or after the
 * profile failed to load. Same behaviour as before: setLang / setPref.
 */
export function PreferencesCard() {
  const { t, lang, setLang } = useI18n();
  const { pref, setPref } = useTheme();
  const titleId = useId();

  return (
    <section className={styles.card} aria-labelledby={titleId}>
      <h2 className={styles.cardTitle} id={titleId}>
        {t('profile.prefs.title')}
      </h2>

      <SettingsPills
        label={t('profile.device.language')}
        options={[
          // "FR" / "AR" on screen, as the prototype; each named in itself to
          // assistive tech, so a student who switched by mistake hears the way
          // back in their own language.
          { id: 'fr', text: 'FR', name: t('language.fr') },
          { id: 'ar', text: 'AR', name: t('language.ar') },
        ]}
        selected={lang}
        onSelect={(id) => {
          if (isLang(id)) setLang(id as Lang);
        }}
        latin
      />

      <SettingsPills
        label={t('profile.device.theme')}
        options={[
          { id: 'light', text: t('profile.device.light') },
          { id: 'dark', text: t('profile.device.dark') },
          { id: 'system', text: t('profile.device.system') },
        ]}
        selected={pref}
        onSelect={(id) => {
          if (isThemePref(id)) setPref(id as ThemePref);
        }}
      />
    </section>
  );
}

/**
 * A .settings-row with its .radio-pills: the label on the start, the pills on
 * the end. Toggle buttons in a labelled group, one pressed at a time — the
 * pattern the news pills use; the swap is instant (no sliding pill).
 */
function SettingsPills({
  label,
  options,
  selected,
  onSelect,
  latin = false,
}: {
  label: string;
  options: { id: string; text: string; name?: string }[];
  selected: string;
  onSelect: (id: string) => void;
  /** The pill text is Latin in both languages ("FR", "AR"). */
  latin?: boolean;
}) {
  const labelId = useId();

  return (
    <div className={styles.settingsRow}>
      <p className={styles.settingsLabel} id={labelId}>
        {label}
      </p>
      <div className={styles.radioPills} role="group" aria-labelledby={labelId}>
        {options.map((option) => {
          const pressed = option.id === selected;
          return (
            <button
              key={option.id}
              type="button"
              className={`${styles.radioPill} ${pressed ? styles.radioPillOn : ''} ${latin ? 'num' : ''}`}
              aria-pressed={pressed}
              aria-label={option.name}
              lang={option.name !== undefined ? option.id : undefined}
              onClick={() => onSelect(option.id)}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
