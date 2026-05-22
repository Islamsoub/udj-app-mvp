import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

interface AttendanceCardProps {
  name: string;
  percentage: number;
  attended: number;
  total: number;
  projection: string;
}

interface ThresholdColors {
  text: string;
  fill: string;
}

function getThresholdColors(percentage: number, colors: Palette): ThresholdColors {
  if (percentage >= 85) {
    return { text: colors.jade600, fill: colors.jade400 };
  } else if (percentage >= 75) {
    return { text: colors.warning, fill: colors.warning };
  } else {
    return { text: colors.danger, fill: colors.danger };
  }
}

export function AttendanceCard({ name, percentage, attended, total, projection }: AttendanceCardProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const tc = getThresholdColors(percentage, colors);

  return (
    <View style={styles.card}>
      {/* Top row: subject name + percentage */}
      <View style={styles.topRow}>
        <Text style={styles.subjectName} numberOfLines={1}>{name}</Text>
        <Text style={[styles.percentageText, { color: tc.text }]}>{percentage}%</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: tc.fill }]} />
      </View>

      {/* Bottom row: sessions + projection */}
      <View style={styles.bottomRow}>
        <Text style={styles.sessionsText}>
          {t('attendance.sessions', { attended, total })}
        </Text>
        <Text style={[styles.projectionText, { color: tc.text }]}>{projection}</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
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
  subjectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    marginEnd: spacing.sp8,
  },
  percentageText: {
    fontSize: 16,
    fontFamily: fonts.mono,
    fontWeight: '700',
    includeFontPadding: false,
  },
  progressTrack: {
    marginTop: spacing.sp8,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.border,
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sp8,
  },
  sessionsText: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
  },
  projectionText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.sans,
  },
});
