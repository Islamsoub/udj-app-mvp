import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { elevation, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

// Matches IMAGE_H in HeroCard
const HERO_IMAGE_H = 170;
const HERO_FOOTER_H = 44;

function SkeletonFilterRow({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.filterRow}>
      <SkeletonBox width={72} height={36} borderRadius={radius.rFull} />
      <SkeletonBox width={110} height={36} borderRadius={radius.rFull} />
      <SkeletonBox width={80} height={36} borderRadius={radius.rFull} />
    </View>
  );
}

function SkeletonHeroCard({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.heroCard}>
      <SkeletonBox width="100%" height={HERO_IMAGE_H} borderRadius={0} />
      <View style={styles.heroFooter}>
        <SkeletonBox width="85%" height={16} borderRadius={radius.rMd} />
        <SkeletonBox width="50%" height={16} borderRadius={radius.rMd} style={{ marginTop: spacing.sp4 }} />
        <SkeletonBox width={100} height={13} borderRadius={radius.rMd} style={{ marginTop: spacing.sp8 }} />
      </View>
    </View>
  );
}

function SkeletonArticleCard({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.articleCard}>
      <SkeletonBox width={56} height={56} borderRadius={radius.rLg} />
      <View style={styles.articleContent}>
        <View style={styles.articleTopRow}>
          <SkeletonBox width={72} height={24} borderRadius={radius.rFull} />
          <SkeletonBox width={44} height={13} borderRadius={radius.rMd} />
        </View>
        <SkeletonBox width="90%" height={15} borderRadius={radius.rMd} style={{ marginTop: spacing.sp6 }} />
        <SkeletonBox width="60%" height={15} borderRadius={radius.rMd} style={{ marginTop: spacing.sp4 }} />
        <SkeletonBox width={60} height={13} borderRadius={radius.rMd} style={{ marginTop: spacing.sp8 }} />
      </View>
    </View>
  );
}

export function NewsSkeleton() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.root}>
      <SkeletonFilterRow styles={styles} />
      <View style={styles.cardList}>
        <SkeletonHeroCard styles={styles} />
        <SkeletonArticleCard styles={styles} />
        <SkeletonArticleCard styles={styles} />
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  root: {
    paddingTop: spacing.sp20,
  },
  filterRow: {
    height: 52,
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    paddingStart: spacing.sp16,
    gap: spacing.sp8,
    marginBottom: spacing.sp12,
  },
  cardList: {
    paddingHorizontal: spacing.sp16,
    gap: 12,
  },
  heroCard: {
    borderRadius: radius.rTile,
    ...elevation.card,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  heroFooter: {
    padding: spacing.sp12,
    minHeight: HERO_FOOTER_H,
  },
  articleCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.rTile,
    ...elevation.card,
    padding: spacing.sp12,
    flexDirection: 'row',
    gap: spacing.sp12,
    alignItems: 'flex-start',
  },
  articleContent: {
    flex: 1,
  },
  articleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
