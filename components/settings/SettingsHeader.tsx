import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, spacing } from '@/constants/theme';

interface SettingsHeaderProps {
  topInset: number;
  onBack: () => void;
}

const CONTENT_H = 69;

export function SettingsHeader({ topInset, onBack }: SettingsHeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <Pressable style={styles.backBtn} onPress={onBack} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        <Text style={styles.title}>{t('settings.title')}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: CONTENT_H,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.newsHeaderBorder,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sp16,
    paddingBottom: 14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    minWidth: 44,
    gap: spacing.sp4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
});
