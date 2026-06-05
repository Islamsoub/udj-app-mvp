import React from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsPopover } from './SettingsPopover';
import { OptionRow } from './OptionRow';

interface LanguePickerProps {
  visible: boolean;
  onClose: () => void;
  currentValue: 'fr' | 'ar';
  onSelect: (v: 'fr' | 'ar') => void;
  anchorY: number;
  anchorHeight: number;
}

export function LanguePicker({
  visible,
  onClose,
  currentValue,
  onSelect,
  anchorY,
  anchorHeight,
}: LanguePickerProps) {
  const { t } = useTranslation();

  return (
    <SettingsPopover
      visible={visible}
      onClose={onClose}
      anchorY={anchorY}
      anchorHeight={anchorHeight}
    >
      <OptionRow
        label={t('settings.picker.lang_fr')}
        subtitle={t('settings.picker.lang_fr_sub')}
        selected={currentValue === 'fr'}
        onPress={() => onSelect('fr')}
      />
      <OptionRow
        label={t('settings.picker.lang_ar')}
        subtitle={t('settings.picker.lang_ar_sub')}
        selected={currentValue === 'ar'}
        onPress={() => onSelect('ar')}
        isLast
      />
    </SettingsPopover>
  );
}
