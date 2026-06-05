import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, spacing, sizing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface SettingsHeaderProps {
  topInset: number;
  onBack: () => void;
  title?: string;
}

const CONTENT_H = 69;

export function SettingsHeader({ topInset, onBack, title }: SettingsHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const displayTitle = title ?? t('settings.title');

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <Pressable style={styles.backBtn} onPress={onBack} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        <Text style={styles.title}>{displayTitle}</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    minHeight: CONTENT_H,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.sp16,
    paddingBottom: spacing.sp14,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: sizing.touchTarget,
    minWidth: sizing.touchTarget,
    gap: spacing.sp4,
  },
  title: {
    fontSize: 25,
    fontWeight: '800',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    letterSpacing: -0.6,
  },
});
