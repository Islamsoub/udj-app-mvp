import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { elevation, fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { MAX_ABSENCE_RATE, WARN_BUFFER } from '@/constants/attendance';

interface AttendanceCardProps {
  name: string;
  percentage: number;
  attended: number;
  total: number;
}

type Level = 'ok' | 'warn' | 'danger';

function getLevel(attended: number, total: number): Level {
  if (total === 0 || attended === total) return 'ok';
  const absent = total - attended;
  const maxAbsences = Math.floor(total * MAX_ABSENCE_RATE);
  const remaining = maxAbsences - absent;
  if (remaining > WARN_BUFFER) return 'ok';
  if (remaining > 0) return 'warn';
  return 'danger';
}

function getLevelColor(level: Level, colors: Palette): string {
  if (level === 'ok') return colors.jade400;
  if (level === 'warn') return colors.warning;
  return colors.danger;
}

function computeProjection(attended: number, total: number, t: TFunction): string {
  if (total === 0 || attended === total) return t('presence.proj_perfect');
  const absent = total - attended;
  const maxAbsences = Math.floor(total * MAX_ABSENCE_RATE);
  const remaining = maxAbsences - absent;
  if (remaining > WARN_BUFFER) return t('presence.proj_ok', { remaining });
  if (remaining > 0) return t('presence.proj_warn', { remaining });
  return t('presence.proj_danger');
}

export function AttendanceCard({ name, percentage, attended, total }: AttendanceCardProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const level = useMemo(() => getLevel(attended, total), [attended, total]);
  const levelColor = getLevelColor(level, colors);
  const projection = useMemo(() => computeProjection(attended, total, t), [attended, total, t]);
  const projWeight: '400' | '600' = level === 'ok' ? '400' : '600';

  return (
    <View style={styles.card}>
      {/* Top row: dot + name/sessions column + percentage */}
      <View style={styles.topRow}>
        <View style={[styles.dot, { backgroundColor: levelColor }]} />
        <View style={styles.nameCol}>
          <Text style={styles.subjectName} numberOfLines={1} ellipsizeMode="tail">
            {name}
          </Text>
          <Text style={styles.sessionsText}>
            {t('presence.sessions', { present: attended, total })}
          </Text>
        </View>
        <Text style={[styles.percentageText, { color: levelColor }]}>{percentage}%</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${percentage}%`, backgroundColor: levelColor }]} />
      </View>

      {/* Projection row */}
      <View style={styles.projectionRow}>
        {level !== 'ok' && (
          <Ionicons name="warning-outline" size={13} color={levelColor} />
        )}
        <Text style={[styles.projectionText, { color: level === 'ok' ? colors.textTertiary : levelColor, fontWeight: projWeight }]}>
          {projection}
        </Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
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
  dot: {
    width: 9,
    height: 9,
    borderRadius: radius.rFull,
    marginTop: 5,
  },
  nameCol: {
    flex: 1,
  },
  subjectName: {
    fontSize: 14.5,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  sessionsText: {
    fontSize: 12.5,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
    marginTop: 1,
  },
  percentageText: {
    fontSize: 17,
    fontFamily: fonts.mono,
    fontWeight: '500',
    includeFontPadding: false,
  },
  progressTrack: {
    marginTop: 11,
    height: 6,
    borderRadius: radius.rFull,
    backgroundColor: colors.hair,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: radius.rFull,
  },
  projectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp6,
    marginTop: 9,
  },
  projectionText: {
    fontSize: 12.5,
    fontFamily: fonts.sans,
  },
});
