import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import type { TFunction } from 'i18next';
import { Ionicons } from '@expo/vector-icons';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import {
  AttendanceHeader,
  AttendanceState,
} from '@/components/attendance/AttendanceHeader';
import { AttendanceCard } from '@/components/attendance/AttendanceCard';
import { AttendanceSkeleton } from '@/components/attendance/AttendanceSkeleton';
import {
  getAttendance as getAttendanceApi,
  AttendanceApiResponse,
  AttendanceSubject,
  Attendance,
} from '@/services/api';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { getAttendance as getCachedAttendance, upsertAttendance } from '@/services/db';
import { mapAttendanceToCache } from '@/services/cacheMappers';
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
  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineBannerText}>{t('attendance.offline.banner')}</Text>
    </View>
  );
}

// ─── Cards body ───────────────────────────────────────────────────────────────

interface CardsBodyProps {
  data: AttendanceApiResponse;
  remainingByCode: Record<string, number>;
}

function CardsBody({ data, remainingByCode }: CardsBodyProps) {
  const { t } = useTranslation();

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

      <Text style={styles.sectionHeader}>{t('attendance.section_justification')}</Text>

      <Pressable
        style={({ pressed }) => [styles.uploadCard, pressed && { backgroundColor: colors.jade400 + '26' }]}
        onPress={() => console.log('[ATTENDANCE] upload justificatif')}
      >
        <Ionicons name="camera-outline" size={22} color={colors.jade600} />
        <Text style={styles.uploadText}>{t('attendance.upload')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Empty body ───────────────────────────────────────────────────────────────

function EmptyBody() {
  const { t } = useTranslation();

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

  const studentId = useAuthStore.getState().student?.id ?? 'me';

  // ─── Offline query ──────────────────────────────────────────────────────────

  const hook = useOfflineQuery<Attendance[]>({
    cacheKey: 'attendance',
    getCached: async () => {
      const cached = await getCachedAttendance();
      return cached.length > 0 ? cached : null;
    },
    fetchFresh: async () => {
      const res = await getAttendanceApi();
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
      })),
    };
  }, [hook.data]);

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AttendanceHeader
          topInset={insets.top}
          onBack={() => router.back()}
          percentage={overall.percentage}
          absences={overall.absent}
          totalSessions={overall.total}
          state={headerState}
        />

        {screenState === 'offline' && <AttendanceOfflineBanner />}

        {screenState === 'skeleton' && <AttendanceSkeleton />}
        {showCards && attendanceData != null && (
          <CardsBody data={attendanceData} remainingByCode={remainingByCode} />
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

const styles = StyleSheet.create({
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
    height: 46,
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
  uploadCard: {
    marginHorizontal: spacing.sp16,
    height: 64,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.jade400,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sp8,
  },
  uploadText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.jade600,
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
    backgroundColor: 'rgba(29,158,117,0.1)',
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
