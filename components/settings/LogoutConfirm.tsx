import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing, radius } from '@/constants/theme';
import { SettingsSheet } from './SettingsSheet';

interface LogoutConfirmProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirm({
  visible,
  onClose,
  onConfirm,
}: LogoutConfirmProps) {
  const { t } = useTranslation();

  return (
    <SettingsSheet
      visible={visible}
      onClose={onClose}
      title={t('settings.confirm.logout_title')}
    >
      <Text style={styles.body}>{t('settings.confirm.logout_body')}</Text>
      <View style={styles.buttons}>
        <Pressable style={({ pressed }) => [styles.btn, styles.btnOutline, pressed && { backgroundColor: colors.jade400 + '26' }]} onPress={onClose}>
          <Text style={styles.btnOutlineText}>{t('settings.confirm.cancel')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.btn, styles.btnDestructive, pressed && { backgroundColor: colors.danger + '26' }]}
          onPress={() => {
            onConfirm();
            onClose();
          }}
        >
          <Text style={styles.btnDestructiveText}>{t('settings.confirm.logout_action')}</Text>
        </Pressable>
      </View>
    </SettingsSheet>
  );
}

const styles = StyleSheet.create({
  body: {
    fontSize: 13,
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
    height: 48,
    borderRadius: radius.rLg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnOutline: {
    borderWidth: 1,
    borderColor: colors.border,
  },
  btnOutlineText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  btnDestructive: {
    backgroundColor: colors.danger,
  },
  btnDestructiveText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
