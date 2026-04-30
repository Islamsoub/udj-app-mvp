import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, spacing } from '@/constants/theme';
import { CourseCard, Course } from './CourseCard';
import { subjectColor } from '@/utils/subjectColor';

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
  const dotColor  = isPause(entry) || entry.status !== 'active'
    ? colors.connectorLine
    : subjectColor(entry.subject);

  const gutter = (
    <View style={styles.gutter}>
      <Text style={[styles.timeLabel, { textAlign: isRTL ? 'left' : 'right' }]}>
        {timeLabel}
      </Text>
    </View>
  );

  const connector = (
    <View style={styles.connectorCol}>
      <View style={[styles.dot, { backgroundColor: dotColor }]} />
      {!isLast && <View style={styles.line} />}
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
    marginStart: -spacing.sp8,
  },
  gutter: {
    width: 44,
    paddingTop: 6,
    paddingEnd: spacing.sp8,
  },
  timeLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  connectorCol: {
    width: 20,
    alignItems: 'center',
    paddingTop: 6,
    alignSelf: 'stretch',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  line: {
    flex: 1,
    width: 1,
    backgroundColor: colors.connectorLine,
    marginTop: spacing.sp4,
    minHeight: 20,
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
    flex: 1,
  },
});
