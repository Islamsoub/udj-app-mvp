import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';

interface SessionExpiredModalProps {
  visible: boolean;
  onContinueOffline: () => void;
}

export function SessionExpiredModal({ visible, onContinueOffline }: SessionExpiredModalProps) {
  const { t } = useTranslation();
  const router = useRouter();

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.dragHandle} />
        <View style={styles.modalIconCircle}>
          <Ionicons name="key-outline" size={36} color={colors.exam} />
        </View>
        <Text style={styles.modalTitle}>{t('common.session.title')}</Text>
        <Text style={styles.modalBody}>{t('common.session.body')}</Text>
        <Pressable
          style={styles.modalPrimaryBtn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.modalPrimaryBtnText}>{t('common.session.login')}</Text>
        </Pressable>
        <Pressable
          style={styles.modalOutlineBtn}
          onPress={onContinueOffline}
        >
          <Text style={styles.modalOutlineBtnText}>{t('common.session.continue_offline')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    width: 49,
    height: 9,
    borderRadius: spacing.sp8,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sp24,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp16,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sp8,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp24,
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  modalOutlineBtn: {
    width: '100%',
    height: 56,
    borderRadius: radius.rLg,
    borderWidth: 1,
    borderColor: colors.jade600,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp12,
  },
  modalOutlineBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.jade400,
  },
});
