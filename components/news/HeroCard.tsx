import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export interface HeroArticle {
  id: string;
  title: string;
  timestamp: string;
  readTime: string;
}

interface HeroCardProps {
  article: HeroArticle;
  onPress?: () => void;
}

export function HeroCard({ article, onPress }: HeroCardProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.surface + '0F' }]}
    >
      {/* Green image placeholder with urgent pill */}
      <View style={styles.imageArea}>
        <View style={styles.urgentPill}>
          <View style={styles.urgentDot} />
          <Text style={styles.urgentLabel}>{t('news.hero.urgent_label')}</Text>
        </View>
      </View>

      {/* White content area */}
      <View style={styles.contentArea}>
        <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{article.timestamp}</Text>
          <Text style={styles.meta}> · </Text>
          <Text style={styles.meta}>{article.readTime}</Text>
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  card: {
    marginHorizontal: spacing.sp16,
    height: 229,
    borderRadius: 18,
    backgroundColor: colors.jade600,
    overflow: 'hidden',
  },

  // Green image placeholder (H=137) — bottom-aligned urgent pill
  imageArea: {
    height: 137,
    backgroundColor: colors.jade600,
    justifyContent: 'flex-end',
    paddingStart: spacing.sp16,
    paddingBottom: 11, // 137 - 100(pill Y) - 26(pill H) = 11
    alignItems: 'flex-start',
  },
  urgentPill: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 26,
    borderRadius: 16,
    backgroundColor: colors.urgentPillBg,
    paddingHorizontal: 10,
    gap: spacing.sp4,
  },
  urgentDot: {
    width: 11,
    height: 11,
    borderRadius: radius.rFull,
    backgroundColor: colors.danger,
  },
  urgentLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },

  // White content area (H=92, flex to fill remaining 229-137=92)
  contentArea: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.rMd,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: spacing.sp12,
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    lineHeight: 20,
    marginTop: spacing.sp4,
    marginBottom: spacing.sp4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  meta: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
});
