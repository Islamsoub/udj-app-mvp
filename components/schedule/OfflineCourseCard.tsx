import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { colors, fonts, radius, spacing } from '@/constants/theme';
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
    height: 104,
    overflow: 'hidden',
  },
  accentBar: {
    width: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp12,
    justifyContent: 'center',
    gap: spacing.sp4,
  },
  timeRange: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  subject: {
    fontSize: 17,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
});
