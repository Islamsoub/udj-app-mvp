import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

function SkeletonSectionHeader({ width }: { width: number }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.sectionHeaderShimmer}>
      <SkeletonBox width={width} height={15} borderRadius={18} />
    </View>
  );
}

function SkeletonValueRow() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.skeletonRow}>
      <SkeletonBox width={100} height={15} borderRadius={18} />
      <SkeletonBox width={70} height={15} borderRadius={18} />
    </View>
  );
}

function SkeletonToggleRow() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.skeletonRow}>
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
      <SkeletonValueRow />
      <SkeletonValueRow />
      <SkeletonValueRow />

      {/* NOTIFICATIONS */}
      <SkeletonSectionHeader width={140} />
      <SkeletonToggleRow />
      <SkeletonToggleRow />
      <SkeletonToggleRow />
      <SkeletonValueRow />

      {/* DONNÉES & CACHE */}
      <SkeletonSectionHeader width={150} />
      <SkeletonValueRow />
      <SkeletonValueRow />
      <SkeletonValueRow />

      {/* COMPTE */}
      <SkeletonSectionHeader width={90} />
      <SkeletonValueRow />
      <View style={[styles.skeletonRow, { marginTop: spacing.sp16 }]}>
        <SkeletonBox width={100} height={15} borderRadius={18} />
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  sectionHeaderShimmer: {
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp24,
    paddingBottom: spacing.sp8,
  },
  skeletonRow: {
    height: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
  },
});
