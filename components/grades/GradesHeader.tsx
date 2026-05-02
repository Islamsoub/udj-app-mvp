import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { SemesterTabs } from './SemesterTabs';
import { getMention } from '@/utils/gradesMention';

export type GradesHeaderState = 'loaded' | 'offline' | 'empty' | 'error' | 'skeleton';

interface GradesHeaderProps {
  state: GradesHeaderState;
  topInset: number;
  gpa: number | null;
  activeSemester: 1 | 2;
  onSemesterChange: (s: 1 | 2) => void;
  credits?: { earned: number; total: number } | null;
}

// Spec heights per state (topInset is added at render time)
const SPEC_HEIGHT: Record<GradesHeaderState, number> = {
  loaded:   235,
  offline:  235,
  empty:    195,
  error:    138,
  skeleton: 305,
};

export function GradesHeader({ state, topInset, gpa, activeSemester, onSemesterChange, credits }: GradesHeaderProps) {
  const { t } = useTranslation();
  const totalH = SPEC_HEIGHT[state] + topInset;

  // ── Skeleton state ──────────────────────────────────────────────────────────
  if (state === 'skeleton') {
    return (
      <View style={[styles.greenBlock, { height: totalH }]}>
        {/* Title shimmer */}
        <SkeletonBox
          width={208}
          height={15}
          borderRadius={8}
          style={{ position: 'absolute', top: topInset + 19, start: spacing.sp16 }}
        />
        {/* GPA block shimmer */}
        <SkeletonBox
          width={160}
          height={62}
          borderRadius={8}
          style={{ position: 'absolute', top: topInset + 55, start: spacing.sp16 }}
        />
        {/* Subtitle shimmer */}
        <SkeletonBox
          width={280}
          height={15}
          borderRadius={8}
          style={{ position: 'absolute', top: topInset + 133, start: spacing.sp16 }}
        />
        {/* Stats row — jade-tinted block with 3 shimmer columns */}
        <View
          style={[
            styles.statsRow,
            { position: 'absolute', top: topInset + 174, start: spacing.sp16, end: spacing.sp16 },
          ]}
        >
          <View style={{ flex: 1, alignItems: 'center' }}>
            <SkeletonBox width={60} height={39} borderRadius={8} />
          </View>
          <View style={styles.statsRowDiv} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <SkeletonBox width={60} height={39} borderRadius={8} />
          </View>
          <View style={styles.statsRowDiv} />
          <View style={{ flex: 1, alignItems: 'center' }}>
            <SkeletonBox width={60} height={39} borderRadius={8} />
          </View>
        </View>
        {/* Tabs shimmer — white band with two pill shimmers */}
        <View style={[styles.tabsShimmerRow, { position: 'absolute', top: topInset + 261 }]}>
          <SkeletonBox
            width={130}
            height={24}
            borderRadius={radius.rFull}
            style={{ marginStart: spacing.sp16 }}
          />
          <SkeletonBox
            width={130}
            height={24}
            borderRadius={radius.rFull}
            style={{ marginStart: spacing.sp16 }}
          />
        </View>
      </View>
    );
  }

  // ── GPA display value ───────────────────────────────────────────────────────
  const gpaText = gpa !== null ? gpa.toFixed(2) : state === 'empty' ? '–/20' : '–';
  const mention = getMention(gpa);

  // ── Subtitle text ───────────────────────────────────────────────────────────
  const creditsText = credits
    ? t('grades.credits_format', { earned: credits.earned, total: credits.total })
    : null;

  let subtitleText: string | null;
  if (state === 'loaded') {
    subtitleText = creditsText;
  } else if (state === 'offline') {
    subtitleText = t('grades.offline.data_notice');
  } else if (state === 'empty') {
    subtitleText = t('grades.header.no_results');
  } else {
    subtitleText = t('grades.header.unavailable');
  }

  // ── Subtitle Y-offset (from content top, after topInset) ───────────────────
  const subtitleY = state === 'loaded' || state === 'offline' ? 153 : 115;

  // ── Whether to show the semester tabs at the bottom ─────────────────────────
  const hasTabs = state !== 'error';

  return (
    <View style={[styles.greenBlock, { height: totalH }]}>
      {/* GPA section label */}
      <Text
        style={[styles.gpaLabel, { position: 'absolute', top: topInset + 19, start: spacing.sp16, end: spacing.sp16 }]}
        numberOfLines={1}
      >
        {activeSemester === 1 ? t('grades.gpa_label_s1') : t('grades.gpa_label_s2')}
      </Text>

      {/* GPA number + Mention Bien badge */}
      <View style={[styles.gpaRow, { position: 'absolute', top: topInset + 55, start: spacing.sp16 }]}>
        <Text style={styles.gpaNumber}>{gpaText}</Text>
        {mention !== null && (
          <View style={styles.mentionBadge}>
            <Text style={styles.mentionText}>{mention}</Text>
          </View>
        )}
      </View>

      {/* Subtitle line */}
      {subtitleText !== null && (
        <Text
          style={[
            styles.subtitle,
            { position: 'absolute', top: topInset + subtitleY, start: spacing.sp16, end: spacing.sp16 },
          ]}
          numberOfLines={1}
        >
          {subtitleText}
        </Text>
      )}

      {/* Semester tabs — pinned to bottom of header */}
      {hasTabs && (
        <View style={[styles.tabsWrapper, { position: 'absolute', bottom: 0, start: 0, end: 0 }]}>
          <SemesterTabs active={activeSemester} onChange={onSemesterChange} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  greenBlock: {
    backgroundColor: colors.jade400,
  },

  // ── Typography
  gpaLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
    letterSpacing: 0.5,
  },
  gpaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  gpaNumber: {
    fontSize: 52,
    fontFamily: fonts.mono,
    color: colors.surface,
  },
  mentionBadge: {
    borderRadius: radius.rLg,
    backgroundColor: colors.mentionBien,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  mentionText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
    textAlignVertical: 'center',
    includeFontPadding: false,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  tabsWrapper: {
    height: 44,
  },

  // ── Skeleton-specific
  statsRow: {
    height: 62,
    borderRadius: 12,
    backgroundColor: colors.mentionBien,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  statsRowDiv: {
    width: 1,
    height: 39,
    backgroundColor: colors.border,
  },
  tabsShimmerRow: {
    height: 44,
    width: '100%',
    backgroundColor: colors.surface,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp8,
  },
});
