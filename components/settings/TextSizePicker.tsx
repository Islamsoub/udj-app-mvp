import React from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsPopover } from './SettingsPopover';
import { OptionRow } from './OptionRow';

type TextSizeValue = 'small' | 'normal' | 'large';

interface TextSizePickerProps {
  visible: boolean;
  onClose: () => void;
  currentValue: TextSizeValue;
  onSelect: (v: TextSizeValue) => void;
  anchorY: number;
  anchorHeight: number;
}

export function TextSizePicker({
  visible,
  onClose,
  currentValue,
  onSelect,
  anchorY,
  anchorHeight,
}: TextSizePickerProps) {
  const { t } = useTranslation();
  const previewText = t('settings.picker.preview_text');

  return (
    <SettingsPopover
      visible={visible}
      onClose={onClose}
      anchorY={anchorY}
      anchorHeight={anchorHeight}
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
    </SettingsPopover>
  );
}
