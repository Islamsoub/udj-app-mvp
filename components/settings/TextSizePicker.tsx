import React from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsSheet } from './SettingsSheet';
import { OptionRow } from './OptionRow';

type TextSizeValue = 'small' | 'normal' | 'large';

interface TextSizePickerProps {
  visible: boolean;
  onClose: () => void;
  currentValue: TextSizeValue;
  onSelect: (v: TextSizeValue) => void;
}

export function TextSizePicker({
  visible,
  onClose,
  currentValue,
  onSelect,
}: TextSizePickerProps) {
  const { t } = useTranslation();
  const previewText = t('settings.picker.preview_text');

  return (
    <SettingsSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.picker.text_size')}
      subtitle={t('settings.picker.text_size_preview')}
    >
      <OptionRow
        label={t('settings.picker.size_small')}
        selected={currentValue === 'small'}
        onPress={() => onSelect('small')}
        preview={{ text: previewText, size: 12 }}
      />
      <OptionRow
        label={t('settings.picker.size_normal')}
        selected={currentValue === 'normal'}
        onPress={() => onSelect('normal')}
        preview={{ text: previewText, size: 14 }}
      />
      <OptionRow
        label={t('settings.picker.size_large')}
        selected={currentValue === 'large'}
        onPress={() => onSelect('large')}
        preview={{ text: previewText, size: 17 }}
        isLast
      />
    </SettingsSheet>
  );
}
