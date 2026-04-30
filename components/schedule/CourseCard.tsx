import React from 'react';
import { View, Text, StyleSheet, I18nManager } from 'react-native';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { StatusPill, CourseStatus } from './StatusPill';
import { subjectColor } from '@/utils/subjectColor';

export interface Course {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  gutter?: string;
  start: string;
  end: string;
  status: CourseStatus;
}

interface CourseCardProps {
  course: Course;
}

function getAccentColor(course: Course): string {
  if (course.status === 'past') return colors.greyMuted;
  if (course.status === 'active') return colors.jade400;
  return subjectColor(course.subject);
}

export function CourseCard({ course }: CourseCardProps) {
  const isRTL   = I18nManager.isRTL;
  const accent  = getAccentColor(course);

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
        <Text style={styles.subject} numberOfLines={2}>{course.subject}</Text>
        <Text style={styles.subtitle}>{`${course.teacher} · ${course.room}`}</Text>
        <View style={styles.pillRow}>
          <View style={styles.timePill}>
            <Text style={styles.timePillText}>{`${course.start}–${course.end}`}</Text>
          </View>
          <StatusPill status={course.status} />
        </View>
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
    minHeight: 87,
    overflow: 'hidden',
    width: '100%',
  },
  accentBar: {
    width: 6,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.sp12,
    paddingVertical: spacing.sp12,
    gap: spacing.sp2,
  },
  subject: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  pillRow: {
    flexDirection: 'row',
    gap: spacing.sp8,
    marginTop: spacing.sp8,
    alignItems: 'center',
  },
  timePill: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.rFull,
    paddingHorizontal: spacing.sp12,
    paddingVertical: spacing.sp6,
    backgroundColor: colors.surface,
  },
  timePillText: {
    fontSize: 13,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
});
