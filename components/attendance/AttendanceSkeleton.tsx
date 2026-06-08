import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { elevation, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

function CardSkeleton() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      {/* Top row: dot + name/sessions column + percentage */}
      <View style={styles.topRow}>
        <SkeletonBox width={9} height={9} borderRadius={radius.rFull} style={{ marginTop: 5 }} />
        <View style={{ flex: 1, gap: 4 }}>
          <SkeletonBox width={160} height={14} borderRadius={6} />
          <SkeletonBox width={80} height={12} borderRadius={4} />
        </View>
        <SkeletonBox width={44} height={17} borderRadius={6} />
      </View>
      {/* Progress bar shimmer — 6px tall */}
      <SkeletonBox width="100%" height={6} borderRadius={radius.rFull} style={{ marginTop: 11 }} />
      {/* Projection shimmer */}
      <SkeletonBox width={140} height={12} borderRadius={4} style={{ marginTop: 9 }} />
    </View>
  );
}

export function AttendanceSkeleton() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.container}>
      {/* Section header shimmer */}
      <SkeletonBox
        width={80}
        height={12}
        borderRadius={4}
        style={{
          marginHorizontal: spacing.sp20,
          marginBottom: 10,
        }}
      />
      <View style={styles.cardsList}>
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    paddingTop: spacing.sp16,
  },
  cardsList: {
    gap: 10,
  },
  card: {
    marginHorizontal: spacing.sp16,
    borderRadius: radius.rXl,
    backgroundColor: colors.surface,
    padding: spacing.sp14,
    ...elevation.card,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
});
