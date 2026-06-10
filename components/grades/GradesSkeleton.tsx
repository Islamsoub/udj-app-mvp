import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { radius, spacing, elevation, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

function SkeletonCard({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.card}>
      {/* Title row */}
      <View style={styles.titleRow}>
        <SkeletonBox width={160} height={16} borderRadius={6} />
        <SkeletonBox width={72} height={26} borderRadius={radius.rFull} />
      </View>

      {/* Metric strip shimmer */}
      <View style={styles.metricStripWrap}>
        <SkeletonBox width="100%" height={50} borderRadius={radius.rMd} />
      </View>

      {/* Progress bar shimmer */}
      <View style={styles.progressWrap}>
        <SkeletonBox width="100%" height={6} borderRadius={radius.rFull} />
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

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    body: {
      paddingTop: spacing.sp16,
      paddingHorizontal: spacing.sp16,
      gap: 12,
    },
    card: {
      borderRadius: radius.rTile,
      backgroundColor: colors.surface,
      ...elevation.card,
      padding: spacing.sp16,
      overflow: 'hidden',
    },
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    metricStripWrap: {
      marginTop: spacing.sp12,
    },
    progressWrap: {
      marginTop: spacing.sp12,
    },
  });
