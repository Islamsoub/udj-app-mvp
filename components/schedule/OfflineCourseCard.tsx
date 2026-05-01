import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { colors, radius } from '@/constants/theme';
import { subjectColor } from '@/utils/subjectColor';
import { Course } from './CourseCard';

interface OfflineCourseCardProps {
  course: Course;
}

export function OfflineCourseCard({ course }: OfflineCourseCardProps) {
  const isRTL  = I18nManager.isRTL;
  const accent = subjectColor(course.subject);

  const accentBar = (
    <View
      style={[
        styles.accentBar,
        { backgroundColor: accent },
        isRTL
          ? { borderTopEndRadius: radius.rLg, borderBottomEndRadius: radius.rLg }
          : { borderTopStartRadius: radius.rLg, borderBottomStartRadius: radius.rLg },
      ]}
    />
  );

  return (
    <View style={styles.card}>
      {!isRTL && accentBar}
      <View style={styles.content}>
        <Text style={styles.timeRange}>{`${course.start} – ${course.end}`}</Text>
        <Text style={styles.subject} numberOfLines={2}>{course.subject}</Text>
        <Text style={styles.subtitle}>{`${course.teacher} · ${course.room}`}</Text>
      </View>
      {isRTL && accentBar}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.rLg,
    borderWidth: 1,
    borderColor: colors.scheduleBorder,
    overflow: 'hidden',
  },
  accentBar: {
    width: 9,
  },
  content: {
    flex: 1,
    paddingStart: 11,
    paddingEnd: 11,
    paddingTop: 13,
    paddingBottom: 17,
    gap: 0,
  },
  timeRange: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Medium',
    color: colors.textSecondary,
    marginBottom: 4,
  },
  subject: {
    fontSize: 12,
    fontFamily: 'PlusJakartaSans-Bold',
    color: colors.dmCard,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
    color: colors.textSecondary,
  },
});
