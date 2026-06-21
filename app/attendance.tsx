import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, radius, sizing, spacing, withAlpha, HEADER_PAD, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { PressBox } from '@/components/PressBox';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { AttendanceHeroCard } from '@/components/attendance/AttendanceHeroCard';
import { AttendanceCard } from '@/components/attendance/AttendanceCard';
import { AttendanceSkeleton } from '@/components/attendance/AttendanceSkeleton';
import { AbsenceSection } from '@/components/attendance/AbsenceSection';
import { JustifySheet } from '@/components/attendance/JustifySheet';
import type { AbsenceRecord as AbsenceItem } from '@/components/attendance/AbsenceRow';
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
import { useAuthStore } from '@/stores/authStore';
import { localName } from '@/utils/i18nName';

// ─── State type ───────────────────────────────────────────────────────────────

type AttendanceState = 'skeleton' | 'loaded' | 'empty' | 'error' | 'offline' | 'session';

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

interface CardsBodyProps {
  data: AttendanceApiResponse;
  onRefresh: () => void;
}

function CardsBody({ data, onRefresh }: CardsBodyProps) {
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [selectedRecord, setSelectedRecord] = useState<AbsenceItem | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Flatten the per-subject absence groups into a single list. Backend only
  // returns ABSENT / JUSTIFIED entries (never PRESENT); map them to the
  // AbsenceSection record shape and sort most-recent first.
  const absenceRecords = useMemo<AbsenceItem[]>(() => {
    const out: AbsenceItem[] = [];
    for (const subject of data.subjects) {
      for (const a of subject.absences) {
        out.push({
          id: a.id,
          status: 'ABSENT',
          sessionDate: a.date,
          subjectName: a.subjectName ?? subject.subject.nameFr,
          subjectNameAr: a.subjectNameAr ?? subject.subject.nameAr,
          justificationStatus: a.justificationStatus,
          justificationUrl: a.justificationUrl,
          justificationNote: a.justificationNote,
        });
      }
    }
    out.sort(
      (x, y) => new Date(y.sessionDate).getTime() - new Date(x.sessionDate).getTime(),
    );
    return out;
  }, [data.subjects]);

  const handleRecordPress = useCallback((record: AbsenceItem) => {
    setSelectedRecord(record);
    setSheetVisible(true);
  }, []);

  const handleSheetClose = useCallback(() => {
    setSheetVisible(false);
  }, []);

  const handleJustifySubmit = useCallback(
    async (recordId: string, imageUri: string, mimeType: string, note?: string) => {
      await uploadJustification(recordId, imageUri, mimeType, note);
      Alert.alert(t('attendance.upload_success'));
      setSheetVisible(false);
      onRefresh();
    },
    [t, onRefresh],
  );

  return (
    <View style={styles.cardsBody}>
      <Text style={styles.subjectSectionLabel}>{t('presence.section_subjects')}</Text>

      <View style={styles.cardsList}>
        {data.subjects.map((subject, index) => (
          <AttendanceCard
            key={`${subject.subject.code}-${index}`}
            name={localName(subject.subject, lang)}
            percentage={subject.percentage}
            attended={subject.present}
            total={subject.total}
          />
        ))}
      </View>

      {/* ── Absences + per-record justification ────────────────────────────── */}
      <AbsenceSection records={absenceRecords} onRecordPress={handleRecordPress} />

      <JustifySheet
        visible={sheetVisible}
        record={selectedRecord}
        onClose={handleSheetClose}
        onSubmit={handleJustifySubmit}
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
      <PressBox tier="button" style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('attendance.error.retry')}</Text>
      </PressBox>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AttendanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [devState, setDevState] = useState<AttendanceState | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const { colors, isDark } = useColors();
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
          nameAr: a.subjectNameAr ?? a.subjectName,
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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await hook.refetch();
    setRefreshing(false);
  }, [hook]);

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

  const showCards =
    screenState === 'loaded' ||
    screenState === 'offline' ||
    screenState === 'session';

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <View style={[styles.compactHeader, { paddingTop: insets.top + HEADER_PAD }]}>
        <PressBox
          tier="icon"
          style={styles.backCircle}
          onPress={() => router.back()}
          hitSlop={8}
        >
          <Ionicons name="chevron-back" size={24} color={colors.jade400} />
        </PressBox>
        <Text style={styles.screenTitle}>{t('attendance.title')}</Text>
      </View>

      {screenState === 'offline' && <AttendanceOfflineBanner />}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          screenState !== 'skeleton' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.jade400}
              colors={[colors.jade400]}
              progressBackgroundColor={colors.surface}
            />
          ) : undefined
        }
      >
        {(screenState === 'skeleton' || showCards) && (
          <AttendanceHeroCard
            percentage={overall.percentage}
            absences={overall.absent}
            totalSessions={overall.total}
            skeleton={screenState === 'skeleton'}
          />
        )}
        {screenState === 'skeleton' && <AttendanceSkeleton />}
        {showCards && attendanceData != null && (
          <CardsBody data={attendanceData} onRefresh={() => hook.refetch()} />
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
  compactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp8,
    paddingBottom: spacing.sp8,
    backgroundColor: colors.background,
    gap: spacing.sp8,
  },
  backCircle: {
    width: sizing.touchTarget,
    height: sizing.touchTarget,
    borderRadius: radius.rFull,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  screenTitle: {
    fontSize: fz(20),
    fontWeight: '800',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
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
    fontSize: fz(13),
    fontFamily: fonts.sans,
    color: colors.danger,
  },

  // ── Cards body
  cardsBody: {
    paddingTop: spacing.sp16,
  },
  subjectSectionLabel: {
    fontSize: fz(12.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: spacing.sp8,
    marginHorizontal: spacing.sp20,
  },
  cardsList: {
    gap: spacing.sp8,
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
    fontSize: fz(14),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp24,
  },
  stateBody: {
    fontSize: fz(14),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: fz(22),
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
    fontSize: fz(15),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
