import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, spacing, withAlpha } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { getMention, mentionColor } from '@/utils/gradesMention';
import { PressBox } from '@/components/PressBox';
import { SkeletonBox } from '@/components/ui/SkeletonBox';

interface Props {
  gpa: number | null;
  credits: { earned: number; total: number } | null;
  activeSemester: 1 | 2;
  onPress?: () => void;
  skeleton?: boolean;
  // Final results not yet published — show a message instead of a GPA/mention.
  pending?: boolean;
}

export function GpaHeroCard({ gpa, credits, activeSemester, onPress, skeleton, pending }: Props) {
  const { t, i18n } = useTranslation();
  const { colors } = useColors();
  const lang = (i18n.language === 'ar' ? 'ar' : 'fr') as 'fr' | 'ar';

  if (skeleton) {
    return (
      <View style={styles.skeletonWrapper}>
        <SkeletonBox width="100%" height={148} borderRadius={radius.rHero} />
      </View>
    );
  }

  const gpaText = gpa !== null ? gpa.toFixed(2) : '—';
  const mention = gpa !== null ? getMention(gpa, lang) : null;
  const mc = gpa !== null ? mentionColor(gpa, colors) : null;
  const earned = credits?.earned ?? 0;
  const total = credits?.total ?? 0;
  const creditPct = total > 0 ? earned / total : 0;
  // Latin digits in both languages — numbers always render in Plus Jakarta Sans.
  const earnedStr = String(earned);
  const totalStr = String(total);

  return (
    <View style={styles.shadow}>
      <PressBox tier="settle" onPress={onPress} style={{ borderRadius: radius.rHero }}>
        <LinearGradient
          colors={['#1D9E75', '#0B5544']} // jade400 → deep jade — on-gradient literals required by LinearGradient
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={styles.card}
        >
          <View style={styles.depthCircle} />

          <Ionicons
            name="stats-chart-outline"
            size={16}
            color={withAlpha('#FFFFFF', 0.70)} // on-gradient literal
            style={styles.chartIcon}
          />

          <Text style={styles.heroLabel} numberOfLines={1}>
            {t('grades.hero_label', { semester: activeSemester })}
          </Text>

          {pending ? (
            <Text style={styles.pendingText}>{t('grades.gpaPending')}</Text>
          ) : (
            <>
              <View style={styles.gpaRow}>
                <Text style={styles.gpaValue}>{gpaText}</Text>
                <Text style={styles.gpaSuffix}>/20</Text>
              </View>

              {mention !== null && mc !== null && (
                <View style={styles.mentionBadge}>
                  <View style={[styles.mentionDot, { backgroundColor: mc.dot }]} />
                  <Text style={styles.mentionText}>{mention}</Text>
                </View>
              )}
            </>
          )}

          <Text style={styles.creditsLabel}>
            {t('grades.hero_credits', { earned: earnedStr, total: totalStr })}
          </Text>
          <View style={styles.barTrack}>
            <View style={[styles.barFill, { width: `${Math.round(creditPct * 100)}%` as any }]} />
          </View>
        </LinearGradient>
      </PressBox>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonWrapper: {
    marginHorizontal: spacing.sp16,
    marginTop: 14,
  },
  shadow: {
    marginHorizontal: spacing.sp16,
    marginTop: 14,
    borderRadius: radius.rHero,
    shadowColor: '#0F6E56', // jade600 — on-gradient literal for shadow
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.30,
    shadowRadius: 28,
    elevation: 8, // hero brand glow — bespoke shadow
  },
  card: {
    borderRadius: radius.rHero,
    padding: spacing.sp20,
    overflow: 'hidden',
  },
  depthCircle: {
    position: 'absolute',
    width: 160,
    height: 160,
    top: -50,
    end: -50,
    borderRadius: radius.rFull,
    backgroundColor: withAlpha('#FFFFFF', 0.07), // on-gradient literal
  },
  chartIcon: {
    position: 'absolute',
    top: 18,
    end: 18,
  },
  heroLabel: {
    fontSize: fz(12.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: withAlpha('#FFFFFF', 0.78), // on-gradient literal
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  gpaRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: spacing.sp6,
    gap: spacing.sp4,
  },
  pendingText: {
    fontSize: fz(15),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: withAlpha('#FFFFFF', 0.92), // on-gradient literal
    marginTop: spacing.sp8,
    lineHeight: fz(21),
    maxWidth: 260,
  },
  gpaValue: {
    fontSize: fz(42),
    fontFamily: fonts.mono,
    color: '#FFFFFF', // on-gradient literal
    lineHeight: fz(46),
  },
  gpaSuffix: {
    fontSize: fz(17),
    fontFamily: fonts.mono,
    color: withAlpha('#FFFFFF', 0.70), // on-gradient literal
    lineHeight: fz(22),
    marginBottom: 6,
  },
  mentionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: withAlpha('#FFFFFF', 0.18), // on-gradient literal
    borderRadius: radius.rFull,
    paddingVertical: 5,
    paddingHorizontal: 11,
    gap: spacing.sp6,
    marginTop: spacing.sp8,
  },
  mentionDot: {
    width: 6,
    height: 6,
    borderRadius: radius.rFull,
  },
  mentionText: {
    fontSize: fz(13),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: '#FFFFFF', // on-gradient literal
  },
  creditsLabel: {
    fontSize: fz(13),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: withAlpha('#FFFFFF', 0.85), // on-gradient literal
    marginTop: 14,
  },
  barTrack: {
    height: 4,
    borderRadius: radius.rFull,
    backgroundColor: withAlpha('#FFFFFF', 0.25), // on-gradient literal
    marginTop: spacing.sp8,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: radius.rFull,
    backgroundColor: '#FFFFFF', // on-gradient literal
  },
});
