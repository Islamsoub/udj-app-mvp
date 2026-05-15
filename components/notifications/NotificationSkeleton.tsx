import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { colors, spacing } from '@/constants/theme';

function RowSkeleton() {
  return (
    <View style={styles.row}>
      <SkeletonBox width={48} height={48} borderRadius={24} />
      <View style={styles.textCol}>
        <SkeletonBox width="80%" height={14} borderRadius={4} />
        <SkeletonBox width="60%" height={12} borderRadius={4} />
        <SkeletonBox width="30%" height={10} borderRadius={4} />
      </View>
    </View>
  );
}

function SectionSkeleton() {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <SkeletonBox width={100} height={12} borderRadius={4} />
      </View>
      <RowSkeleton />
      <RowSkeleton />
    </View>
  );
}

export function NotificationSkeleton() {
  return (
    <View>
      <SectionSkeleton />
      <SectionSkeleton />
      <SectionSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    backgroundColor: colors.background,
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: spacing.sp12,
  },
  textCol: {
    flex: 1,
    gap: 6,
  },
});
