import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { colors, spacing } from '@/constants/theme';

function SkeletonSectionHeader({ width }: { width: number }) {
  return (
    <View style={styles.sectionHeaderShimmer}>
      <SkeletonBox width={width} height={15} borderRadius={18} />
    </View>
  );
}

function SkeletonValueRow() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonBox width={100} height={15} borderRadius={18} />
      <SkeletonBox width={70} height={15} borderRadius={18} />
    </View>
  );
}

function SkeletonToggleRow() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonBox width={130} height={15} borderRadius={18} />
      <SkeletonBox width={44} height={26} borderRadius={13} />
    </View>
  );
}

export function SettingsSkeleton() {
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

const styles = StyleSheet.create({
  sectionHeaderShimmer: {
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp24,
    paddingBottom: spacing.sp8,
  },
  skeletonRow: {
    height: 54,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
  },
});
