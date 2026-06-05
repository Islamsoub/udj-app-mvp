import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SettingsPopover } from './SettingsPopover';
import { OptionRow } from './OptionRow';

interface LanguePickerProps {
  visible: boolean;
  onClose: () => void;
  currentValue: 'fr' | 'ar';
  onSelect: (v: 'fr' | 'ar') => void;
}

export function LanguePicker({ visible, onClose, currentValue, onSelect }: LanguePickerProps) {
  const { t } = useTranslation();
  const { colors } = useColors();

  return (
    <SettingsPopover visible={visible} onClose={onClose}>
      <OptionRow
        label={t('settings.picker.lang_fr')}
        subtitle={t('settings.picker.lang_fr_sub')}
        selected={currentValue === 'fr'}
        onPress={() => onSelect('fr')}
        icon={(sel) => (
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              fontFamily: fonts.sans,
              color: sel ? colors.jade400 : colors.textSecondary,
            }}
          >
            FR
          </Text>
        )}
      />
      <OptionRow
        label={t('settings.picker.lang_ar')}
        subtitle={t('settings.picker.lang_ar_sub')}
        selected={currentValue === 'ar'}
        onPress={() => onSelect('ar')}
        isLast
        icon={(sel) => (
          <Text
            style={{
              fontSize: 11,
              fontWeight: '700',
              fontFamily: fonts.sans,
              color: sel ? colors.jade400 : colors.textSecondary,
            }}
          >
            AR
          </Text>
        )}
      />
    </SettingsPopover>
  );
}
