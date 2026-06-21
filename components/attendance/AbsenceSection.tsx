import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { elevation, fonts, fz, radius, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { FilterSegment, type FilterValue } from './FilterSegment';
import { AbsenceRow, deriveStatus, type AbsenceRecord } from './AbsenceRow';

interface AbsenceSectionProps {
  records: AbsenceRecord[];
  isLoading?: boolean;
  isError?: boolean;
  onRetry?: () => void;
  onRecordPress: (record: AbsenceRecord) => void;
}

const isActionable = (r: AbsenceRecord): boolean => {
  const s = deriveStatus(r.justificationStatus);
  return s === 'unjustified' || s === 'rejected';
};

// Most-recent first
const byDateDesc = (a: AbsenceRecord, b: AbsenceRecord): number =>
  new Date(b.sessionDate).getTime() - new Date(a.sessionDate).getTime();

function SkeletonRow() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.skeletonRow}>
      <SkeletonBox width={46} height={46} borderRadius={12} />
      <View style={styles.skeletonMiddle}>
        <SkeletonBox width="62%" height={14} borderRadius={6} />
        <SkeletonBox width="40%" height={11} borderRadius={4} />
      </View>
      <SkeletonBox width={64} height={20} borderRadius={radius.rFull} />
    </View>
  );
}

export function AbsenceSection({
  records,
  isLoading = false,
  isError = false,
  onRetry,
  onRecordPress,
}: AbsenceSectionProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [filter, setFilter] = useState<FilterValue>('actionable');

  const actionableCount = useMemo(() => records.filter(isActionable).length, [records]);

  const filtered = useMemo(() => {
    if (filter === 'all') {
      return [...records].sort(byDateDesc);
    }
    // Actionable: unjustified group first, then rejected; recent-first within each
    const unjustified = records
      .filter((r) => deriveStatus(r.justificationStatus) === 'unjustified')
      .sort(byDateDesc);
    const rejected = records
      .filter((r) => deriveStatus(r.justificationStatus) === 'rejected')
      .sort(byDateDesc);
    return [...unjustified, ...rejected];
  }, [records, filter]);

  const hasRecords = records.length > 0;
  // Filter only meaningful once data is settled and present
  const showFilter = !isLoading && hasRecords;

  // ── Card body by state. Offline-first: cached records always win over
  //    error/loading chrome; those only show when there is nothing to render.
  let body: React.ReactNode;
  if (!hasRecords && isError) {
    body = (
      <View style={styles.stateBlock}>
        <Ionicons name="alert-circle-outline" size={24} color={colors.warning} />
        <Text style={styles.errorText}>{t('presence.absences_load_error')}</Text>
        <PressBox tier="button" onPress={onRetry} style={styles.retryBtn} hitSlop={8}>
          <Text style={styles.retryText}>{t('attendance.error.retry')}</Text>
        </PressBox>
      </View>
    );
  } else if (!hasRecords && isLoading) {
    body = (
      <>
        <SkeletonRow />
        <View style={styles.separator} />
        <SkeletonRow />
        <View style={styles.separator} />
        <SkeletonRow />
      </>
    );
  } else if (!hasRecords) {
    body = (
      <View style={styles.stateBlock}>
        <View style={styles.emptyCircle}>
          <Ionicons name="checkmark" size={30} color={colors.jade400} />
        </View>
        <Text style={styles.emptyTitle}>{t('presence.no_absences_title')}</Text>
        <Text style={styles.emptyBody}>{t('presence.no_absences_body')}</Text>
      </View>
    );
  } else {
    body = filtered.map((record, index) => (
      <View key={record.id}>
        {index > 0 && <View style={styles.separator} />}
        <AbsenceRow record={record} onPress={onRecordPress} />
      </View>
    ));
  }

  return (
    <View>
      <Text style={styles.sectionLabel}>{t('presence.section_absences')}</Text>

      {showFilter && (
        <FilterSegment value={filter} actionableCount={actionableCount} onChange={setFilter} />
      )}

      <View style={[styles.card, showFilter && styles.cardWithFilter]}>{body}</View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  sectionLabel: {
    fontSize: fz(12.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    color: colors.textTertiary,
    marginTop: 22,
    marginHorizontal: spacing.sp20,
    marginBottom: 10,
  },
  card: {
    marginHorizontal: spacing.sp16,
    borderRadius: radius.rXl,
    backgroundColor: colors.surface,
    overflow: 'hidden',
    ...elevation.card,
  },
  cardWithFilter: {
    marginTop: 10,
  },
  separator: {
    height: 1,
    marginHorizontal: 13,
    backgroundColor: colors.border,
  },
  // ── Skeleton row (mirrors AbsenceRow) ──
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 13,
  },
  skeletonMiddle: {
    flex: 1,
    gap: 6,
  },
  // ── Error / empty centered blocks ──
  stateBlock: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sp32,
    paddingHorizontal: spacing.sp24,
    gap: spacing.sp8,
  },
  errorText: {
    fontSize: fz(14),
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: spacing.sp4,
    paddingVertical: spacing.sp6,
    paddingHorizontal: spacing.sp12,
    borderRadius: radius.rMd,
    backgroundColor: colors.jadeFaint,
  },
  retryText: {
    fontSize: fz(14),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.jadeText,
  },
  emptyCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.rFull,
    backgroundColor: withAlpha(colors.jade400, 0.10),
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sp4,
  },
  emptyTitle: {
    fontSize: fz(16),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  emptyBody: {
    fontSize: fz(14),
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
