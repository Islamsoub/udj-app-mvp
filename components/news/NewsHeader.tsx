import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { elevation, fonts, spacing, HEADER_PAD, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

export type NewsHeaderState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

interface NewsHeaderProps {
  state: NewsHeaderState;
  topInset: number;
  scrolled?: boolean;
}

// Minimum content height below safe area
const CONTENT_H = 69;

export function NewsHeader({ state, topInset, scrolled = false }: NewsHeaderProps) {
  const { colors, isDark } = useColors();
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  const styles = useMemo(() => makeStyles(colors, isAr), [colors, isAr]);

  const scrolledStyle = scrolled
    ? isDark
      ? { borderBottomWidth: 1 as const, borderBottomColor: colors.hair }
      : elevation.card
    : {};

  return (
    <View style={[styles.container, { paddingTop: topInset + HEADER_PAD }, scrolledStyle]}>
      {state === 'skeleton' ? (
        <SkeletonBox width={120} height={15} borderRadius={8} />
      ) : (
        <Text style={styles.title}>{t('news.title')}</Text>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette, isAr: boolean) => StyleSheet.create({
  container: {
    minHeight: CONTENT_H,
    backgroundColor: colors.background,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp20,
    paddingBottom: spacing.sp12,
  },
  title: {
    fontSize: isAr ? 26 : 24,
    fontWeight: '800',
    fontFamily: isAr ? fonts.arabic : fonts.sans,
    color: colors.textPrimary,
    letterSpacing: isAr ? 0 : -0.5,
  },
});
