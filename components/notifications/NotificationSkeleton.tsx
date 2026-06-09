import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { spacing, radius, elevation, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

function RowSkeleton({ styles, isLast }: { styles: ReturnType<typeof makeStyles>; isLast: boolean }) {
  return (
    <View style={[styles.row, isLast && styles.rowLast]}>
      <SkeletonBox width={38} height={38} borderRadius={12} />
      <View style={styles.textCol}>
        <SkeletonBox width="90%" height={14} borderRadius={4} />
        <SkeletonBox width="65%" height={13} borderRadius={4} />
        <View style={styles.metaRow}>
          <SkeletonBox width={80} height={11} borderRadius={4} />
        </View>
      </View>
    </View>
  );
}

function SectionSkeletonCard({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <SkeletonBox width={90} height={11} borderRadius={4} />
      </View>
      <View style={styles.card}>
        <RowSkeleton styles={styles} isLast={false} />
        <RowSkeleton styles={styles} isLast={false} />
        <RowSkeleton styles={styles} isLast={false} />
        <RowSkeleton styles={styles} isLast={true} />
      </View>
    </View>
  );
}

export function NotificationSkeleton() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.container}>
      <SectionSkeletonCard styles={styles} />
      <SectionSkeletonCard styles={styles} />
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp8,
  },
  sectionHeader: {
    marginBottom: spacing.sp8,
    marginTop: spacing.sp8,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.rXl,
    ...elevation.card,
    overflow: 'hidden',
    marginBottom: spacing.sp12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 14,
    gap: 13,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  textCol: {
    flex: 1,
    gap: spacing.sp8,
  },
  metaRow: {
    flexDirection: 'row',
    marginTop: spacing.sp2,
  },
});
