import React, { useMemo } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { elevation, fonts, fz, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { getNewsCategoryColors } from '@/constants/colorMap';

// Image area height (design constant)
const IMAGE_H = 170;

export interface HeroArticle {
  id: string;
  title: string;
  timestamp: string;
  readTime: string;
  isUrgent?: boolean;
  imageUrl?: string | null;
  category?: string;
}

interface HeroCardProps {
  article: HeroArticle;
  onPress?: () => void;
}

export function HeroCard({ article, onPress }: HeroCardProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const hasImage = !!article.imageUrl;
  const catColor = (article.category && !article.isUrgent)
    ? getNewsCategoryColors(article.category, colors)
    : null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      <View style={styles.imageArea}>
        {hasImage ? (
          <>
            <Image
              source={{ uri: article.imageUrl! }}
              style={styles.image}
              resizeMode="cover"
            />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.55)']}
              style={styles.scrim}
            />
            <View style={styles.scrimContent}>
              {/* on-image literal — white text over dark scrim */}
              <Text style={styles.titleOnImage} numberOfLines={2}>{article.title}</Text>
            </View>
          </>
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="image-outline" size={26} color={colors.textTertiary} />
          </View>
        )}

        {/* Pill: urgent or category (non-urgent + image only) — top-start, RTL-safe */}
        {article.isUrgent ? (
          <View style={styles.urgentPill}>
            <View style={styles.urgentDot} />
            <Text style={styles.urgentLabel}>{t('news.urgent_label')}</Text>
          </View>
        ) : (catColor && hasImage) ? (
          <View style={[styles.categoryPill, { backgroundColor: catColor.bg }]}>
            <Text style={[styles.categoryPillText, { color: catColor.fg }]}>
              {t(`news.cat.${article.category}`)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footer}>
        {!hasImage && (
          <Text style={styles.titleInFooter} numberOfLines={2}>{article.title}</Text>
        )}
        <Text style={[styles.meta, !hasImage && styles.metaWithTitle]}>
          {article.timestamp} · {article.readTime}
        </Text>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  card: {
    borderRadius: radius.rTile,
    ...elevation.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },

  imageArea: {
    height: IMAGE_H,
  },
  image: {
    width: '100%',
    height: IMAGE_H,
  },
  scrim: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    height: IMAGE_H / 2,
  },
  scrimContent: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    padding: spacing.sp12,
  },
  titleOnImage: {
    fontSize: fz(17),
    fontWeight: '700',
    fontFamily: fonts.sans,
    // on-image literal — white text over dark scrim
    color: '#FFFFFF',
    lineHeight: fz(22),
  },
  imagePlaceholder: {
    flex: 1,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  urgentPill: {
    position: 'absolute',
    top: spacing.sp12,
    start: spacing.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.rFull,
    backgroundColor: colors.dangerBg,
    paddingVertical: spacing.sp4,
    paddingHorizontal: spacing.sp8,
    gap: spacing.sp6,
  },
  urgentDot: {
    width: 8,
    height: 8,
    borderRadius: radius.rFull,
    backgroundColor: colors.danger,
  },
  urgentLabel: {
    fontSize: fz(12.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.danger,
  },

  categoryPill: {
    position: 'absolute',
    top: spacing.sp12,
    start: spacing.sp12,
    borderRadius: radius.rFull,
    paddingVertical: spacing.sp4,
    paddingHorizontal: spacing.sp8,
  },
  categoryPillText: {
    fontSize: fz(12),
    fontWeight: '600',
    fontFamily: fonts.sans,
  },

  footer: {
    padding: spacing.sp12,
  },
  titleInFooter: {
    fontSize: fz(17),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    lineHeight: fz(22),
  },
  meta: {
    fontSize: fz(13),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },
  metaWithTitle: {
    marginTop: spacing.sp8,
  },
});
