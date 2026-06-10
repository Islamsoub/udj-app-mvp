import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { fonts, radius, spacing, elevation, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { getSubjectColor } from '@/constants/colorMap';
import { Course } from './CourseCard';

interface OfflineCourseCardProps {
  course: Course;
}

export function OfflineCourseCard({ course }: OfflineCourseCardProps) {
  const accent = getSubjectColor(course.subject).accent;
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.card}>
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.content}>
        <Text style={styles.timeRange}>{`${course.start} – ${course.end}`}</Text>
        <Text style={styles.subject} numberOfLines={2}>{course.subject}</Text>
        <Text style={styles.subtitle}>{`${course.teacher} · ${course.room}`}</Text>
      </View>
    </View>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.rTile,
    overflow: 'hidden',
    ...elevation.card,
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    width: 5,
  },
  content: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 14,
    paddingStart: 18,
    paddingEnd: spacing.sp16,
  },
  timeRange: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.mono,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  subject: {
    fontSize: 15.5,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
});
