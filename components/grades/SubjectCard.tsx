import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { getSubjectStatus, getProgressFill } from '@/utils/gradesStatus';

export interface Subject {
  id: string;
  name: string;
  cc: number;
  exam: number;
  coef: number;
  finale: number;
}

interface SubjectCardProps {
  subject: Subject;
}

export function SubjectCard({ subject }: SubjectCardProps) {
  const { t } = useTranslation();
  const status = getSubjectStatus(subject.finale);
  const isAtRisk = status === 'at-risk';
  const fillWidth = getProgressFill(subject.finale);
  const cardHeight = isAtRisk ? 135 : 122;

  return (
    <View style={[styles.card, { height: cardHeight }, isAtRisk && styles.cardAtRisk]}>

      {/* ── Title row (Y=11) ──────────────────────────────────── */}
      <View style={styles.titleRow}>
        <Text style={styles.subjectName} numberOfLines={1}>
          {subject.name}
        </Text>
        <View style={styles.pill}>
          <Text style={[styles.pillLabel, isAtRisk ? styles.pillLabelRisk : styles.pillLabelOk]}>
            {isAtRisk ? t('grades.subject.at_risk') : t('grades.subject.valid')}
          </Text>
        </View>
      </View>

      {/* ── 4-column grid (Y=35, H=72) ────────────────────────── */}
      <View style={styles.grid}>
        {/* CC */}
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>{t('grades.subject.cc')}</Text>
          <Text style={styles.gridValue}>{subject.cc.toFixed(2)}</Text>
        </View>
        <View style={styles.dividerV} />
        {/* EXAM */}
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>{t('grades.subject.exam')}</Text>
          <Text style={styles.gridValue}>{subject.exam.toFixed(2)}</Text>
        </View>
        <View style={styles.dividerV} />
        {/* COEF */}
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>{t('grades.subject.coef')}</Text>
          <Text style={styles.gridValue}>{subject.coef}</Text>
        </View>
        <View style={styles.dividerV} />
        {/* FINALE */}
        <View style={styles.gridCol}>
          <Text style={styles.gridLabel}>{t('grades.subject.finale')}</Text>
          <Text style={styles.gridValue}>{subject.finale.toFixed(2)}</Text>
        </View>
        {/* Horizontal divider at grid midpoint (Y=36 within grid) */}
        <View style={styles.dividerH} />
      </View>

      {/* ── Progress bar (Y=107, H=3) ─────────────────────────── */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: fillWidth }]} />
      </View>

      {/* ── At-risk warning banner (H=25, flush below progress) ── */}
      {isAtRisk && (
        <View style={styles.atRiskBanner}>
          <Text style={styles.atRiskText}>{t('grades.subject.warning')}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 330,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.scheduleBorder,
    overflow: 'hidden',
    alignSelf: 'center',
    paddingTop: 11,
    paddingBottom: spacing.sp12,
  },
  cardAtRisk: {
    paddingBottom: 0,
  },

  // ── Title row
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
    height: 18,
  },
  subjectName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    marginEnd: spacing.sp8,
  },
  pill: {
    width: 65,
    height: 21,
    borderRadius: radius.rLg,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
  },
  pillLabelOk: {
    color: colors.jade600,
  },
  pillLabelRisk: {
    color: colors.danger,
  },

  // ── 4-col grid
  grid: {
    flexDirection: 'row',
    height: 72,
    marginTop: 6,
  },
  gridCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-around',
    height: 72,
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  gridValue: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.mono,
    color: colors.textPrimary,
  },
  dividerV: {
    width: 1,
    height: 72,
    backgroundColor: colors.textSecondary,
  },
  dividerH: {
    position: 'absolute',
    top: 36,
    start: 0,
    end: 0,
    height: 1,
    backgroundColor: colors.textSecondary,
  },

  // ── Progress bar
  progressTrack: {
    height: 3,
    marginHorizontal: spacing.sp16,
    borderRadius: 2,
    backgroundColor: colors.scheduleBorder,
    overflow: 'hidden',
  },
  progressFill: {
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.jade400,
  },

  // ── At-risk banner — flush after progress bar (Y=110 within card)
  atRiskBanner: {
    height: 25,
    backgroundColor: colors.offlineBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  atRiskText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.danger,
  },
});
