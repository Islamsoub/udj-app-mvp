import React, { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet, I18nManager } from 'react-native';
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { StatusPill, CourseStatus } from './StatusPill';
import { getSubjectColor } from '@/constants/colorMap';

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
  onPress?: () => void;
}

export function getAccentColor(course: Course, colors: Palette): string {
  if (course.status === 'past') return colors.greyMuted;
  if (course.status === 'active') return colors.jade400;
  return getSubjectColor(course.subject).accent;
}

export function CourseCard({ course, onPress }: CourseCardProps) {
  const isRTL   = I18nManager.isRTL;
  const { colors } = useColors();
  const accent  = getAccentColor(course, colors);
  const styles = useMemo(() => makeStyles(colors), [colors]);

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
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && { backgroundColor: colors.textPrimary + '0F' }]}
    >
      {!isRTL && accentBar}
      <View style={styles.content}>
        <Text style={styles.subject} numberOfLines={1}>{course.subject}</Text>
        <Text style={styles.subtitle}>{`${course.teacher} · ${course.room}`}</Text>
        <View style={styles.pillRow}>
          <View style={styles.timePill}>
            <Text style={styles.timePillText}>{`${course.start}–${course.end}`}</Text>
          </View>
          <StatusPill status={course.status} />
        </View>
      </View>
      {isRTL && accentBar}
    </Pressable>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.rLg,
    borderWidth: 1,
    borderColor: colors.scheduleBorder,
    overflow: 'hidden',
    flex: 1,
  },
  accentBar: {
    width: 9,
  },
  content: {
    flex: 1,
    paddingStart: 11,
    paddingEnd: 11,
    paddingTop: 11,
    paddingBottom: 11,
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
    marginBottom: 7,
  },
  pillRow: {
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  timePill: {
    height: 20,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 999,
    paddingHorizontal: 14,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  timePillText: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
});
