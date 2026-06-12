import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { fonts, fz, radius, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';


function SkeletonInfoRow({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.skeletonRow}>
      <SkeletonBox width={78} height={15} borderRadius={18} />
      <SkeletonBox width={90} height={15} borderRadius={18} />
    </View>
  );
}

function SkeletonDocumentsRow({ styles }: { styles: ReturnType<typeof makeStyles> }) {
  const { t } = useTranslation();
  return (
    <View style={styles.skeletonRow}>
      <SkeletonBox width={78} height={15} borderRadius={18} />
      <Text style={styles.documentsText}>{t('profile.row.documents_value')}</Text>
    </View>
  );
}

function SkeletonSectionHeader({ width, styles }: { width: number; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.sectionHeaderShimmer}>
      <SkeletonBox width={width} height={15} borderRadius={18} />
    </View>
  );
}

export function ProfileSkeleton() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View>
      {/* Card skeleton */}
      <View style={styles.cardSkeleton}>
        {/* Top row: title+subtitle column left, QR box right */}
        <View style={styles.topRow}>
          <View style={styles.topLeft}>
            <SkeletonBox width={150} height={14} borderRadius={8} />
            <SkeletonBox width={120} height={12} borderRadius={8} />
          </View>
          <View style={styles.qrBox} />
        </View>

        {/* Middle: name + ID shimmers */}
        <View style={styles.middleSection}>
          <SkeletonBox width={130} height={14} borderRadius={8} />
          <SkeletonBox width={100} height={12} borderRadius={8} />
        </View>

        {/* Bottom: pills row */}
        <View style={styles.pillsShimmerRow}>
          <SkeletonBox width={94} height={32} borderRadius={16} />
          <SkeletonBox width={94} height={32} borderRadius={16} />
          <SkeletonBox width={84} height={32} borderRadius={16} />
        </View>
      </View>

      {/* INFORMATIONS ACADEMIQUES header shimmer */}
      <SkeletonSectionHeader width={220} styles={styles} />

      {/* Academic rows: Filiere + Niveau */}
      <SkeletonInfoRow styles={styles} />
      <SkeletonInfoRow styles={styles} />

      {/* PARAMETRES header shimmer */}
      <SkeletonSectionHeader width={123} styles={styles} />

      {/* Settings rows: Langue + Annee + Notifications */}
      <SkeletonInfoRow styles={styles} />
      <SkeletonInfoRow styles={styles} />
      <SkeletonInfoRow styles={styles} />

      {/* Documents row — shows actual value text per Figma PROFIL5 */}
      <SkeletonDocumentsRow styles={styles} />

      {/* Logout row shimmer */}
      <View style={[styles.skeletonRow, { marginTop: spacing.sp16 }]}>
        <SkeletonBox width={78} height={15} borderRadius={18} />
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => {
  // Skeleton QR card background — newsOfflineBg at 73% opacity per Figma PROFIL5
  const skeletonCardBg = withAlpha(colors.newsOfflineBg, 0.73);
  return StyleSheet.create({
  cardSkeleton: {
    marginHorizontal: spacing.sp16,
    marginTop: 18,
    height: 214,
    borderRadius: 18,
    backgroundColor: skeletonCardBg,
    overflow: 'hidden',
    flexDirection: 'column',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp16,
    paddingBottom: spacing.sp24,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  topLeft: {
    flex: 1,
    marginEnd: spacing.sp8,
    gap: spacing.sp4,
  },
  qrBox: {
    width: 77,
    height: 77,
    borderRadius: radius.rMd,
    backgroundColor: colors.scheduleBorder,
    flexShrink: 0,
  },
  middleSection: {
    gap: spacing.sp8,
  },
  pillsShimmerRow: {
    flexDirection: 'row',
    gap: spacing.sp8,
  },
  sectionHeaderShimmer: {
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp24,
    paddingBottom: spacing.sp8,
  },
  skeletonRow: {
    height: 56,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
  },
  documentsText: {
    fontSize: fz(14),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  });
};
