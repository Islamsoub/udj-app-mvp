import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

export type NewsHeaderState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

interface NewsHeaderProps {
  state: NewsHeaderState;
  topInset: number;
}

// Content height below safe area (93 spec total − 24 Figma Android status bar)
const CONTENT_H = 69;

export function NewsHeader({ state, topInset }: NewsHeaderProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {state === 'skeleton' ? (
        <SkeletonBox width={120} height={15} borderRadius={8} />
      ) : (
        <Text style={styles.title}>{t('news.title')}</Text>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    minHeight: CONTENT_H,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.newsHeaderBorder,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
    paddingBottom: spacing.sp12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
});
