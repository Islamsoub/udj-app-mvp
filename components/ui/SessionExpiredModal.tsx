import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, scrimColor, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';

interface SessionExpiredModalProps {
  visible: boolean;
  onContinueOffline: () => void;
}

export function SessionExpiredModal({ visible, onContinueOffline }: SessionExpiredModalProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={[styles.modalSheet, { paddingBottom: Math.max(40, insets.bottom + 16) }]}>
        <View style={styles.dragHandle} />
        <View style={styles.modalIconCircle}>
          <Ionicons name="key-outline" size={36} color={colors.exam} />
        </View>
        <Text style={styles.modalTitle}>{t('common.session.title')}</Text>
        <Text style={styles.modalBody}>{t('common.session.body')}</Text>
        <PressBox
          tier="button"
          style={styles.modalPrimaryBtn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.modalPrimaryBtnText}>{t('common.session.login')}</Text>
        </PressBox>
        <PressBox
          tier="button"
          style={styles.modalOutlineBtn}
          onPress={onContinueOffline}
        >
          <Text style={styles.modalOutlineBtnText}>{t('common.session.continue_offline')}</Text>
        </PressBox>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    backgroundColor: scrimColor,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopStartRadius: radius.r2xl,
    borderTopEndRadius: radius.r2xl,
    padding: spacing.sp24,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 38,
    height: 5,
    borderRadius: radius.rFull,
    backgroundColor: colors.hair,
    alignSelf: 'center',
    marginBottom: spacing.sp24,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: withAlpha(colors.exam, 0.15),
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: fz(16),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp16,
  },
  modalBody: {
    fontSize: fz(14),
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sp8,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 50,
    borderRadius: radius.rBtn,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp24,
  },
  modalPrimaryBtnText: {
    fontSize: fz(15),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  modalOutlineBtn: {
    width: '100%',
    height: 50,
    borderRadius: radius.rBtn,
    borderWidth: 1,
    borderColor: colors.jade600,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp12,
  },
  modalOutlineBtnText: {
    fontSize: fz(15),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.jade400,
  },
});
