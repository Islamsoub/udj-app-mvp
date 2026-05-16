import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { colors, spacing } from '@/constants/theme';

function CardSkeleton() {
  return (
    <View style={styles.card}>
      {/* Top row: name shimmer + percentage shimmer */}
      <View style={styles.topRow}>
        <SkeletonBox width={160} height={14} borderRadius={6} />
        <SkeletonBox width={44} height={16} borderRadius={6} />
      </View>
      {/* Progress bar shimmer */}
      <SkeletonBox width="100%" height={3} borderRadius={2} style={{ marginTop: spacing.sp8 }} />
      {/* Bottom row shimmer */}
      <View style={[styles.topRow, { marginTop: spacing.sp8 }]}>
        <SkeletonBox width={90} height={12} borderRadius={4} />
        <SkeletonBox width={120} height={12} borderRadius={4} />
      </View>
    </View>
  );
}

export function AttendanceSkeleton() {
  return (
    <View style={styles.container}>
      {/* Section header shimmer */}
      <SkeletonBox
        width={80}
        height={12}
        borderRadius={4}
        style={{
          marginHorizontal: spacing.sp16,
          marginTop: spacing.sp16,
          marginBottom: spacing.sp12,
        }}
      />
      <CardSkeleton />
      <CardSkeleton />
      <CardSkeleton />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: spacing.sp4,
  },
  card: {
    marginHorizontal: spacing.sp16,
    marginBottom: spacing.sp12,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sp16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});
