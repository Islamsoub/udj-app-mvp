import React from 'react';
import { useTranslation } from 'react-i18next';
import { SettingsSheet } from './SettingsSheet';
import { OptionRow } from './OptionRow';

interface LanguePickerProps {
  visible: boolean;
  onClose: () => void;
  currentValue: 'fr' | 'ar';
  onSelect: (v: 'fr' | 'ar') => void;
}

export function LanguePicker({
  visible,
  onClose,
  currentValue,
  onSelect,
}: LanguePickerProps) {
  const { t } = useTranslation();

  return (
    <SettingsSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.picker.language')}
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
    </SettingsSheet>
  );
}
