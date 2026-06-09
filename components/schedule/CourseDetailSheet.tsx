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
import { fonts, radius, spacing, sizing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useCourseDetailStore } from '@/stores/courseDetailStore';
import {
  getCourseNotes,
  saveCourseNote,
  deleteCourseNote,
  type CourseNote,
} from '@/services/db';
import type { CourseStatus } from './StatusPill';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

// Stored timestamps are UTC ISO strings; render in the device's local time.
function formatNoteTimestamp(iso: string): string {
  const d = new Date(iso);
  const day = d.getDate();
  const month = MONTHS_FR[d.getMonth()];
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${day} ${month} à ${hh}:${mm}`;
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

function pillVariant(status: CourseStatus, colors: Palette): { bg: string; text: string } {
  switch (status) {
    case 'active':
      return { bg: withAlpha(colors.exam, 0.15), text: colors.exam };
    case 'past':
      return { bg: colors.border, text: colors.greyMedium };
    case 'upcoming':
      return { bg: withAlpha(colors.jade400, 0.15), text: colors.jade600 };
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

  const refreshNotes = useCallback(async () => {
    if (subjectCode == null || dayOfWeek == null) {
      setNotes([]);
      return;
    }
    const rows = await getCourseNotes(subjectCode, dayOfWeek);
    setNotes(rows);
  }, [subjectCode, dayOfWeek]);

  // Load notes whenever the sheet opens or targets a different course.
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
  const pill    = course ? pillVariant(course.status, colors) : null;
  const coefStr = course ? String(course.coefficient) : '';

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

        <View style={[styles.sheet, { paddingBottom: insets.bottom }]}>
          {/* Drag handle — outside scroll */}
          <View style={styles.handle} />

          <KeyboardAwareScrollView
            ref={scrollRef}
            bottomOffset={90}
            disableScrollOnKeyboardHide
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
              value={noteText}
              onChangeText={setNoteText}
              placeholder={t('course.notes_placeholder')}
              placeholderTextColor={colors.textTertiary}
              textAlignVertical="top"
            />

            {/* Save button */}
            <Pressable
              style={({ pressed }) => [styles.saveBtn, pressed && styles.saveBtnPressed]}
              onPress={handleSave}
            >
              <Text style={styles.saveBtnText}>{t('course.save')}</Text>
            </Pressable>

            {/* Saved notes list */}
            <View style={styles.notesList}>
              {notes.length === 0 ? (
                <Text style={styles.notesEmpty}>{t('course.notes_empty')}</Text>
              ) : (
                notes.map((n) => (
                  <View key={n.id} style={styles.noteCard}>
                    <Text style={styles.noteText}>{n.note}</Text>
                    <View style={styles.noteFooter}>
                      <Text style={styles.noteTimestamp}>
                        {formatNoteTimestamp(n.createdAt)}
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
                ))
              )}
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
    backgroundColor: withAlpha(colors.black, 0.45),
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
    backgroundColor: colors.hair,
    marginTop: spacing.sp12,
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
    height: 56,
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
    paddingHorizontal: spacing.sp12,
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

  // ── Saved notes list
  notesList: {
    marginTop: spacing.sp16,
    paddingHorizontal: spacing.sp20,
  },
  notesEmpty: {
    fontSize: 14,
    fontFamily: fonts.sans,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingVertical: spacing.sp12,
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
    fontSize: 11,
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
