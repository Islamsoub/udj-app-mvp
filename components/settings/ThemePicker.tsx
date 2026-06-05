import React from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsPopover } from './SettingsPopover';
import { OptionRow } from './OptionRow';

type ThemeValue = 'light' | 'dark' | 'system';

interface ThemePickerProps {
  visible: boolean;
  onClose: () => void;
  currentValue: ThemeValue;
  onSelect: (v: ThemeValue) => void;
  anchorY: number;
  anchorHeight: number;
}

export function ThemePicker({
  visible,
  onClose,
  currentValue,
  onSelect,
  anchorY,
  anchorHeight,
}: ThemePickerProps) {
  const { t } = useTranslation();

  return (
    <SettingsPopover
      visible={visible}
      onClose={onClose}
      anchorY={anchorY}
      anchorHeight={anchorHeight}
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
    </SettingsPopover>
  );
}
