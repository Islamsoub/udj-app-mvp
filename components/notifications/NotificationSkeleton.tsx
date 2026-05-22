import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

function RowSkeleton({ styles }: { styles: ReturnType<typeof makeStyles> }) {
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

function SectionSkeleton({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View>
      <View style={styles.sectionHeader}>
        <SkeletonBox width={100} height={12} borderRadius={4} />
      </View>
      <RowSkeleton styles={styles} />
      <RowSkeleton styles={styles} />
    </View>
  );
}

export function NotificationSkeleton() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View>
      <SectionSkeleton styles={styles} />
      <SectionSkeleton styles={styles} />
      <SectionSkeleton styles={styles} />
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
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
