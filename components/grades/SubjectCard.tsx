import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, radius, spacing, elevation, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export interface Subject {
  id: string;
  name: string;
  cc: number | null;
  exam: number | null;
  coef: number;
  finale: number | null;
  // Publication phase (Pass C dual-publish). When NF is not yet published the
  // CF/NF scores are null and must render as "pending", never as 0.
  ccPublished?: boolean;
  nfPublished?: boolean;
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

const DASH = '—';

export function SubjectCard({ subject }: SubjectCardProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  // NF is available once the final result is published (backend masks it to
  // null during the CC-only window). Everything risk-related keys off this so
  // a pending grade never reads as "0.00 à risque".
  const nfAvailable = subject.finale !== null;
  const level = nfAvailable ? getSubjectLevel(subject.finale as number) : null;
  const finaleColor = level ? getLevelColor(level, colors) : colors.textTertiary;
  const pill = level ? getLevelPill(level, colors) : { bg: colors.surface2, fg: colors.textTertiary };
  const isAtRisk = nfAvailable && (subject.finale as number) < 10;

  const pillLabel = !nfAvailable
    ? t('grades.pending')
    : level === 'validated'
    ? t('grades.status_validated')
    : level === 'borderline'
    ? t('grades.status_borderline')
    : t('grades.status_at_risk');

  // Per-cell text: real value when present, "—" for a genuinely missing score,
  // "En attente" for the CF/NF columns while NF publication is still pending.
  const ccText = subject.cc !== null ? subject.cc.toFixed(2) : DASH;
  const examText = !nfAvailable
    ? t('grades.pending')
    : subject.exam !== null
    ? subject.exam.toFixed(2)
    : DASH;
  const finaleText = nfAvailable ? (subject.finale as number).toFixed(2) : t('grades.pending');

  const progressWidth = nfAvailable
    ? (`${Math.min(((subject.finale as number) / 20) * 100, 100)}%` as `${number}%`)
    : ('0%' as `${number}%`);

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
          <Text style={styles.metricValue} numberOfLines={1}>{ccText}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>{t('grades.subject.exam')}</Text>
          <Text
            style={[styles.metricValue, !nfAvailable && styles.metricPending]}
            numberOfLines={1}
          >
            {examText}
          </Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>{t('grades.subject.coef')}</Text>
          <Text style={styles.metricValue} numberOfLines={1}>{subject.coef}</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricCell}>
          <Text style={styles.metricLabel}>{t('grades.subject.finale')}</Text>
          <Text
            style={[
              styles.metricValue,
              nfAvailable ? { color: finaleColor } : styles.metricPending,
            ]}
            numberOfLines={1}
          >
            {finaleText}
          </Text>
        </View>
      </View>

      {/* Progress bar — empty track while NF is pending (no misleading 0%) */}
      <View style={styles.progressTrack}>
        {nfAvailable && (
          <View
            style={[
              styles.progressFill,
              { width: progressWidth, backgroundColor: finaleColor },
            ]}
          />
        )}
      </View>

      {/* At-risk hint — only once NF is published and below the pass mark */}
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
    // "En attente" pending label — smaller, muted, sans (not a number/mono).
    metricPending: {
      fontSize: fz(11),
      fontFamily: fonts.sans,
      fontWeight: '600',
      color: colors.textTertiary,
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
