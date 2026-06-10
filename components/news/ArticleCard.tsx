import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { getNewsCategoryColors } from '@/constants/colorMap';
import { toggleNewsBookmark } from '@/services/db';

export type ArticleCategory = 'official' | 'events' | 'scolarite' | 'sport' | 'youth' | 'sponsors';

export interface Article {
  id: string;
  category: ArticleCategory;
  title: string;
  timestamp: string;
  readTime: string;
  isHero?: boolean;
  isRead?: boolean;
  bookmarked?: boolean;
}

interface ArticleCardProps {
  article: Article;
  onPress?: () => void;
}

export function ArticleCard({ article, onPress }: ArticleCardProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const [isBookmarked, setIsBookmarked] = useState(article.bookmarked ?? false);
  const catColor = getNewsCategoryColors(article.category, colors);

  async function handleBookmarkPress() {
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      await toggleNewsBookmark(article.id, next);
    } catch {
      setIsBookmarked(!next);
    }
  }

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.06) }]}
    >
      <View style={styles.thumbnail} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={[styles.categoryPill, { backgroundColor: catColor.bg }]}>
            <Text style={[styles.categoryText, { color: catColor.fg }]}>
              {t(`news.cat.${article.category}`)}
            </Text>
          </View>
          <View style={styles.timestampRow}>
            {article.isRead === false && <View style={styles.unreadDot} />}
            <Text style={styles.timestamp}>{article.timestamp}</Text>
          </View>
        </View>
        <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
        <View style={styles.bottomRow}>
          <Text style={styles.readTime}>{article.readTime}</Text>
          <Pressable onPress={handleBookmarkPress} hitSlop={8}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={16}
              color={isBookmarked ? colors.jade400 : colors.textSecondary}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  card: {
    height: 122,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.scheduleBorder,
    marginHorizontal: 15,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
  },

  thumbnail: {
    width: 37,
    height: 35,
    borderRadius: radius.rMd,
    backgroundColor: colors.scheduleBorder,
    marginEnd: spacing.sp12,
    flexShrink: 0,
  },

  content: {
    flex: 1,
    justifyContent: 'space-between',
    alignSelf: 'stretch',
    paddingVertical: spacing.sp16,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  categoryPill: {
    height: 19,
    borderRadius: 10,
    paddingHorizontal: spacing.sp12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
  },

  timestampRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.jade400,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },

  title: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    lineHeight: 18,
    marginTop: spacing.sp4,
    marginBottom: spacing.sp4,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readTime: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
});
