import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { colors, radius, spacing } from '@/constants/theme';

function SkeletonFilterRow() {
  return (
    <View style={styles.filterRow}>
      <SkeletonBox width={94} height={41} borderRadius={22} />
      <SkeletonBox width={120} height={41} borderRadius={22} />
      <SkeletonBox width={90} height={41} borderRadius={22} />
    </View>
  );
}

function SkeletonHeroCard() {
  return (
    <SkeletonBox
      width={329}
      height={229}
      borderRadius={18}
      style={styles.heroCard}
    />
  );
}

function SkeletonArticleCard() {
  return (
    <View style={styles.articleCard}>
      <View style={styles.articleThumb}>
        <SkeletonBox width={37} height={35} borderRadius={radius.rMd} />
      </View>
      <View style={styles.articleContent}>
        <View style={styles.articleTopRow}>
          <SkeletonBox width={80} height={19} borderRadius={10} />
          <SkeletonBox width={37} height={15} borderRadius={6} />
        </View>
        <SkeletonBox width={160} height={15} borderRadius={6} />
        <SkeletonBox width={110} height={15} borderRadius={6} />
        <SkeletonBox width={60} height={15} borderRadius={6} />
      </View>
    </View>
  );
}

export function NewsSkeleton() {
  return (
    <View>
      <SkeletonFilterRow />
      <SkeletonHeroCard />
      <View style={styles.articleList}>
        <SkeletonArticleCard />
        <SkeletonArticleCard />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  filterRow: {
    height: 72,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.scheduleBorder,
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: spacing.sp16,
    gap: spacing.sp8,
  },
  heroCard: {
    alignSelf: 'center',
    marginTop: spacing.sp20,
  },
  articleList: {
    paddingTop: spacing.sp16,
    gap: spacing.sp16,
  },
  articleCard: {
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
    paddingVertical: spacing.sp16,
  },
  articleThumb: {
    marginEnd: spacing.sp12,
  },
  articleContent: {
    flex: 1,
    gap: spacing.sp8,
  },
  articleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
