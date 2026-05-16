import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  onCalculatorPress?: () => void;
  onGpaPress?: () => void;
}

// Spec heights per state (topInset added via paddingTop at render)
const SPEC_HEIGHT: Record<GradesHeaderState, number> = {
  loaded:   235,
  offline:  235,
  empty:    195,
  error:    138,
  skeleton: 305,
};

export function GradesHeader({ state, topInset, gpa, activeSemester, onSemesterChange, credits, onCalculatorPress, onGpaPress }: GradesHeaderProps) {
  const { t } = useTranslation();

  // ── Skeleton state ──────────────────────────────────────────────────────────
  if (state === 'skeleton') {
    return (
      <View style={[styles.greenBlock, { height: SPEC_HEIGHT.skeleton, paddingTop: topInset }]}>
        {/* Title shimmer — top: 19 from content start */}
        <SkeletonBox
          width={208}
          height={15}
          borderRadius={8}
          style={{ marginTop: 19, marginStart: spacing.sp16 }}
        />
        {/* GPA block shimmer — top: 55 → marginTop: 55 - (19+15) = 21 */}
        <SkeletonBox
          width={160}
          height={62}
          borderRadius={8}
          style={{ marginTop: 21, marginStart: spacing.sp16 }}
        />
        {/* Subtitle shimmer — top: 133 → marginTop: 133 - (55+62) = 16 */}
        <SkeletonBox
          width={280}
          height={15}
          borderRadius={8}
          style={{ marginTop: 16, marginStart: spacing.sp16 }}
        />
        {/* Stats row — top: 174 → marginTop: 174 - (133+15) = 26 */}
        <View style={[styles.statsRow, { marginTop: 26, marginHorizontal: spacing.sp16 }]}>
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
        {/* Spacer pushes tabsShimmerRow to bottom (305 - 236 - 44 = 25px) */}
        <View style={{ flex: 1 }} />
        {/* Tabs shimmer — white band with two pill shimmers */}
        <View style={styles.tabsShimmerRow}>
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

  // ── Whether to show the semester tabs at the bottom ─────────────────────────
  const hasTabs = state !== 'error';

  return (
    <View style={[styles.greenBlock, { height: SPEC_HEIGHT[state], paddingTop: topInset }]}>
      {/* GPA section label */}
      <Text style={styles.gpaLabel} numberOfLines={1}>
        {activeSemester === 1 ? t('grades.gpa_label_s1') : t('grades.gpa_label_s2')}
      </Text>

      {/* GPA number + Mention Bien badge + Calculator icon */}
      <View style={styles.gpaRowOuter}>
        <Pressable style={styles.gpaRow} onPress={onGpaPress} hitSlop={8}>
          <Text style={styles.gpaNumber}>{gpaText}</Text>
          {mention !== null && (
            <View style={styles.mentionBadge}>
              <Text style={styles.mentionText}>{mention}</Text>
            </View>
          )}
        </Pressable>
        {onCalculatorPress != null && (
          <Pressable
            style={styles.calcIconBtn}
            onPress={onCalculatorPress}
            hitSlop={8}
          >
            <Ionicons name="calculator-outline" size={22} color={colors.surface} />
          </Pressable>
        )}
      </View>

      {/* Spacer — pushes subtitle and tabs to bottom */}
      <View style={{ flex: 1 }} />

      {/* Subtitle line */}
      {subtitleText !== null && (
        <Text style={styles.subtitle} numberOfLines={1}>
          {subtitleText}
        </Text>
      )}

      {/* Semester tabs — sits at bottom of header */}
      {hasTabs && (
        <View style={styles.tabsWrapper}>
          <SemesterTabs active={activeSemester} onChange={onSemesterChange} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  greenBlock: {
    backgroundColor: colors.jade400,
    flexDirection: 'column',
  },

  // ── Typography
  gpaLabel: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
    letterSpacing: 0.5,
    paddingHorizontal: spacing.sp16,
    marginTop: 19,
  },
  gpaRowOuter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sp8,
    marginStart: spacing.sp16,
    marginEnd: spacing.sp16,
  },
  gpaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  calcIconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: spacing.sp16,
    marginBottom: spacing.sp8,
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
