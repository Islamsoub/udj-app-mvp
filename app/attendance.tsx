import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { fonts, radius, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import {
  AttendanceHeader,
  AttendanceState,
} from '@/components/attendance/AttendanceHeader';
import { AttendanceCard } from '@/components/attendance/AttendanceCard';
import { AttendanceSkeleton } from '@/components/attendance/AttendanceSkeleton';
import { JustificationConfirmSheet } from '@/components/attendance/JustificationConfirmSheet';
import {
  getAttendance as getAttendanceApi,
  AttendanceApiResponse,
  AttendanceSubject,
  AbsenceRecord,
  Attendance,
  uploadJustification,
} from '@/services/api';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { getAttendance as getCachedAttendance, upsertAttendance } from '@/services/db';
import { mapAttendanceToCache } from '@/services/cacheMappers';
import { formatAbsenceDate } from '@/utils/dateFormat';
import { useAuthStore } from '@/stores/authStore';

// ─── Projection helper ────────────────────────────────────────────────────────

function computeProjection(
  subject: AttendanceSubject,
  remaining: number,
  t: TFunction,
): string {
  const threshold = 0.75;
  const totalWithRemaining = subject.total + remaining;
  const minRequired = Math.ceil(totalWithRemaining * threshold);
  const canMiss = remaining - Math.max(0, minRequired - subject.present);

  if (subject.percentage === 100 && remaining === 0) {
    return t('attendance.projection_perfect');
  }
  if (subject.percentage < 75 || canMiss <= 0) {
    return t('attendance.projection_critical');
  }
  if (subject.percentage >= 85) {
    return t('attendance.projection_safe', { count: canMiss });
  }
  return t('attendance.projection_warning', { count: canMiss });
}

// ─── DEV switcher ─────────────────────────────────────────────────────────────

const ALL_STATES: AttendanceState[] = [
  'skeleton',
  'loaded',
  'offline',
  'empty',
  'error',
  'session',
];

const STATE_LABELS: Record<AttendanceState, string> = {
  skeleton: 'loading',
  loaded:   'loaded',
  offline:  'offline',
  empty:    'empty',
  error:    'error',
  session:  'session',
};

// ─── Inline offline banner ────────────────────────────────────────────────────

function AttendanceOfflineBanner() {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineBannerText}>{t('attendance.offline.banner')}</Text>
    </View>
  );
}

// ─── Cards body ───────────────────────────────────────────────────────────────

// ─── Image picker helper ──────────────────────────────────────────────────────

async function pickImage(
  source: 'camera' | 'gallery',
  t: TFunction,
): Promise<{ uri: string; mimeType: string } | null> {
  if (source === 'camera') {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('attendance.camera_denied'));
      return null;
    }
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: 'images',
          quality: 0.7,
          allowsEditing: true,
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: 'images',
          quality: 0.7,
          allowsEditing: true,
        });

  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  return { uri: asset.uri, mimeType: asset.mimeType || 'image/jpeg' };
}

interface ConfirmData {
  recordId: string;
  imageUri: string;
  mimeType: string;
  subjectName: string;
  absenceDate: string;
}

