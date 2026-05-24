import React, { useMemo } from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fonts, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { CourseCard, Course, getAccentColor } from './CourseCard';

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

  const timeLabel = isPause(entry) ? entry.time : (entry.gutter ?? entry.start);
  const dotColor = isPause(entry) ? colors.connectorLine : getAccentColor(entry, colors);

  const gutter = (
    <View style={styles.gutter}>
      <Text
        style={[styles.timeLabel, { textAlign: isRTL ? 'left' : 'right' }]}
        numberOfLines={1}
      >
        {timeLabel}
      </Text>
    </View>
  );

  const connector = (
    <View style={styles.connectorCol}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      <View style={[styles.line, { backgroundColor: dotColor }]} />
    </View>
  );

  const content = isPause(entry) ? (
    <View style={styles.pauseContent}>
      <Text style={styles.pauseText}>
        {t('schedule.pause_hours', { count: entry.durationHours })}
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
    marginBottom: spacing.sp16,
    alignItems: 'flex-start',
    paddingStart: 33,
  },
  gutter: {
    width: 48,
    paddingTop: spacing.sp6,
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.textSecondary,
  },
  connectorCol: {
    width: 11,
    alignItems: 'center',
    paddingTop: spacing.sp6,
    marginStart: 3,
  },
  dot: {
    width: 11,
    height: 11,
    borderRadius: 5.517,
  },
  line: {
    width: 1,
    height: 30,
    backgroundColor: colors.connectorLine,
    marginTop: 0,
  },
  pauseContent: {
    flex: 1,
    paddingTop: spacing.sp6,
    paddingStart: spacing.sp8,
  },
  pauseText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  cardContent: {
    flex: 1,
    marginStart: 7,
    marginEnd: spacing.sp16,
  },
});
