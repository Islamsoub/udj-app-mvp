import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { colors, spacing } from '@/constants/theme';

export function InfoCenterSkeleton() {
  return (
    <View>
      {/* Search bar */}
      <View style={styles.searchBar}>
        <SkeletonBox width="100%" height={48} borderRadius={12} />
      </View>

      {/* Contacts section header */}
      <SectionHeader width={140} />

      {/* 4 contact row skeletons */}
      {Array.from({ length: 4 }).map((_, i) => (
        <ContactSkeleton key={i} />
      ))}

      {/* FAQ section header */}
      <SectionHeader width={160} />

      {/* 3 FAQ row skeletons */}
      {Array.from({ length: 3 }).map((_, i) => (
        <FAQSkeleton key={i} />
      ))}
    </View>
  );
}

function SectionHeader({ width }: { width: number }) {
  return (
    <View style={styles.sectionHeader}>
      <SkeletonBox width={width} height={12} borderRadius={4} />
    </View>
  );
}

function ContactSkeleton() {
  return (
    <View style={styles.contactRow}>
      <SkeletonBox width={22} height={22} borderRadius={11} />
      <View style={styles.contactMiddle}>
        <SkeletonBox width="100%" height={14} borderRadius={4} />
      </View>
      <SkeletonBox width={100} height={14} borderRadius={4} />
    </View>
  );
}

function FAQSkeleton() {
  return (
    <View style={styles.faqRow}>
      <SkeletonBox width="70%" height={14} borderRadius={4} />
      <SkeletonBox width={16} height={16} borderRadius={8} />
    </View>
  );
}

const styles = StyleSheet.create({
  searchBar: {
    marginHorizontal: spacing.sp16,
    marginTop: spacing.sp12,
  },
  sectionHeader: {
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
    backgroundColor: colors.background,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: spacing.sp16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  contactMiddle: {
    flex: 1,
    marginStart: spacing.sp12,
  },
  faqRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 54,
    paddingHorizontal: spacing.sp16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
});
