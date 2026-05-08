import React from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsSheet } from './SettingsSheet';
import { OptionRow } from './OptionRow';

type ThemeValue = 'light' | 'dark' | 'system';

interface ThemePickerProps {
  visible: boolean;
  onClose: () => void;
  currentValue: ThemeValue;
  onSelect: (v: ThemeValue) => void;
}

export function ThemePicker({
  visible,
  onClose,
  currentValue,
  onSelect,
}: ThemePickerProps) {
  const { t } = useTranslation();

  return (
    <SettingsSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.picker.theme')}
    >
      <OptionRow
        label={t('settings.picker.theme_light')}
        subtitle={t('settings.picker.theme_light_sub')}
        selected={currentValue === 'light'}
        onPress={() => onSelect('light')}
      />
      <OptionRow
        label={t('settings.picker.theme_dark')}
        subtitle={t('settings.picker.theme_dark_sub')}
        selected={currentValue === 'dark'}
        onPress={() => onSelect('dark')}
      />
      <OptionRow
        label={t('settings.picker.theme_system')}
        subtitle={t('settings.picker.theme_system_sub')}
        selected={currentValue === 'system'}
        onPress={() => onSelect('system')}
        isLast
      />
    </SettingsSheet>
  );
}
