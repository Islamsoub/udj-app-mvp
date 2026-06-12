import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, radius, spacing, elevation, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export interface Subject {
  id: string;
  name: string;
  cc: number;
  exam: number;
  coef: number;
  finale: number;
}

type SubjectLevel = 'validated' | 'borderline' | 'atRisk';

function getSubjectLevel(nf: number): SubjectLevel {
  if (nf >= 10) return 'validated';
  if (nf >= 8) return 'borderline';
  return 'atRisk';
}

function getLevelColor(level: SubjectLevel, colors: Palette): string {
  switch (level) {
    case 'validated': return colors.jade400;
    case 'borderline': return colors.warning;
    case 'atRisk': return colors.danger;
  }
}

function getLevelPill(level: SubjectLevel, colors: Palette): { bg: string; fg: string } {
  switch (level) {
    case 'validated': return { bg: colors.jadeFaint, fg: colors.jadeText };
    case 'borderline': return { bg: colors.amberBg, fg: colors.warning };
    case 'atRisk': return { bg: colors.dangerBg, fg: colors.danger };
  }
}

interface SubjectCardProps {
  subject: Subject;
}

export function SubjectCard({ subject }: SubjectCardProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const level = getSubjectLevel(subject.finale);
  const levelColor = getLevelColor(level, colors);
  const pill = getLevelPill(level, colors);
  const isAtRisk = subject.finale < 10;

  const pillLabel =
    level === 'validated'
      ? t('grades.status_validated')
      : level === 'borderline'
      ? t('grades.status_borderline')
      : t('grades.status_at_risk');

  const progressWidth = `${Math.min((subject.finale / 20) * 100, 100)}%`;

  return (
    <View style={styles.card}>
      {/* Top row */}
      <View style={styles.titleRow}>
        <Text style={styles.subjectName} numberOfLines={2}>
          {subject.name}
        </Text>
        <View style={[styles.pill, { backgroundColor: pill.bg }]}>
          <Text style={[styles.pillLabel, { color: pill.fg }]}>{pillLabel}</Text>
        </View>
      </View>

      {/* Metric strip */}
      <View style={styles.metricStrip}>
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>{t('grades.subject.cc')}</Text>
          <Text style={styles.metricValue}>{subject.cc.toFixed(2)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>{t('grades.subject.exam')}</Text>
          <Text style={styles.metricValue}>{subject.exam.toFixed(2)}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>{t('grades.subject.coef')}</Text>
          <Text style={styles.metricValue}>{subject.coef}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>{t('grades.subject.finale')}</Text>
          <Text style={[styles.metricValue, { color: levelColor }]}>
            {subject.finale.toFixed(2)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View
          style={[
            styles.progressFill,
            { width: progressWidth as `${number}%`, backgroundColor: levelColor },
          ]}
        />
      </View>

      {/* At-risk hint */}
      {isAtRisk && (
        <View style={styles.atRiskRow}>
          <Ionicons name="alert-circle-outline" size={13} color={colors.danger} />
          <Text style={styles.atRiskText}>{t('grades.at_risk_hint')}</Text>
        </View>
      )}
    </View>
  );
}

const makeStyles = (colors: Palette) =>
  StyleSheet.create({
    card: {
      borderRadius: radius.rTile,
      backgroundColor: colors.surface,
      ...elevation.card,
      padding: spacing.sp16,
      overflow: 'hidden',
    },

    // ── Top row
    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 10,
    },
    subjectName: {
      flex: 1,
      fontSize: fz(16),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.textPrimary,
    },
    pill: {
      paddingVertical: 5,
      paddingHorizontal: 12,
      borderRadius: radius.rFull,
    },
    pillLabel: {
      fontSize: fz(13),
      fontWeight: '700',
      fontFamily: fonts.sans,
    },

    // ── Metric strip
    metricStrip: {
      flexDirection: 'row',
      backgroundColor: colors.surface2,
      borderRadius: radius.rMd,
      paddingVertical: spacing.sp8,
      paddingHorizontal: spacing.sp12,
      marginTop: spacing.sp12,
    },
    metricCell: {
      flex: 1,
      alignItems: 'center',
    },
    metricLabel: {
      fontSize: fz(11),
      fontWeight: '700',
      fontFamily: fonts.sans,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    metricValue: {
      fontSize: fz(16),
      fontWeight: '500',
      fontFamily: fonts.mono,
      color: colors.textPrimary,
      marginTop: 3,
    },
    metricDivider: {
      width: 1,
      height: '60%',
      backgroundColor: colors.hair,
      alignSelf: 'center',
    },

    // ── Progress bar
    progressTrack: {
      height: 6,
      borderRadius: radius.rFull,
      backgroundColor: colors.sunken,
      overflow: 'hidden',
      marginTop: spacing.sp12,
    },
    progressFill: {
      height: 6,
      borderRadius: radius.rFull,
    },

    // ── At-risk hint
    atRiskRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 9,
    },
    atRiskText: {
      fontSize: fz(12.5),
      fontWeight: '600',
      fontFamily: fonts.sans,
      color: colors.danger,
    },
  });
