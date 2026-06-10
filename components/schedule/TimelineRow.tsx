import React, { useMemo, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, I18nManager, Animated } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
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
  const isRTL = I18nManager.isRTL;
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isActive = !isPause(entry) && entry.status === 'active';
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (!isActive) {
      pulseAnim.setValue(1);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.4, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,   duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, pulseAnim]);

  const timeLabel = isPause(entry) ? entry.time : (entry.gutter ?? entry.start);
  const timeColor = isPause(entry) || (!isPause(entry) && entry.status === 'past')
    ? colors.textTertiary
    : colors.textSecondary;

  const dot = isPause(entry) ? (
    <View style={styles.pauseDot} />
  ) : isActive ? (
    <Animated.View style={[styles.dot, { backgroundColor: colors.jade400, opacity: pulseAnim }]} />
  ) : (
    <View style={[styles.dot, { backgroundColor: getSubjectColor(entry.subject).accent }]} />
  );

  const gutter = (
    <View style={styles.gutter}>
      <Text
        style={[styles.timeLabel, { color: timeColor, textAlign: isRTL ? 'left' : 'right' }]}
        numberOfLines={1}
      >
        {timeLabel}
      </Text>
    </View>
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
      {isRTL
        ? <>{content}{connector}{gutter}</>
        : <>{gutter}{connector}{content}</>}
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
  gutter: {
    width: 52,
    paddingEnd: 12,
    paddingTop: 15,
    alignItems: 'flex-end',
  },
  timeLabel: {
    fontSize: 13,
    fontFamily: fonts.mono,
    fontWeight: '500',
  },
  connectorCol: {
    width: 24,
    alignItems: 'center',
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: radius.rFull,
    marginTop: 15,
  },
  pauseDot: {
    width: 10,
    height: 10,
    borderRadius: radius.rFull,
    borderWidth: 2,
    borderColor: colors.hair,
    backgroundColor: 'transparent',
    marginTop: 15,
  },
  line: {
    width: 2,
    flex: 1,
    backgroundColor: colors.hair,
  },
  pauseContent: {
    flex: 1,
    paddingTop: 13,
    minHeight: 44,
  },
  pauseText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
  },
  cardContent: {
    flex: 1,
  },
});
