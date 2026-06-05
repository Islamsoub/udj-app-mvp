import React from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SettingsPopover } from './SettingsPopover';
import { OptionRow } from './OptionRow';

type TextSizeValue = 'small' | 'normal' | 'large';

interface TextSizePickerProps {
  visible: boolean;
  onClose: () => void;
  currentValue: TextSizeValue;
  onSelect: (v: TextSizeValue) => void;
}

export function TextSizePicker({ visible, onClose, currentValue, onSelect }: TextSizePickerProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const previewText = t('settings.picker.preview_text');

  return (
    <SettingsPopover visible={visible} onClose={onClose}>
      <OptionRow
        label={t('settings.picker.size_small')}
        selected={currentValue === 'small'}
        onPress={() => onSelect('small')}
        preview={{ text: previewText, size: 12 }}
        icon={(sel) => (
          <Text
            style={{
              fontSize: 13,
              fontWeight: '700',
              fontFamily: fonts.sans,
              color: sel ? colors.jade400 : colors.textSecondary,
            }}
          >
            A
          </Text>
        )}
      />
      <OptionRow
        label={t('settings.picker.size_normal')}
        selected={currentValue === 'normal'}
        onPress={() => onSelect('normal')}
        preview={{ text: previewText, size: 14 }}
        icon={(sel) => (
          <Text
            style={{
              fontSize: 17,
              fontWeight: '700',
              fontFamily: fonts.sans,
              color: sel ? colors.jade400 : colors.textSecondary,
            }}
          >
            A
          </Text>
        )}
      />
      <OptionRow
        label={t('settings.picker.size_large')}
        selected={currentValue === 'large'}
        onPress={() => onSelect('large')}
        preview={{ text: previewText, size: 17 }}
        isLast
        icon={(sel) => (
          <Text
            style={{
              fontSize: 21,
              fontWeight: '700',
              fontFamily: fonts.sans,
              color: sel ? colors.jade400 : colors.textSecondary,
            }}
          >
            A
          </Text>
        )}
      />
    </SettingsPopover>
  );
}
