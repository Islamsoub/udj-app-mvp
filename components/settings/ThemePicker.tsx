import React from 'react';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/hooks/useColors';
import { SettingsPopover } from './SettingsPopover';
import { OptionRow } from './OptionRow';

type ThemeValue = 'light' | 'dark' | 'system';

interface ThemePickerProps {
  visible: boolean;
  onClose: () => void;
  currentValue: ThemeValue;
  onSelect: (v: ThemeValue) => void;
}

export function ThemePicker({ visible, onClose, currentValue, onSelect }: ThemePickerProps) {
  const { t } = useTranslation();
  const { colors } = useColors();

  return (
    <SettingsPopover visible={visible} onClose={onClose}>
      <OptionRow
        label={t('settings.picker.theme_light')}
        subtitle={t('settings.picker.theme_light_sub')}
        selected={currentValue === 'light'}
        onPress={() => onSelect('light')}
        icon={(sel) => (
          <Ionicons
            name="sunny-outline"
            size={20}
            color={sel ? colors.jade400 : colors.textSecondary}
          />
        )}
      />
      <OptionRow
        label={t('settings.picker.theme_dark')}
        subtitle={t('settings.picker.theme_dark_sub')}
        selected={currentValue === 'dark'}
        onPress={() => onSelect('dark')}
        icon={(sel) => (
          <Ionicons
            name="moon-outline"
            size={20}
            color={sel ? colors.jade400 : colors.textSecondary}
          />
        )}
      />
      <OptionRow
        label={t('settings.picker.theme_system')}
        subtitle={t('settings.picker.theme_system_sub')}
        selected={currentValue === 'system'}
        onPress={() => onSelect('system')}
        isLast
        icon={(sel) => (
          <Ionicons
            name="phone-portrait-outline"
            size={20}
            color={sel ? colors.jade400 : colors.textSecondary}
          />
        )}
      />
    </SettingsPopover>
  );
}
