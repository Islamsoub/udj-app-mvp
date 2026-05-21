import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { useCourseDetailStore } from '@/stores/courseDetailStore';
import type { CourseStatus } from './StatusPill';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function pillVariant(status: CourseStatus): { bg: string; text: string } {
  switch (status) {
    case 'active':
      return { bg: 'rgba(139,92,246,0.15)', text: colors.exam };
    case 'past':
      return { bg: colors.border, text: colors.greyMedium };
    case 'upcoming':
      return { bg: 'rgba(29,158,117,0.15)', text: colors.jade600 };
  }
}

function statusI18nKey(status: CourseStatus): string {
  switch (status) {
    case 'active':   return 'course.status_active';
    case 'past':     return 'course.status_past';
    case 'upcoming': return 'course.status_upcoming';
  }
}

export function CourseDetailSheet({ visible, onClose }: Props) {
  const { t } = useTranslation();
  const selectedCourse  = useCourseDetailStore((s) => s.selectedCourse);
  const personalNote    = useCourseDetailStore((s) => s.personalNote);
  const setPersonalNote = useCourseDetailStore((s) => s.setPersonalNote);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    });
    return () => sub.remove();
  }, []);

  const course   = selectedCourse;
  const timeStr  = course ? `${course.start} – ${course.end}` : '';
  const pill     = course ? pillVariant(course.status) : null;
  const coefStr  = course ? String(course.coefficient) : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Scrim — sibling behind the sheet */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={styles.sheet}>
          {/* Drag handle — outside scroll */}
          <View style={styles.handle} />

          <ScrollView
            ref={scrollRef}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Subject name */}
            <Text style={styles.subject} numberOfLines={2}>
              {course?.subject ?? ''}
            </Text>

            {/* Teacher */}
            <Text style={styles.teacher}>
              {course?.teacher ?? ''}
            </Text>

            {/* Divider */}
            <View style={styles.divider} />

            {/* ── Info rows ── */}
            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>{t('course.room')}</Text>
              <Text style={styles.rowValue}>{course?.room ?? ''}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>{t('course.time')}</Text>
              <Text style={styles.rowValueMono}>{timeStr}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>{t('course.code')}</Text>
              <Text style={styles.rowValueMono}>{course?.code ?? ''}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.rowLabel}>{t('course.coefficient')}</Text>
              <Text style={styles.rowValueMono}>{coefStr}</Text>
            </View>

            {/* Status row — last: no bottom border needed from neighbors */}
            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.rowLabel}>{t('course.status')}</Text>
              {course && pill ? (
                <View style={[styles.statusPill, { backgroundColor: pill.bg }]}>
                  <Text style={[styles.statusPillText, { color: pill.text }]}>
                    {t(statusI18nKey(course.status))}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Notes section header */}
            <Text style={styles.notesHeader}>{t('course.notes_section')}</Text>

            {/* Notes text input */}
            <TextInput
              style={styles.notesInput}
              multiline
              value={personalNote}
              onChangeText={setPersonalNote}
              placeholder={t('course.notes_placeholder')}
              placeholderTextColor={colors.textTertiary}
              textAlignVertical="top"
            />

            {/* Save button */}
            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
              onPress={onClose}
            >
              <Text style={styles.saveBtnText}>{t('course.save')}</Text>
            </Pressable>

            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.r2xl,
    borderTopRightRadius: radius.r2xl,
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: radius.rFull,
    backgroundColor: '#E5E5E5',
    marginTop: 12,
    marginBottom: 20,
  },

  // ── Header text
  subject: {
    fontSize: 18,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    paddingHorizontal: spacing.sp20,
  },
  teacher: {
    fontSize: 15,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
    marginTop: spacing.sp4,
    paddingHorizontal: spacing.sp20,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sp16,
    marginHorizontal: spacing.sp20,
  },

  // ── Info rows
  infoRow: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
  },
  rowValueMono: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.mono,
    color: colors.greyMedium,
  },

  // ── Status pill
  statusPill: {
    height: 28,
    borderRadius: radius.rFull,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.sans,
  },

  // ── Notes section
  notesHeader: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.sans,
    letterSpacing: 0.6,
    color: colors.greyMedium,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sp20,
    marginTop: spacing.sp16,
    marginBottom: spacing.sp8,
  },
  notesInput: {
    minHeight: 80,
    borderRadius: radius.rLg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp12,
    marginHorizontal: spacing.sp20,
    fontSize: 14,
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },

  // ── Save button
  saveBtn: {
    marginHorizontal: spacing.sp20,
    marginTop: spacing.sp16,
    marginBottom: 28,
    height: 52,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnPressed: {
    backgroundColor: colors.jade600,
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
