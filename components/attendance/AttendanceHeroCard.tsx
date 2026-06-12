import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, spacing, withAlpha } from '@/constants/theme';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { BADGE_REGULAR_PCT, BADGE_WARNING_PCT } from '@/constants/attendance';

const RING_SIZE = 96;
const RING_R = 38;
const STROKE_W = 8;
const CIRC = 2 * Math.PI * RING_R;

interface Props {
  percentage: number;
  absences: number;
  totalSessions: number;
  skeleton?: boolean;
}

function badgeKey(pct: number): string {
  if (pct >= BADGE_REGULAR_PCT) return 'presence.badge_regular';
  if (pct >= BADGE_WARNING_PCT) return 'presence.badge_warning';
  return 'presence.badge_critical';
}

export function AttendanceHeroCard({ percentage, absences, totalSessions, skeleton }: Props) {
  const { t } = useTranslation();

  if (skeleton) {
    return (
      <View style={styles.skeletonWrapper}>
        <SkeletonBox width="100%" height={132} borderRadius={radius.rHero} />
      </View>
    );
  }

  const pct = Math.min(100, Math.max(0, percentage));
  const dashOffset = CIRC * (1 - pct / 100);

  return (
    <View style={styles.shadow}>
      <LinearGradient
        colors={['#1D9E75', '#0B5544']} // jade400 → deep jade — literals required by LinearGradient
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={styles.card}
      >
        <View style={styles.depthCircle} />

        <View style={styles.innerRow}>
          <Svg width={RING_SIZE} height={RING_SIZE}>
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke={withAlpha('#FFFFFF', 0.25)}
              strokeWidth={STROKE_W}
              fill="none"
            />
            <Circle
              cx={RING_SIZE / 2}
              cy={RING_SIZE / 2}
              r={RING_R}
              stroke="#FFFFFF"
              strokeWidth={STROKE_W}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${CIRC} ${CIRC}`}
              strokeDashoffset={dashOffset}
              rotation={-90}
              origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
            />
            <SvgText
              x={RING_SIZE / 2}
              y={RING_SIZE / 2}
              textAnchor="middle"
              alignmentBaseline="central"
              fill="#FFFFFF"
              fontSize={24}
              fontWeight="500"
              fontFamily={fonts.mono}
            >
              {`${pct}%`}
            </SvgText>
          </Svg>

          <View style={styles.rightCol}>
            <Text style={styles.rateLabel}>{t('presence.rate_label')}</Text>
            <View style={styles.pill}>
              <View style={styles.dot} />
              <Text style={styles.pillText}>{t(badgeKey(percentage))}</Text>
            </View>
            <Text style={styles.summary}>
              {t('presence.summary', { absent: absences, total: totalSessions })}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  skeletonWrapper: {
    marginHorizontal: spacing.sp16,
    marginTop: spacing.sp4,
  },
  shadow: {
    marginHorizontal: spacing.sp16,
    marginTop: spacing.sp4,
    borderRadius: radius.rHero,
    shadowColor: '#0F6E56', // jade600 — literal for shadow (no colors.* in static StyleSheet)
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
    width: 140,
    height: 140,
    top: -40,
    end: -40,
    borderRadius: radius.rFull,
    backgroundColor: withAlpha('#FFFFFF', 0.07),
  },
  innerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp20,
  },
  rightCol: {
    flex: 1,
  },
  rateLabel: {
    fontSize: fz(12.5),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: withAlpha('#FFFFFF', 0.78),
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: withAlpha('#FFFFFF', 0.18),
    borderRadius: radius.rFull,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 6,
    marginTop: spacing.sp8,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: radius.rFull,
    backgroundColor: '#7DF3C4', // mint accent — on-gradient literal, intentional
  },
  pillText: {
    fontSize: fz(12.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: '#FFFFFF',
  },
  summary: {
    fontSize: fz(13),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: withAlpha('#FFFFFF', 0.85),
    marginTop: 10,
  },
});