function showPickerAlert(
  recordId: string,
  subjectName: string,
  absenceDate: string,
  t: TFunction,
  onImageSelected: (data: ConfirmData) => void,
): void {
  Alert.alert(
    t('attendance.section_justification'),
    undefined,
    [
      {
        text: t('attendance.upload_camera'),
        onPress: async () => {
          const img = await pickImage('camera', t);
          if (img) onImageSelected({ recordId, imageUri: img.uri, mimeType: img.mimeType, subjectName, absenceDate });
        },
      },
      {
        text: t('attendance.upload_gallery'),
        onPress: async () => {
          const img = await pickImage('gallery', t);
          if (img) onImageSelected({ recordId, imageUri: img.uri, mimeType: img.mimeType, subjectName, absenceDate });
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ],
  );
}

// ─── Status pill ──────────────────────────────────────────────────────────────

function StatusPill({
  status,
  colors,
  t,
}: {
  status: AbsenceRecord['justificationStatus'] | 'ABSENT';
  colors: Palette;
  t: TFunction;
}) {
  const styles = useMemo(() => makeStyles(colors), [colors]);

  let bg: string;
  let fg: string;
  let label: string;

  switch (status) {
    case 'PENDING':
      bg = colors.warningLight;
      fg = colors.warning;
      label = t('attendance.status_pending');
      break;
    case 'APPROVED':
      bg = colors.jade50;
      fg = colors.jade400;
      label = t('attendance.status_approved');
      break;
    case 'REJECTED':
      bg = colors.dangerLight;
      fg = colors.danger;
      label = t('attendance.status_rejected');
      break;
    default:
      bg = colors.dangerLight;
      fg = colors.danger;
      label = 'ABSENT';
      break;
  }

  return (
    <View style={[styles.statusPill, { backgroundColor: bg }]}>
      <Text style={[styles.statusPillText, { color: fg }]}>{label}</Text>
    </View>
  );
}

// ─── Cards body ───────────────────────────────────────────────────────────────

interface CardsBodyProps {
  data: AttendanceApiResponse;
  remainingByCode: Record<string, number>;
  onRefresh: () => void;
}

function CardsBody({ data, remainingByCode, onRefresh }: CardsBodyProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [confirmData, setConfirmData] = useState<ConfirmData | null>(null);

  const handleUploadPress = useCallback(
    (recordId: string, subjectName: string, absenceDate: string) => {
      showPickerAlert(recordId, subjectName, absenceDate, t, setConfirmData);
    },
    [t],
  );

  const handleConfirmUpload = useCallback(async () => {
    if (!confirmData) return;
    await uploadJustification(confirmData.recordId, confirmData.imageUri, confirmData.mimeType);
    setConfirmData(null);
    Alert.alert(t('attendance.upload_success'));
    onRefresh();
  }, [confirmData, t, onRefresh]);

  // Subjects below 85% that have absence records
  const atRiskSubjects = useMemo(
    () =>
      data.subjects.filter(
        (s) => s.percentage < 85 && s.absences && s.absences.length > 0,
      ),
    [data.subjects],
  );

  return (
    <View style={styles.cardsBody}>
      <Text style={styles.sectionHeader}>{t('attendance.section_subjects')}</Text>

      {data.subjects.map((subject) => (
        <AttendanceCard
          key={subject.subject.code}
          name={subject.subject.nameFr}
          percentage={subject.percentage}
          attended={subject.present}
          total={subject.total}
          projection={computeProjection(subject, remainingByCode[subject.subject.code] ?? 0, t)}
        />
      ))}

      {/* ── Unjustified absences list ─────────────────────────────────────── */}
      {atRiskSubjects.length > 0 && (
        <>
          <Text style={[styles.sectionHeader, { marginTop: spacing.sp16 }]}>
            {t('attendance.unjustified_absences')}
          </Text>

          {atRiskSubjects.map((subject) => (
            <View key={subject.subject.code} style={styles.absenceSection}>
              <Text style={styles.absenceSubjectName}>
                {subject.subject.nameFr}
              </Text>

              {subject.absences.map((record) => {
                const effectiveStatus: AbsenceRecord['justificationStatus'] | 'ABSENT' =
                  record.justificationStatus ?? 'ABSENT';

                return (
                  <View key={record.id} style={styles.absenceRow}>
                    <Text style={styles.absenceDate}>
                      {formatAbsenceDate(new Date(record.date))}
                    </Text>

                    <StatusPill status={effectiveStatus} colors={colors} t={t} />

                    {effectiveStatus === 'ABSENT' && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.justifyBtn,
                          pressed && { backgroundColor: colors.jade600 },
                        ]}
                        onPress={() => handleUploadPress(record.id, subject.subject.nameFr, record.date)}
                        hitSlop={8}
                      >
                        <Text style={styles.justifyBtnText}>
                          {t('attendance.justify')}
                        </Text>
                      </Pressable>
                    )}

                    {effectiveStatus === 'REJECTED' && (
                      <Pressable
                        style={({ pressed }) => [
                          styles.justifyBtn,
                          { backgroundColor: colors.danger },
                          pressed && { backgroundColor: '#DC2626' },
                        ]}
                        onPress={() => handleUploadPress(record.id, subject.subject.nameFr, record.date)}
                        hitSlop={8}
                      >
                        <Text style={styles.justifyBtnText}>
                          {t('attendance.justify')}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </View>
          ))}
        </>
      )}

      <JustificationConfirmSheet
        visible={confirmData !== null}
        onClose={() => setConfirmData(null)}
        onConfirm={handleConfirmUpload}
        imageUri={confirmData?.imageUri ?? ''}
        subjectName={confirmData?.subjectName ?? ''}
        absenceDate={confirmData?.absenceDate ?? ''}
      />
    </View>
  );
}

// ─── Empty body ───────────────────────────────────────────────────────────────

function EmptyBody() {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.centerBody}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="bar-chart-outline" size={32} color={colors.jade400} />
      </View>
      <Text style={styles.stateTitle}>{t('attendance.empty.title')}</Text>
      <Text style={styles.stateBody}>{t('attendance.empty.body')}</Text>
    </View>
  );
}

// ─── Error body ───────────────────────────────────────────────────────────────

function ErrorBody({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <View style={styles.centerBody}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="warning-outline" size={32} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>{t('attendance.error.title')}</Text>
      <Text style={styles.stateBody}>{t('attendance.error.body')}</Text>
      <Pressable style={({ pressed }) => [styles.retryBtn, pressed && { backgroundColor: colors.jade600 }]} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('attendance.error.retry')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AttendanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [devState, setDevState] = useState<AttendanceState | null>(null);
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const studentId = useAuthStore.getState().student?.id ?? 'me';

  // Fresh API absences (not stored in SQLite cache)
  const [freshAbsences, setFreshAbsences] = useState<Record<string, AbsenceRecord[]>>({});

  // ─── Offline query ──────────────────────────────────────────────────────────

  const hook = useOfflineQuery<Attendance[]>({
    cacheKey: 'attendance',
    getCached: async () => {
      const cached = await getCachedAttendance();
      return cached.length > 0 ? cached : null;
    },
    fetchFresh: async () => {
      const res = await getAttendanceApi();
      // Capture absences from the API response (not cacheable in SQLite)
      const absMap: Record<string, AbsenceRecord[]> = {};
      for (const s of res.subjects) {
        if (s.absences && s.absences.length > 0) {
          absMap[s.subject.code] = s.absences;
        }
      }
      setFreshAbsences(absMap);
      return mapAttendanceToCache(res.subjects, studentId);
    },
    updateCache: (data) => upsertAttendance(data),
  });

  // ─── Reconstruct AttendanceApiResponse from cached Attendance[] ─────────────

  const attendanceData: AttendanceApiResponse | null = useMemo(() => {
    const items = hook.data;
    if (!items || items.length === 0) return null;
    const totalPresent = items.reduce((s, a) => s + a.sessionsPresent, 0);
    const totalSessions = items.reduce((s, a) => s + a.sessionsTotal, 0);
    const overallPct = totalSessions > 0 ? Math.round(totalPresent / totalSessions * 100) : 0;
    return {
      overall: {
        percentage: overallPct,
        absent: totalSessions - totalPresent,
        total: totalSessions,
      },
      subjects: items.map((a): AttendanceSubject => ({
        subject: {
          id: a.id,
          nameFr: a.subjectName,
          nameAr: a.subjectName,
          code: a.subjectCode,
        },
        total: a.sessionsTotal,
        present: a.sessionsPresent,
        absent: a.sessionsTotal - a.sessionsPresent,
        justified: 0,
        percentage: a.percentage,
        absences: freshAbsences[a.subjectCode] ?? [],
      })),
    };
  }, [hook.data, freshAbsences]);

  const remainingByCode = useMemo(() => {
    const out: Record<string, number> = {};
    for (const a of hook.data ?? []) {
      out[a.subjectCode] = a.sessionsRemaining;
    }
    return out;
  }, [hook.data]);

  // ─── Derive screen state ────────────────────────────────────────────────────

  const hookState: AttendanceState = useMemo(() => {
    if (hook.isLoading && !hook.data) return 'skeleton';
    if (hook.isOffline && hook.data) return 'offline';
    if (hook.data) return hook.data.length === 0 && !hook.isStale ? 'empty' : 'loaded';
    if (hook.error) return 'error';
    return 'skeleton';
  }, [hook.isLoading, hook.data, hook.isOffline, hook.error, hook.isStale]);

  const screenState = devState ?? hookState;

  const overall = attendanceData?.overall ?? { percentage: 0, absent: 0, total: 0 };
  const headerState = screenState === 'skeleton' ? 'skeleton' : 'loaded';

  const showCards =
    screenState === 'loaded' ||
    screenState === 'offline' ||
    screenState === 'session';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <AttendanceHeader
        topInset={insets.top}
        onBack={() => router.back()}
        percentage={overall.percentage}
        absences={overall.absent}
        totalSessions={overall.total}
        state={headerState}
      />

      {screenState === 'offline' && <AttendanceOfflineBanner />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {screenState === 'skeleton' && <AttendanceSkeleton />}
        {showCards && attendanceData != null && (
          <CardsBody data={attendanceData} remainingByCode={remainingByCode} onRefresh={() => hook.refetch()} />
        )}
        {screenState === 'empty' && <EmptyBody />}
        {screenState === 'error' && (
          <ErrorBody onRetry={() => hook.refetch()} />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <SessionExpiredModal
        visible={screenState === 'session'}
        onContinueOffline={() => setDevState('offline')}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={screenState}
        onChange={(s) => setDevState(s)}
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const makeStyles = (colors: Palette) => StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Inline offline banner
  offlineBanner: {
    height: spacing.sp48,
    backgroundColor: colors.newsOfflineBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.offline,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp16,
  },
  offlineBannerText: {
    fontSize: 13,
    fontFamily: fonts.sans,
    color: colors.danger,
  },

  // ── Cards body
  cardsBody: {
    paddingTop: spacing.sp16,
  },
  sectionHeader: {
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
    backgroundColor: colors.background,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  // ── Absence list
  absenceSection: {
    paddingHorizontal: spacing.sp16,
    marginBottom: spacing.sp16,
  },
  absenceSubjectName: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    marginBottom: spacing.sp8,
  },
  absenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.rMd,
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
    marginBottom: spacing.sp8,
    gap: spacing.sp12,
  },
  absenceDate: {
    flex: 1,
    fontSize: 13,
    fontFamily: fonts.mono,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  statusPill: {
    paddingHorizontal: spacing.sp8,
    paddingVertical: spacing.sp4,
    borderRadius: radius.rFull,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '600',
    fontFamily: fonts.sans,
  },
  justifyBtn: {
    minWidth: 80,
    height: 32,
    borderRadius: radius.rSm,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp12,
  },
  justifyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },

  // ── Center states (empty / error)
  centerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: withAlpha(colors.jade400, 0.1),
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp24,
  },
  stateBody: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 22,
    marginTop: spacing.sp8,
  },
  retryBtn: {
    width: 168,
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
