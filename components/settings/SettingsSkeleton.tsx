import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { elevation, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

function SkeletonSectionHeader({ width }: { width: number }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.sectionHeaderShimmer}>
      <SkeletonBox width={width} height={13} borderRadius={6} />
    </View>
  );
}

function SkeletonValueRow({ isLast = false }: { isLast?: boolean }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.skeletonRow, isLast && styles.skeletonRowLast]}>
      <SkeletonBox width={100} height={15} borderRadius={18} />
      <SkeletonBox width={70} height={15} borderRadius={18} />
    </View>
  );
}

function SkeletonToggleRow({ isLast = false }: { isLast?: boolean }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.skeletonRow, isLast && styles.skeletonRowLast]}>
      <SkeletonBox width={130} height={15} borderRadius={18} />
      <SkeletonBox width={44} height={26} borderRadius={13} />
    </View>
  );
}

export function SettingsSkeleton() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View>
      {/* PRÉFÉRENCES */}
      <SkeletonSectionHeader width={110} />
      <View style={[styles.sectionCard, elevation.card]}>
        <SkeletonValueRow />
        <SkeletonValueRow />
        <SkeletonValueRow isLast />
      </View>

      {/* NOTIFICATIONS */}
      <SkeletonSectionHeader width={140} />
      <View style={[styles.sectionCard, elevation.card]}>
        <SkeletonToggleRow />
        <SkeletonToggleRow />
        <SkeletonToggleRow />
        <SkeletonValueRow isLast />
      </View>

      {/* DONNÉES & CACHE */}
      <SkeletonSectionHeader width={150} />
      <View style={[styles.sectionCard, elevation.card]}>
        <SkeletonValueRow />
        <SkeletonValueRow />
        <SkeletonValueRow isLast />
      </View>

      {/* COMPTE */}
      <SkeletonSectionHeader width={90} />
      <View style={[styles.sectionCard, elevation.card]}>
        <SkeletonValueRow />
        <SkeletonValueRow />
        <SkeletonValueRow isLast />
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  sectionHeaderShimmer: {
    marginTop: 22,
    marginBottom: 9,
    marginHorizontal: spacing.sp20,
  },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.rXl,
    marginHorizontal: spacing.sp16,
    marginBottom: spacing.sp8,
    overflow: 'hidden',
  },
  skeletonRow: {
    minHeight: 52,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
  },
  skeletonRowLast: {
    borderBottomWidth: 0,
  },
});
