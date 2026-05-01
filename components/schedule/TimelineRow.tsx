import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing } from '@/constants/theme';
import { CourseCard, Course, getAccentColor } from './CourseCard';

export type PauseEntry = { type: 'pause'; time: string; durationHours: number };
export type DayEntry   = Course | PauseEntry;

function isPause(entry: DayEntry): entry is PauseEntry {
  return (entry as PauseEntry).type === 'pause';
}

interface TimelineRowProps {
  entry: DayEntry;
  isLast: boolean;
}

export function TimelineRow({ entry, isLast }: TimelineRowProps) {
  const { t } = useTranslation();
  const isRTL = I18nManager.isRTL;

  const timeLabel = isPause(entry) ? entry.time : (entry.gutter ?? entry.start);
  const dotColor = isPause(entry) ? colors.connectorLine : getAccentColor(entry);

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
      <CourseCard course={entry} />
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    marginBottom: spacing.sp16,
    alignItems: 'flex-start',
    paddingStart: 33,
  },
  gutter: {
    width: 48,
    paddingTop: 6,
  },
  timeLabel: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.textSecondary,
  },
  connectorCol: {
    width: 11,
    alignItems: 'center',
    paddingTop: 6,
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
    paddingTop: 6,
    paddingStart: spacing.sp8,
  },
  pauseText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  cardContent: {
    marginStart: 7,
  },
});
