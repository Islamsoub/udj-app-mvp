import React, { useMemo, useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated, Easing, AccessibilityInfo } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { CourseCard, Course } from './CourseCard';
import { getSubjectColor } from '@/constants/colorMap';

export type PauseEntry = { type: 'pause'; time: string; durationHours: number };
export type DayEntry   = Course | PauseEntry;

function isPause(entry: DayEntry): entry is PauseEntry {
  return (entry as PauseEntry).type === 'pause';
}

interface TimelineRowProps {
  entry: DayEntry;
  isLast: boolean;
  onPress?: () => void;
}

export function TimelineRow({ entry, isLast, onPress }: TimelineRowProps) {
  const { t } = useTranslation();
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isActive = !isPause(entry) && entry.status === 'active';
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  const ringScale   = useRef(new Animated.Value(0.85)).current;
  const ringOpacity = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    if (!isActive || reduceMotion) {
      ringScale.setValue(0.85);
      ringOpacity.setValue(0.85);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(ringScale,   { toValue: 2.0,  duration: 1900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0,    duration: 1900, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        ]),
        // Instant reset before next cycle
        Animated.parallel([
          Animated.timing(ringScale,   { toValue: 0.85, duration: 1, useNativeDriver: true }),
          Animated.timing(ringOpacity, { toValue: 0.85, duration: 1, useNativeDriver: true }),
        ]),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, reduceMotion, ringScale, ringOpacity]);

  const dot = isPause(entry) ? (
    <View style={styles.pauseDot} />
  ) : isActive ? (
    <View style={styles.dotWrap}>
      {/* Static halo ring — visible between animation pulses */}
      <View style={[styles.haloStatic, { borderColor: colors.jade400 }]} />
      {/* Pulsing ring — hidden when reduce motion is on */}
      {!reduceMotion && (
        <Animated.View
          style={[
            styles.haloAnim,
            { borderColor: colors.jade400, opacity: ringOpacity, transform: [{ scale: ringScale }] },
          ]}
        />
      )}
      {/* Solid jade dot — rendered last so it sits on top */}
      <View style={[styles.dotSolid, { backgroundColor: colors.jade400 }]} />
    </View>
  ) : (
    <View style={[styles.dot, { backgroundColor: getSubjectColor(entry.subject, isDark).accent }]} />
  );

  const connector = (
    <View style={styles.connectorCol}>
      {dot}
      {!isLast && <View style={styles.line} />}
    </View>
  );

  const content = isPause(entry) ? (
    <View style={styles.pauseContent}>
      <Text style={styles.pauseText}>
        {t('schedule.break', { hours: entry.durationHours })}
      </Text>
    </View>
  ) : (
    <View style={styles.cardContent}>
      <CourseCard course={entry} onPress={onPress} />
    </View>
  );

  return (
    <View style={styles.row}>
      {/* Fixed order — forceRTL mirrors the row natively. Swapping the children
          by hand as well double-flips the connector back to the wrong side. */}
      {connector}
      {content}
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: spacing.sp16,
    marginBottom: spacing.sp16,
  },
  connectorCol: {
    width: 24,
    alignItems: 'center',
  },
  // Active dot: 24×24 wrapper so absolute rings have a defined frame
  dotWrap: {
    width: 24,
    height: 24,
    marginTop: spacing.sp16,
  },
  // Static halo ring — always rendered for active status
  haloStatic: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: radius.rFull,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  // Animated pulsing ring — same geometry as haloStatic
  haloAnim: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 18,
    height: 18,
    borderRadius: radius.rFull,
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  // Solid jade dot inside the wrapper
  dotSolid: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 12,
    height: 12,
    borderRadius: radius.rFull,
  },
  // Non-active dot
  dot: {
    width: 12,
    height: 12,
    borderRadius: radius.rFull,
    marginTop: spacing.sp16,
  },
  pauseDot: {
    width: 10,
    height: 10,
    borderRadius: radius.rFull,
    borderWidth: 2,
    borderColor: colors.hair,
    backgroundColor: 'transparent',
    marginTop: spacing.sp16,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.hair,
  },
  pauseContent: {
    flex: 1,
    paddingTop: spacing.sp12,
    minHeight: 44,
  },
  pauseText: {
    fontSize: fz(14),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },
  cardContent: {
    flex: 1,
  },
});
