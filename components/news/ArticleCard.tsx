import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts, radius, spacing } from '@/constants/theme';

export type ArticleCategory = 'Evenement' | 'Scolarite' | 'Sport';

export interface Article {
  id: string;
  category: ArticleCategory;
  title: string;
  timestamp: string;
  readTime: string;
  isHero?: boolean;
}

function categoryTextColor(category: ArticleCategory): string {
  return category === 'Evenement' ? colors.exam : colors.jade600;
}

interface ArticleCardProps {
  article: Article;
}

export function ArticleCard({ article }: ArticleCardProps) {
  return (
    <View style={styles.card}>
      {/* Thumbnail placeholder */}
      <View style={styles.thumbnail} />

      {/* Category pill */}
      <View style={styles.categoryPill}>
        <Text style={[styles.categoryText, { color: categoryTextColor(article.category) }]}>
          {article.category}
        </Text>
      </View>

      {/* Timestamp — end-aligned */}
      <Text style={styles.timestamp}>{article.timestamp}</Text>

      {/* Title */}
      <Text style={styles.title} numberOfLines={2}>{article.title}</Text>

      {/* Read time */}
      <Text style={styles.readTime}>{article.readTime}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  // X=15 per Figma → marginHorizontal: 15 gives W=330 on 360dp screen
  card: {
    height: 122,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.scheduleBorder,
    marginHorizontal: 15,
    overflow: 'hidden',
  },

  // X=16, Y=25 within card
  thumbnail: {
    position: 'absolute',
    top: 25,
    start: spacing.sp16,
    width: 37,
    height: 35,
    borderRadius: radius.rMd,
    backgroundColor: colors.scheduleBorder,
  },

  // X=65, Y=15, H=19, radius=10, bg=colors.border
  categoryPill: {
    position: 'absolute',
    top: 15,
    start: 65,
    height: 19,
    borderRadius: 10,
    backgroundColor: colors.border,
    paddingHorizontal: spacing.sp12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
  },

  // X=277→end=16, Y=14
  timestamp: {
    position: 'absolute',
    top: 14,
    end: spacing.sp16,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },

  // X=65, Y=37, end=16
  title: {
    position: 'absolute',
    top: 37,
    start: 65,
    end: spacing.sp16,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    lineHeight: 18,
  },

  // X=65, Y=85
  readTime: {
    position: 'absolute',
    top: 85,
    start: 65,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
});
