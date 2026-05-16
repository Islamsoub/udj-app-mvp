import React, { useState, useEffect } from 'react';
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
import { isAxiosError } from 'axios';
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
  getAttendance,
  AttendanceApiResponse,
  AttendanceSubject,
} from '@/services/api';

// ─── Projection helper ────────────────────────────────────────────────────────

function computeProjection(
  subject: AttendanceSubject,
  t: TFunction,
): string {
  const threshold = 0.75;
  const remaining = subject.remaining ?? 0;
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
}

function CardsBody({ data }: CardsBodyProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.cardsBody}>
      <Text style={styles.sectionHeader}>{t('attendance.section_subjects')}</Text>

      {data.subjects.map((subject) => (
        <AttendanceCard
          key={subject.subjectCode}
          name={subject.nameFr}
          percentage={subject.percentage}
          attended={subject.present}
          total={subject.total}
          projection={computeProjection(subject, t)}
        />
      ))}

      <Text style={styles.sectionHeader}>{t('attendance.section_justification')}</Text>

      <Pressable
        style={styles.uploadCard}
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
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('attendance.error.retry')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function AttendanceScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [screenState, setScreenState] = useState<AttendanceState>('skeleton');
  const [attendanceData, setAttendanceData] = useState<AttendanceApiResponse | null>(null);

  useEffect(() => {
    let cancelled = false;

    setScreenState('skeleton');

    getAttendance()
      .then((data) => {
        if (cancelled) return;
        setAttendanceData(data);
        setScreenState(data.subjects.length === 0 ? 'empty' : 'loaded');
      })
      .catch((err) => {
        if (cancelled) return;
        if (isAxiosError(err)) {
          if (err.response?.status === 401) setScreenState('session');
          else if (!err.response) setScreenState('offline');
          else setScreenState('error');
        } else {
          setScreenState('error');
        }
      });

    return () => { cancelled = true; };
  }, []);

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
        {showCards && attendanceData != null && <CardsBody data={attendanceData} />}
        {screenState === 'empty' && <EmptyBody />}
        {screenState === 'error' && (
          <ErrorBody onRetry={() => {
            setScreenState('skeleton');
            getAttendance()
              .then((data) => {
                setAttendanceData(data);
                setScreenState(data.subjects.length === 0 ? 'empty' : 'loaded');
              })
              .catch(() => setScreenState('error'));
          }} />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <SessionExpiredModal
        visible={screenState === 'session'}
        onContinueOffline={() => setScreenState('offline')}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={screenState}
        onChange={setScreenState}
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
