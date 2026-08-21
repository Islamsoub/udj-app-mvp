import React, { useRef, useEffect, useState } from 'react';
import { View, Text, Animated, Easing, AccessibilityInfo, StyleSheet, ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, spacing } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';

export type CourseStatus = 'past' | 'active' | 'upcoming';

interface StatusPillProps {
  status: CourseStatus;
  style?: ViewStyle;
}

export function StatusPill({ status, style }: StatusPillProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const [reduceMotion, setReduceMotion] = useState(false);
  const blinkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion).catch(() => {});
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (status !== 'active' || reduceMotion) {
      blinkAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.25, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1,    duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [status, reduceMotion, blinkAnim]);

  const variants: Record<CourseStatus, { bg: string; color: string; key: string }> = {
    past:     { bg: colors.slateBg,   color: colors.slate,    key: 'schedule.status.done' },
    active:   { bg: colors.jadeFaint, color: colors.jadeText, key: 'schedule.status.active' },
    upcoming: { bg: colors.blueBg,    color: colors.blue,     key: 'schedule.status.upcoming' },
  };

  const { bg, color, key } = variants[status];

  return (
    <View style={[styles.pill, { backgroundColor: bg }, style]}>
      {status === 'active' && (
        <Animated.View
          style={[styles.activeDot, { backgroundColor: colors.jade400, opacity: blinkAnim }]}
        />
      )}
      <Text style={[styles.text, { color }]}>{t(key)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.rFull,
    paddingVertical: 5, // design constant: pill padding
    paddingHorizontal: spacing.sp12,
    alignSelf: 'flex-start',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: radius.rFull,
    marginEnd: spacing.sp6,
  },
  text: {
    fontSize: fz(13),
    fontWeight: '700',
    fontFamily: fonts.sans,
  },
});
