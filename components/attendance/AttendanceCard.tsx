import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { elevation, fonts, fz, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import type { AttendanceBand } from '@/services/api';
import { subjectSentence, toneColor, verdictTone } from '@/components/attendance/verdict';

interface AttendanceCardProps {
  name: string;
  percentage: number;
  attended: number;
  total: number;
  /** Server verdict; null for a row cached before band existed (neutral, no sentence). */
  band: AttendanceBand | null;
  /** Server value; null once the semester has ended. */
  absencesLeft: number | null;
}

export function AttendanceCard({ name, percentage, attended, total, band, absencesLeft }: AttendanceCardProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // Colour and sentence are a mapping of the server's verdict — see verdict.ts.
  const tone = verdictTone(band);
  const levelColor = toneColor(tone, colors);
  const sentence = useMemo(
    () => subjectSentence({ band, absencesLeft, percentage, perfect: total > 0 && attended === total }),
    [band, absencesLeft, percentage, attended, total],
  );
  const projection = sentence ? { text: t(sentence.key, sentence.params) } : null;
  const emphasised = tone === 'near' || tone === 'below';
  const projWeight: '400' | '600' = emphasised ? '600' : '400';

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

      {/* Projection row — omitted entirely without a server verdict. */}
      {projection && (
        <View style={styles.projectionRow}>
          {emphasised && (
            <Ionicons name="warning-outline" size={13} color={levelColor} />
          )}
          <Text style={[styles.projectionText, { color: emphasised ? levelColor : colors.textTertiary, fontWeight: projWeight }]}>
            {projection.text}
          </Text>
        </View>
      )}
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
    fontSize: fz(14.5),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  sessionsText: {
    fontSize: fz(12.5),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
    marginTop: 1,
  },
  percentageText: {
    fontSize: fz(17),
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
    fontSize: fz(12.5),
    fontFamily: fonts.sans,
  },
});
