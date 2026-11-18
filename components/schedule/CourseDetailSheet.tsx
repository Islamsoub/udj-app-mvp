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
import { PressBox } from '@/components/PressBox';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fonts, fz, radius, spacing, sizing, scrimColor, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { useCourseDetailStore } from '@/stores/courseDetailStore';
import { useAuthStore } from '@/stores/authStore';
import { useNetworkStore } from '@/stores/networkStore';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { getCourseNotesDb } from '@/services/db';
import {
  createCourseNote,
  deleteCourseNoteOnServer,
  fetchCourseNotes,
  httpStatusOf,
  type CourseNoteDto,
} from '@/services/api';
import {
  putServerNote,
  readClassNotes,
  removeLocalNote,
  replaceClassCopy,
  type LocalNote,
} from '@/services/courseNotesStore';
import { StatusPill } from './StatusPill';
import { getAccentColor } from './CourseCard';

interface Props {
  visible: boolean;
  onClose: () => void;
}

/** The server's limit, counted in code points like the server does. */
const NOTE_MAX = 2000;

type SaveError = 'save_error' | 'rate_limited' | 'too_long';

const fromServer = (n: CourseNoteDto): LocalNote => ({
  localId: n.id,
  serverId: n.id,
  body: n.body,
  createdAt: n.createdAt,
  deviceOnly: false,
  pending: false,
});

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
  const { colors, isDark } = useColors();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const selectedCourse = useCourseDetailStore((s) => s.selectedCourse);
  const scrollRef = useRef<React.ElementRef<typeof KeyboardAwareScrollView>>(null);

  const [noteText, setNoteText] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<SaveError | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteErrorId, setDeleteErrorId] = useState<string | null>(null);
  /** A 404 on save: the subject left this student's timetable after the read. */
  const [unavailableOnSave, setUnavailableOnSave] = useState(false);

  const course      = selectedCourse;
  const subjectCode = course?.code ?? null;
  const dayOfWeek   = course?.dayOfWeek ?? null;
  const courseColor = course ? getAccentColor(course, colors, isDark) : colors.jade400;
  const studentId   = useAuthStore((s) => s.student?.id ?? null);
  const isOnline    = useNetworkStore((s) => s.isOnline);

  // Server first; the local copy is shown at once and when offline.
  // getCached returns null for "nothing on this phone" so a first open shows the
  // skeleton rather than a flash of "no notes".
  const classKey = `${studentId}:${subjectCode}:${dayOfWeek}`;
  const query = useOfflineQuery<LocalNote[]>({
    cacheKey: `course-notes:${classKey}`,
    enabled: visible && !!studentId && subjectCode != null && dayOfWeek != null,
    getCached: async () => {
      const rows = await readClassNotes(await getCourseNotesDb(), studentId!, subjectCode!, dayOfWeek!);
      return rows.length ? rows : null;
    },
    fetchFresh: async () =>
      (await fetchCourseNotes({ subjectCode: subjectCode!, dayOfWeek: dayOfWeek! })).map(fromServer),
    updateCache: async (fresh) => {
      await replaceClassCopy(
        await getCourseNotesDb(),
        studentId!,
        subjectCode!,
        dayOfWeek!,
        fresh.map((n) => ({ id: n.serverId!, subjectCode: subjectCode!, dayOfWeek: dayOfWeek!, body: n.body, createdAt: n.createdAt })),
      );
    },
  });

  // What the list shows: the query's result, then each change the server confirmed.
  const [notes, setNotes] = useState<LocalNote[] | null>(null);
  const [notesKey, setNotesKey] = useState(classKey);
  useEffect(() => {
    setNotes(query.data);
    setNotesKey(classKey);
  }, [query.data, classKey]);
  const shown = notesKey === classKey ? notes : null;

  useEffect(() => {
    if (!visible) return;
    setNoteText('');
    setSaveError(null);
    setDeleteErrorId(null);
    setUnavailableOnSave(false);
  }, [visible, classKey]);

  const loadStatus = query.error ? httpStatusOf(query.error) : undefined;
  const unavailable = unavailableOnSave || loadStatus === 404;
  // Read-only: offline, or the class can't take notes. Notes already on the phone still show.
  const canWrite = isOnline && !unavailable;

  const handleSave = useCallback(async () => {
    Keyboard.dismiss();
    const trimmed = noteText.trim();
    if (!trimmed || subjectCode == null || dayOfWeek == null || !studentId || saving || !isOnline) return;
    if ([...trimmed].length > NOTE_MAX) {
      setSaveError('too_long');
      return;
    }
    setSaving(true);
    setSaveError(null);
    try {
      const created = await createCourseNote({ subjectCode, dayOfWeek, body: trimmed });
      // Confirmed by the server: now the local copy and the screen.
      try {
        await putServerNote(await getCourseNotesDb(), studentId, created);
      } catch {
        // The local copy catches up at the next read; the note is safe on the server.
      }
      setNotes((prev) => [fromServer(created), ...(prev ?? [])]);
      setNoteText('');
    } catch (err) {
      const status = httpStatusOf(err);
      if (status === 404) setUnavailableOnSave(true);
      else setSaveError(status === 429 ? 'rate_limited' : 'save_error'); // the text stays in the field
    } finally {
      setSaving(false);
    }
  }, [noteText, subjectCode, dayOfWeek, studentId, saving, isOnline]);

  const handleDelete = useCallback(async (n: LocalNote) => {
    Keyboard.dismiss();
    if (deletingId) return;
    setDeleteErrorId(null);
    setDeletingId(n.localId);
    try {
      if (n.serverId) {
        if (!isOnline) return;
        try {
          await deleteCourseNoteOnServer(n.serverId);
        } catch (err) {
          // 404: already gone (deleted on the PWA, say), which is what was asked.
          if (httpStatusOf(err) !== 404) {
            setDeleteErrorId(n.localId);
            return;
          }
        }
      }
      // A note not on the server (not uploaded yet, or kept on this phone) is deleted here only.
      try {
        await removeLocalNote(await getCourseNotesDb(), n.localId);
      } catch {
        if (!n.serverId) {
          setDeleteErrorId(n.localId);
          return;
        }
        // Gone from the server; the stale local copy is dropped at the next read.
      }
      setNotes((prev) => (prev ?? []).filter((x) => x.localId !== n.localId));
    } finally {
      setDeletingId(null);
    }
  }, [deletingId, isOnline]);

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

            {unavailable ? (
              <Text style={styles.notesMessage}>{t('schedule.notes.unavailable')}</Text>
            ) : !isOnline ? (
              <View style={styles.offlineBox}>
                <Text style={styles.offlineText}>
                  {shown?.length ? t('schedule.notes.offline') : t('schedule.notes.offline_empty')}
                </Text>
              </View>
            ) : null}

            {canWrite && (
              <>
                <TextInput
                  style={styles.notesInput}
                  multiline
                  value={noteText}
                  onChangeText={(v) => {
                    setNoteText(v);
                    if (saveError) setSaveError(null);
                  }}
                  editable={!saving}
                  placeholder={t('course.notes_placeholder')}
                  placeholderTextColor={colors.textTertiary}
                  textAlignVertical="top"
                />

                {saveError && (
                  <Text style={styles.errorText} accessibilityLiveRegion="polite">
                    {t(`schedule.notes.${saveError}`, { max: NOTE_MAX })}
                  </Text>
                )}

                <PressBox
                  tier="button"
                  style={[styles.saveBtn, saving && styles.saveBtnBusy]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? t('schedule.notes.saving') : t('course.save')}</Text>
                </PressBox>
              </>
            )}

            <View style={styles.notesList}>
              {shown === null && query.isLoading ? (
                <View style={styles.skeletonList}>
                  <SkeletonBox width="100%" height={64} borderRadius={radius.rMd} />
                  <SkeletonBox width="100%" height={64} borderRadius={radius.rMd} />
                </View>
              ) : shown === null && query.error && isOnline && loadStatus !== 404 ? (
                <View style={styles.loadError}>
                  <Text style={styles.notesMessage}>{t('schedule.notes.load_error')}</Text>
                  <PressBox tier="button" style={styles.retryBtn} onPress={() => void query.refetch()}>
                    <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
                  </PressBox>
                </View>
              ) : !shown?.length ? (
                isOnline && !unavailable ? <Text style={styles.notesMessage}>{t('schedule.notes.empty')}</Text> : null
              ) : (
                <>
                  {query.error && isOnline && loadStatus !== 404 && (
                    <View style={styles.loadError}>
                      <Text style={styles.notesMessage}>{t('schedule.notes.load_error')}</Text>
                      <PressBox tier="button" style={styles.retryBtn} onPress={() => void query.refetch()}>
                        <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
                      </PressBox>
                    </View>
                  )}
                  {shown.map((n) => {
                    // Server notes need the server to delete; notes only on this phone don't.
                    const canDelete = !n.serverId || isOnline;
                    return (
                      <View key={n.localId} style={styles.noteCard}>
                        <Text style={styles.noteText}>{n.body}</Text>
                        {n.deviceOnly && (
                          <View style={styles.deviceOnlyPill}>
                            <Text style={styles.deviceOnlyText}>{t('schedule.notes.device_only')}</Text>
                          </View>
                        )}
                        <View style={styles.noteFooter}>
                          <Text style={styles.noteTimestamp}>
                            {formatNoteTimestamp(n.createdAt, i18n.language)}
                          </Text>
                          {canDelete && (
                            <PressBox
                              tier="icon"
                              onPress={() => handleDelete(n)}
                              hitSlop={14}
                              style={styles.noteDeleteBtn}
                              disabled={deletingId !== null}
                              accessibilityLabel={t('schedule.notes.delete_label')}
                            >
                              {deletingId === n.localId
                                ? <Text style={styles.noteTimestamp}>{t('schedule.notes.deleting')}</Text>
                                : <TrashIcon color={colors.textTertiary} />}
                            </PressBox>
                          )}
                        </View>
                        {deleteErrorId === n.localId && (
                          <Text style={styles.errorText}>{t('schedule.notes.delete_error')}</Text>
                        )}
                      </View>
                    );
                  })}
                </>
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
    marginTop: spacing.sp8,
    marginEnd: spacing.sp8,
    flexShrink: 0,
  },
  headerText: {
    flex: 1,
  },
  subject: {
    fontSize: fz(22),
    fontWeight: '800',
    fontFamily: fonts.sans,
    letterSpacing: -0.4,
    color: colors.textPrimary,
  },
  teacher: {
    fontSize: fz(14),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    marginTop: spacing.sp2,
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
    paddingVertical: spacing.sp14,
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  infoRowLast: {
    borderBottomWidth: 0,
  },
  rowLabel: {
    fontSize: fz(14.5),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  rowValue: {
    fontSize: fz(14.5),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  rowValueMono: {
    fontSize: fz(14),
    fontWeight: '500',
    fontFamily: fonts.mono,
    color: colors.textPrimary,
  },

  // ── Notes section
  notesHeader: {
    fontSize: fz(12.5),
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
    fontSize: fz(14.5),
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
  saveBtnBusy: {
    opacity: 0.6,
  },
  saveBtnText: {
    fontSize: fz(15),
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
    fontSize: fz(14),
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
    fontSize: fz(12),
    fontFamily: fonts.mono,
    color: colors.textTertiary,
  },
  notesMessage: {
    fontSize: fz(13.5),
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    paddingHorizontal: spacing.sp20,
    marginBottom: spacing.sp8,
  },
  offlineBox: {
    marginHorizontal: spacing.sp20,
    marginBottom: spacing.sp8,
    padding: spacing.sp12,
    borderRadius: radius.rMd,
    backgroundColor: colors.offlineBg,
  },
  offlineText: {
    fontSize: fz(13.5),
    fontFamily: fonts.sans,
    color: colors.offlineText,
  },
  errorText: {
    fontSize: fz(13),
    fontFamily: fonts.sans,
    color: colors.danger,
    marginHorizontal: spacing.sp20,
    marginTop: spacing.sp8,
  },
  skeletonList: {
    gap: spacing.sp8,
  },
  loadError: {
    alignItems: 'flex-start',
    gap: spacing.sp8,
    marginBottom: spacing.sp12,
  },
  retryBtn: {
    minHeight: sizing.touchTarget,
    paddingHorizontal: spacing.sp16,
    borderRadius: radius.rBtn,
    borderWidth: 1,
    borderColor: colors.hair,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtnText: {
    fontSize: fz(14),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.jade600,
  },
  deviceOnlyPill: {
    alignSelf: 'flex-start',
    marginTop: spacing.sp8,
    paddingHorizontal: spacing.sp8,
    paddingVertical: spacing.sp2,
    borderRadius: radius.rFull,
    backgroundColor: colors.surface2,
  },
  deviceOnlyText: {
    fontSize: fz(11.5),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  noteDeleteBtn: {
    minWidth: sizing.touchTarget,
    minHeight: sizing.touchTarget,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
