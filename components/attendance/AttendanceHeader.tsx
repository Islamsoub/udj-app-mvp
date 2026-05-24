import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, sizing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

export type AttendanceState = 'skeleton' | 'loaded' | 'empty' | 'error' | 'offline' | 'session';

interface AttendanceHeaderProps {
  topInset: number;
  onBack: () => void;
  percentage: number;
  absences: number;
  totalSessions: number;
  state: AttendanceState;
}

interface BadgeConfig {
  labelKey: string;
  bg: string;
  textColor: string;
}

function getBadgeConfig(percentage: number, colors: Palette): BadgeConfig {
  if (percentage >= 85) {
    return {
      labelKey: 'attendance.badge_regular',
      bg: withAlpha(colors.white, 0.2),
      textColor: colors.surface,
    };
  } else if (percentage >= 75) {
    return {
      labelKey: 'attendance.badge_warning',
      bg: withAlpha(colors.warning, 0.3),
      textColor: colors.warning,
    };
  } else {
    return {
      labelKey: 'attendance.badge_critical',
      bg: withAlpha(colors.danger, 0.3),
      textColor: colors.surface,
    };
  }
}

export function AttendanceHeader({
  topInset,
  onBack,
  percentage,
  absences,
  totalSessions,
  state,
}: AttendanceHeaderProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const badge = getBadgeConfig(percentage, colors);

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      {/* Back button */}
      <Pressable style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: withAlpha(colors.surface, 0.15), borderRadius: 999 }]} onPress={onBack} hitSlop={8}>
        <Ionicons name="chevron-back" size={24} color={colors.surface} />
      </Pressable>

      {/* Section label */}
      <Text style={styles.titleLabel}>{t('attendance.title')}</Text>

      {state === 'skeleton' ? (
        /* Skeleton percentage block */
        <SkeletonBox
          width={200}
          height={52}
          borderRadius={8}
          style={{ marginStart: spacing.sp16, marginTop: spacing.sp8 }}
        />
      ) : (
        /* Percentage + badge row */
        <View style={styles.percentageRow}>
          <Text style={styles.percentageText}>{percentage}%</Text>
          <View style={[styles.badge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.badgeText, { color: badge.textColor }]}>
              {t(badge.labelKey)}
            </Text>
          </View>
        </View>
      )}

      {state === 'skeleton' ? (
        /* Skeleton summary line */
        <SkeletonBox
          width={180}
          height={13}
          borderRadius={4}
          style={{ marginStart: spacing.sp16, marginTop: spacing.sp4 }}
        />
      ) : (
        /* Summary line */
        <Text style={styles.summaryText}>
          {t('attendance.summary', { absences, total: totalSessions })}
        </Text>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    backgroundColor: colors.jade400,
    flexDirection: 'column',
    paddingBottom: spacing.sp20,
  },
  backBtn: {
    height: sizing.touchTarget,
    paddingHorizontal: spacing.sp16,
    justifyContent: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.sp8,
  },
  titleLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sp16,
    marginTop: spacing.sp8,
  },
  percentageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp12,
    paddingHorizontal: spacing.sp16,
    marginTop: spacing.sp8,
  },
  percentageText: {
    fontSize: 52,
    fontFamily: fonts.mono,
    fontWeight: '700',
    color: colors.surface,
    includeFontPadding: false,
  },
  badge: {
    height: 32,
    borderRadius: radius.rFull,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '600',
    fontFamily: fonts.sans,
    includeFontPadding: false,
  },
  summaryText: {
    fontSize: 13,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.surface,
    paddingHorizontal: spacing.sp16,
    marginTop: spacing.sp4,
  },
});
