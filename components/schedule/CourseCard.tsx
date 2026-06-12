import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { fonts, fz, radius, spacing, elevation, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { StatusPill, CourseStatus } from './StatusPill';
import { getSubjectColor } from '@/constants/colorMap';

export interface Course {
  id: string;
  subject: string;
  teacher: string;
  room: string;
  start: string;
  end: string;
  status: CourseStatus;
}

interface CourseCardProps {
  course: Course;
  onPress?: () => void;
}

export function getAccentColor(course: Course, colors: Palette, isDark: boolean = false): string {
  if (course.status === 'active') return colors.jade400;
  return getSubjectColor(course.subject, isDark).accent;
}

export function CourseCard({ course, onPress }: CourseCardProps) {
  const { colors, isDark } = useColors();
  const accent  = getAccentColor(course, colors, isDark);
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.06) }]}
    >
      <View style={[styles.accentBar, { backgroundColor: accent }]} />
      <View style={styles.content}>
        <Text
          style={[styles.subject, { color: course.status === 'past' ? colors.textSecondary : colors.textPrimary }]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {course.subject}
        </Text>
        <Text style={styles.subtitle}>{`${course.teacher} · ${course.room}`}</Text>
        <View style={styles.pillRow}>
          <View style={styles.timePill}>
            <Text style={styles.timePillText} numberOfLines={1}>{`${course.start} – ${course.end}`}</Text>
          </View>
          <StatusPill status={course.status} style={styles.statusPill} />
        </View>
      </View>
    </Pressable>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.rTile,
    overflow: 'hidden',
    flex: 1,
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
    paddingTop: spacing.sp14,
    paddingBottom: spacing.sp14,
    paddingStart: spacing.sp16,
    paddingEnd: spacing.sp16,
  },
  subject: {
    fontSize: fz(15.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    flexShrink: 1,
  },
  subtitle: {
    fontSize: fz(14),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    marginTop: spacing.sp2,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp8,
    marginTop: spacing.sp12,
  },
  timePill: {
    backgroundColor: colors.surface2,
    borderRadius: radius.rFull,
    paddingVertical: 5, // design constant: pill padding
    paddingHorizontal: spacing.sp12,
    flexShrink: 0,
  },
  timePillText: {
    fontSize: fz(13),
    fontFamily: fonts.mono,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  statusPill: {
    flexShrink: 0,
  },
});
