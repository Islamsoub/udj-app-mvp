import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

function SkeletonCard({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.card}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <SkeletonBox width={176} height={14} borderRadius={6} />
        <SkeletonBox width={65} height={21} borderRadius={radius.rLg} />
      </View>

      {/* 4-col grid shimmer */}
      <View style={styles.grid}>
        {[0, 1, 2, 3].map((i) => (
          <React.Fragment key={i}>
            {i > 0 && <View style={styles.gridDivider} />}
            <View style={styles.gridCol}>
              <SkeletonBox width={28} height={11} borderRadius={4} />
              <SkeletonBox width={22} height={16} borderRadius={4} />
            </View>
          </React.Fragment>
        ))}
      </View>

      {/* Progress bar shimmer */}
      <View style={styles.progressWrap}>
        <SkeletonBox width="100%" height={3} borderRadius={2} />
      </View>
    </View>
  );
}

export function GradesSkeleton() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.body}>
      <SkeletonCard styles={styles} />
      <SkeletonCard styles={styles} />
      <SkeletonCard styles={styles} />
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  body: {
    paddingTop: spacing.sp16,
    gap: 24,
  },
  card: {
    marginHorizontal: 15,
    height: 122,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.scheduleBorder,
    paddingTop: 11,
    paddingBottom: spacing.sp12,
    overflow: 'hidden',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
    height: 18,
  },
  grid: {
    flexDirection: 'row',
    height: 72,
    marginTop: spacing.sp6,
  },
  gridCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  gridDivider: {
    width: 1,
    height: 72,
    backgroundColor: colors.border,
  },
  progressWrap: {
    marginHorizontal: spacing.sp16,
  },
});
