import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { colors, fonts, radius, spacing } from '@/constants/theme';

// Skeleton QR card background — newsOfflineBg at 73% opacity per Figma PROFIL5
const SKELETON_CARD_BG = 'rgba(246,234,224,0.73)';

function SkeletonInfoRow() {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonBox width={78} height={15} borderRadius={18} />
      <SkeletonBox width={90} height={15} borderRadius={18} />
    </View>
  );
}

function SkeletonDocumentsRow() {
  const { t } = useTranslation();
  return (
    <View style={styles.skeletonRow}>
      <SkeletonBox width={78} height={15} borderRadius={18} />
      <Text style={styles.documentsText}>{t('profile.row.documents_value')}</Text>
    </View>
  );
}

function SkeletonSectionHeader({ width }: { width: number }) {
  return (
    <View style={styles.sectionHeaderShimmer}>
      <SkeletonBox width={width} height={15} borderRadius={18} />
    </View>
  );
}

export function ProfileSkeleton() {
  return (
    <View>
      {/* Card skeleton */}
      <View style={styles.cardSkeleton}>
        {/* QR grey square */}
        <View style={styles.qrBox} />
        {/* Title shimmers */}
        <SkeletonBox
          width={150}
          height={14}
          borderRadius={8}
          style={{ position: 'absolute', top: 17, start: spacing.sp16 }}
        />
        <SkeletonBox
          width={120}
          height={12}
          borderRadius={8}
          style={{ position: 'absolute', top: 35, start: spacing.sp16 }}
        />
        {/* Name / ID shimmers */}
        <SkeletonBox
          width={130}
          height={14}
          borderRadius={8}
          style={{ position: 'absolute', top: 104, start: spacing.sp16 }}
        />
        <SkeletonBox
          width={100}
          height={12}
          borderRadius={8}
          style={{ position: 'absolute', top: 125, start: spacing.sp16 }}
        />
        {/* Pills row shimmers */}
        <View style={styles.pillsShimmerRow}>
          <SkeletonBox width={94} height={32} borderRadius={16} />
          <SkeletonBox width={94} height={32} borderRadius={16} />
          <SkeletonBox width={84} height={32} borderRadius={16} />
        </View>
      </View>

      {/* INFORMATIONS ACADEMIQUES header shimmer */}
      <SkeletonSectionHeader width={220} />

      {/* Academic rows: Filiere + Niveau */}
      <SkeletonInfoRow />
      <SkeletonInfoRow />

      {/* PARAMETRES header shimmer */}
      <SkeletonSectionHeader width={123} />

      {/* Settings rows: Langue + Annee + Notifications */}
      <SkeletonInfoRow />
      <SkeletonInfoRow />
      <SkeletonInfoRow />

      {/* Documents row — shows actual value text per Figma PROFIL5 */}
      <SkeletonDocumentsRow />

      {/* Logout row shimmer */}
      <View style={[styles.skeletonRow, { marginTop: spacing.sp16 }]}>
        <SkeletonBox width={78} height={15} borderRadius={18} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardSkeleton: {
    marginHorizontal: spacing.sp16,
    marginTop: 18,
    height: 214,
    borderRadius: 18,
    backgroundColor: SKELETON_CARD_BG,
    overflow: 'hidden',
  },
  qrBox: {
    position: 'absolute',
    top: 27,
    end: spacing.sp16,
    width: 77,
    height: 77,
    borderRadius: radius.rMd,
    backgroundColor: colors.scheduleBorder,
  },
  pillsShimmerRow: {
    position: 'absolute',
    top: 158,
    start: spacing.sp16,
    end: spacing.sp16,
    flexDirection: 'row',
    gap: spacing.sp8,
  },
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
  documentsText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
});
