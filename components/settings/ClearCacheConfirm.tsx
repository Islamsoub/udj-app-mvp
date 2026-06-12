import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, fz, spacing, radius, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SettingsSheet } from './SettingsSheet';

interface ClearCacheConfirmProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ClearCacheConfirm({
  visible,
  onClose,
  onConfirm,
}: ClearCacheConfirmProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SettingsSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.confirm.clear_cache_title')}
    >
      <Text style={styles.body}>{t('settings.confirm.clear_cache_body')}</Text>
      <View style={styles.buttons}>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && { backgroundColor: withAlpha(colors.jade400, 0.15) }]} onPress={onClose}>
          <Text style={styles.btnOutlineText}>{t('settings.confirm.cancel')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnDestructive, pressed && { backgroundColor: withAlpha(colors.danger, 0.15) }]}
          onPress={() => {
            onConfirm();
            onClose();
          }}
        >
          <Text style={styles.btnDestructiveText}>{t('settings.confirm.clear_cache_action')}</Text>
        </Pressable>
      </View>
    </SettingsSheet>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  body: {
    fontSize: fz(13),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sp20,
  },
  buttons: {
    paddingHorizontal: spacing.sp20,
    marginTop: spacing.sp20,
    gap: spacing.sp8,
  },
  btn: {
    height: 50,
    borderRadius: radius.rBtn,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnOutlineText: {
    fontSize: fz(14),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  btnDestructive: {
    backgroundColor: colors.danger,
  },
  btnDestructiveText: {
    fontSize: fz(14),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
