import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  TextInput,
  StyleSheet,
  Keyboard,
} from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, sizing, scrimColor, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useCourseDetailStore } from '@/stores/courseDetailStore';
import {
  getCourseNotes,
  saveCourseNote,
  deleteCourseNote,
  type CourseNote,
} from '@/services/db';
import { StatusPill } from './StatusPill';
import { getAccentColor } from './CourseCard';

interface Props {
  visible: boolean;
  onClose: () => void;
}

function formatNoteTimestamp(dateStr: string, lang: string): string {
  const date = new Date(dateStr);
  const locale = lang === 'ar' ? 'ar-DJ' : 'fr-FR';
  return date.toLocaleDateString(locale, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function TrashIcon({ color }: { color: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m4 5v6m6-6v6"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CourseDetailSheet({ visible, onClose }: Props) {
  const { t, i18n } = useTranslation();
  const { colors } = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const selectedCourse = useCourseDetailStore((s) => s.selectedCourse);
  const scrollRef = useRef<React.ElementRef<typeof KeyboardAwareScrollView>>(null);

  const [noteText, setNoteText] = useState('');
  const [notes, setNotes] = useState<CourseNote[]>([]);

  const course      = selectedCourse;
  const subjectCode = course?.code ?? null;
  const dayOfWeek   = course?.dayOfWeek ?? null;
  const courseColor = course ? getAccentColor(course, colors) : colors.jade400;

  const refreshNotes = useCallback(async () => {
    if (subjectCode == null || dayOfWeek == null) {
      setNotes([]);
      return;
    }
    const rows = await getCourseNotes(subjectCode, dayOfWeek);
    setNotes(rows);
  }, [subjectCode, dayOfWeek]);

  useEffect(() => {
    if (!visible) return;
    setNoteText('');
    void refreshNotes();
  }, [visible, refreshNotes]);

  const handleSave = useCallback(async () => {
    Keyboard.dismiss();
    const trimmed = noteText.trim();
    if (!trimmed || subjectCode == null || dayOfWeek == null) return;
    await saveCourseNote(subjectCode, dayOfWeek, trimmed);
    setNoteText('');
    await refreshNotes();
  }, [noteText, subjectCode, dayOfWeek, refreshNotes]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteCourseNote(id);
    await refreshNotes();
  }, [refreshNotes]);

  const timeStr = course ? `${course.start} – ${course.end}` : '';
  const coefStr = course ? String(course.coefficient) : '';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Scrim */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheet, { paddingBottom: Math.max(26, insets.bottom + 10) }]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          <KeyboardAwareScrollView
            ref={scrollRef}
            bottomOffset={90}
            disableScrollOnKeyboardHide
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Header: color dot + subject + professor */}
            <View style={styles.headerRow}>
              <View style={[styles.courseDot, { backgroundColor: courseColor }]} />
              <View style={styles.headerText}>
                <Text style={styles.subject} numberOfLines={2}>
                  {course?.subject ?? ''}
                </Text>
                <Text style={styles.teacher}>
                  {course?.teacher ?? ''}
                </Text>
              </View>
            </View>

            {/* Hairline divider */}
            <View style={styles.divider} />

            {/* Info rows */}
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

            <View style={[styles.infoRow, styles.infoRowLast]}>
              <Text style={styles.rowLabel}>{t('course.status')}</Text>
              {course && <StatusPill status={course.status} />}
            </View>

            {/* Notes section */}
            <Text style={styles.notesHeader}>{t('course.notes_section')}</Text>

            <TextInput
              style={styles.notesInput}
              multiline
              value={noteText}
              onChangeText={setNoteText}
              placeholder={t('course.notes_placeholder')}
              placeholderTextColor={colors.textTertiary}
              textAlignVertical="top"
            />

            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>{t('course.save')}</Text>
            </Pressable>

            <View style={styles.notesList}>
              {notes.map((n) => (
                <View key={n.id} style={styles.noteCard}>
                  <Text style={styles.noteText}>{n.note}</Text>
                  <View style={styles.noteFooter}>
                    <Text style={styles.noteTimestamp}>
                      {formatNoteTimestamp(n.createdAt, i18n.language)}
                    </Text>
                    <Pressable
                      onPress={() => handleDelete(n.id)}
                      hitSlop={14}
                      accessibilityRole="button"
                      accessibilityLabel={t('course.notes_delete')}
                      style={styles.noteDeleteBtn}
                    >
                      <TrashIcon color={colors.textTertiary} />
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>

          </KeyboardAwareScrollView>
        </View>
      </View>
    </Modal>
  );
}

const makeStyles = (colors: Palette) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: scrimColor,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.r2xl,
    borderTopRightRadius: radius.r2xl,
  },
  handle: {
    alignSelf: 'center',
    width: 38,
    height: 5,
    borderRadius: radius.rFull,
    backgroundColor: colors.hair,
    marginTop: spacing.sp12,
    marginBottom: spacing.sp20,
  },

  // ── Header
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sp20,
  },
  courseDot: {
    width: 10,
    height: 10,
    borderRadius: radius.rFull,
    marginTop: 6,
    marginEnd: spacing.sp8,
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  subject: {
    fontSize: 22,
    fontWeight: '800',
    fontFamily: fonts.sans,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  teacher: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.hair,
    marginTop: spacing.sp16,
    marginHorizontal: spacing.sp20,
  },

  // ── Info rows
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: 14.5,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: 14.5,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  rowValueMono: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.mono,
    color: colors.textPrimary,
  },

  // ── Notes section
  notesHeader: {
    fontSize: 12.5,
    fontWeight: '700',
    fontFamily: fonts.sans,
    letterSpacing: 0.6,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.sp20,
    marginTop: spacing.sp20,
    marginBottom: spacing.sp8,
  },
  notesInput: {
    minHeight: 88,
    borderRadius: radius.rMd,
    borderWidth: 1,
    borderColor: colors.hair,
    backgroundColor: colors.surface2,
    paddingHorizontal: spacing.sp14,
    paddingVertical: spacing.sp12,
    marginHorizontal: spacing.sp20,
    fontSize: 14.5,
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },

  // ── Save button
  saveBtn: {
    marginHorizontal: spacing.sp20,
    marginTop: spacing.sp16,
    height: 50,
    borderRadius: radius.rBtn,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnPressed: {
    backgroundColor: colors.jade600,
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },

  // ── Saved notes list
  notesList: {
    marginTop: spacing.sp16,
    paddingHorizontal: spacing.sp20,
    paddingBottom: spacing.sp32,
  },
  noteCard: {
    backgroundColor: colors.bgCard,
    borderRadius: radius.rMd,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.sp12,
    marginBottom: spacing.sp8,
  },
  noteText: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  noteFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sp8,
  },
  noteTimestamp: {
    fontSize: 12,
    fontFamily: fonts.mono,
    color: colors.textTertiary,
  },
  noteDeleteBtn: {
    minWidth: sizing.touchTarget,
    minHeight: sizing.touchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
