import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { elevation, fonts, fz, radius, spacing, sizing, HEADER_PAD, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface SettingsHeaderProps {
  topInset: number;
  onBack: () => void;
  title?: string;
  big?: boolean;
  rightAction?: React.ReactNode;
}

const BIG_H = 69;

export function SettingsHeader({
  topInset,
  onBack,
  title,
  big = false,
  rightAction,
}: SettingsHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const displayTitle = title ?? t('settings.title');
  const chevron = I18nManager.isRTL ? 'chevron-forward' : 'chevron-back';

  if (big) {
    return (
      <View style={[styles.bigContainer, { paddingTop: topInset + HEADER_PAD }]}>
        <Pressable style={styles.bigBackBtn} onPress={onBack} hitSlop={8}>
          <Ionicons name={chevron} size={24} color={colors.textPrimary} />
          <Text style={styles.bigTitle}>{displayTitle}</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={[styles.compactContainer, { paddingTop: topInset + HEADER_PAD }]}>
      <View style={styles.compactRow}>
        <Pressable
          style={[styles.circleBtn, elevation.card]}
          onPress={onBack}
          hitSlop={8}
        >
          <Ionicons name={chevron} size={22} color={colors.textPrimary} />
        </Pressable>
        <Text style={styles.compactTitle} numberOfLines={1}>
          {displayTitle}
        </Text>
        {rightAction}
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    // ── Big mode (Settings screen only)
    bigContainer: {
      minHeight: BIG_H,
      backgroundColor: colors.background,
      flexDirection: 'row',
      alignItems: 'flex-end',
      paddingHorizontal: spacing.sp16,
      paddingBottom: spacing.sp14,
    },
    bigBackBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      minHeight: sizing.touchTarget,
      minWidth: sizing.touchTarget,
      gap: spacing.sp4,
    },
    bigTitle: {
      fontSize: fz(25),
      fontWeight: '800',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
      letterSpacing: -0.6,
    },

    // ── Compact mode (all other stack screens)
    compactContainer: {
      backgroundColor: colors.background,
    },
    compactRow: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 56,
      paddingHorizontal: spacing.sp16,
      gap: spacing.sp8,
    },
    circleBtn: {
      width: 38,
      height: 38,
      borderRadius: radius.rFull,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    compactTitle: {
      flex: 1,
      fontSize: fz(20),
      fontWeight: '800',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
      letterSpacing: -0.6,
    },
  });
