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
      <View style={styles.thumbnail} />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <View style={styles.categoryPill}>
            <Text style={[styles.categoryText, { color: categoryTextColor(article.category) }]}>
              {article.category}
            </Text>
          </View>
          <Text style={styles.timestamp}>{article.timestamp}</Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>{article.title}</Text>
        <Text style={styles.readTime}>{article.readTime}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  },

  readTime: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
});
