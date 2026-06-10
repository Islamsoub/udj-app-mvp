import React, { useMemo, useState } from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { elevation, fonts, radius, spacing, type Palette } from '@/constants/theme';
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
  imageUrl?: string | null;
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
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.9 }]}
    >
      {/* Thumbnail */}
      <View style={styles.thumbnail}>
        {article.imageUrl ? (
          <Image
            source={{ uri: article.imageUrl }}
            style={styles.thumbnailImage}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.thumbnailPlaceholder}>
            <Ionicons name="image-outline" size={22} color={colors.textTertiary} />
          </View>
        )}
      </View>

      {/* Content column */}
      <View style={styles.content}>
        {/* Top row: category pill + unread dot & timestamp */}
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
          {/* Nested Pressable absorbs touch so bookmark does not trigger card navigation */}
          <Pressable onPress={handleBookmarkPress} hitSlop={12}>
            <Ionicons
              name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
              size={20}
              color={isBookmarked ? colors.jade400 : colors.textTertiary}
            />
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.rTile,
    ...elevation.card,
    padding: spacing.sp12,
    flexDirection: 'row',
    gap: spacing.sp12,
    alignItems: 'flex-start',
  },

  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: radius.rLg,
    overflow: 'hidden',
    flexShrink: 0,
  },
  thumbnailImage: {
    width: 56,
    height: 56,
  },
  thumbnailPlaceholder: {
    flex: 1,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    flex: 1,
  },

  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  categoryPill: {
    borderRadius: radius.rFull,
    paddingVertical: spacing.sp4,
    paddingHorizontal: spacing.sp8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
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
    borderRadius: radius.rFull,
    backgroundColor: colors.jade400,
  },
  timestamp: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },

  title: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    lineHeight: 21,
    marginTop: spacing.sp6,
  },

  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sp8,
  },
  readTime: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },
});
