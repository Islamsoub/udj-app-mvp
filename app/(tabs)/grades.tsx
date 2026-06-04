import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { isAxiosError } from 'axios';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { GradesHeader } from '@/components/grades/GradesHeader';
import { SubjectCard, Subject } from '@/components/grades/SubjectCard';
import { GradesSkeleton } from '@/components/grades/GradesSkeleton';
import { GradeCalculatorSheet } from '@/components/grades/GradeCalculatorSheet';
import { GPAHistorySheet, GPADataPoint } from '@/components/grades/GPAHistorySheet';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { getAllCachedGrades, getGradesForSemester, upsertGrades } from '@/services/db';
import { mapGradesToCache } from '@/services/cacheMappers';
import { useAuthStore } from '@/stores/authStore';
import { localName } from '@/utils/i18nName';

import {
  getGrades,
  getGradesAllSemesters,
  GradesResponse,
  SemesterSummary,
  Grade,
} from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type GradesState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

// ─── Empty state body ─────────────────────────────────────────────────────────

interface EmptyStateProps {
  onRetry: () => void;
  onContact: () => void;
  styles: ReturnType<typeof makeStyles>;
}

function EmptyStateBody({ onRetry, onContact, styles }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.centerBody, { paddingTop: 40 }]}>
      <Image
        source={require('../../assets/icons/Hourglass.png')}
        style={{ width: 76, height: 76 }}
        resizeMode="contain"
      />
      <Text style={styles.stateTitle}>{t('grades.empty.title')}</Text>
      <Text style={styles.stateBody}>{t('grades.empty.body')}</Text>
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('grades.empty.retry')}</Text>
      </Pressable>
      <Pressable onPress={onContact} hitSlop={8} style={{ marginTop: spacing.sp16 }}>
        <Text style={styles.contactLink}>{t('grades.empty.contact')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Error state body ─────────────────────────────────────────────────────────

interface ErrorStateProps {
  onRetry: () => void;
  styles: ReturnType<typeof makeStyles>;
}

function ErrorStateBody({ onRetry, styles }: ErrorStateProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.centerBody, { paddingTop: 40 }]}>
      <View style={styles.errorIconCircle}>
        <Image
          source={require('../../assets/icons/calendar-error.png')}
          style={{ width: 48, height: 48 }}
          resizeMode="contain"
        />
      </View>
      <Text style={styles.stateTitle}>{t('grades.error.title')}</Text>
      <Text style={styles.stateBody}>{t('grades.error.body')}</Text>

      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('grades.empty.retry')}</Text>
      </Pressable>

      {/* Notification banner */}
      <View style={styles.notifBanner}>
        <Text style={styles.notifTitle}>{t('grades.error.notification_title')}</Text>
        <Text style={styles.notifBody}>{t('grades.error.notification_body')}</Text>
      </View>
    </View>
  );
}

// ─── Loaded / Offline cards body ──────────────────────────────────────────────

function CardsBody({ subjects, styles }: { subjects: Subject[]; styles: ReturnType<typeof makeStyles> }) {
  return (
    <View style={styles.cardsBody}>
      {subjects.map((subject) => (
        <SubjectCard key={subject.id} subject={subject} />
      ))}
    </View>
  );
}

// ─── DEV switcher ─────────────────────────────────────────────────────────────

const ALL_STATES: GradesState[] = ['skeleton', 'loaded', 'offline', 'empty', 'error', 'session'];
const STATE_LABELS: Record<GradesState, string> = {
  skeleton: 'loading',
  loaded:   'loaded',
  offline:  'offline',
  empty:    'empty',
  error:    'error',
  session:  'session',
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function GradesScreen() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [devState, setDevState] = useState<GradesState | null>(null);
  const [activeSemester, setActiveSemester] = useState<1 | 2>(2);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [gpaHistoryVisible, setGpaHistoryVisible] = useState(false);
  const [gradesData, setGradesData] = useState<GradesResponse | null>(null);
  const [allSemesterData, setAllSemesterData] = useState<SemesterSummary[]>([]);
  const [semesterTabIds, setSemesterTabIds] = useState<[string | null, string | null]>([null, null]);
  const [activeSemesterId, setActiveSemesterId] = useState<string | undefined>(undefined);
  const insets = useSafeAreaInsets();

  const studentId = useAuthStore.getState().student?.id ?? 'me';

  // ─── Offline query for current semester grades ──────────────────────────────

  const hook = useOfflineQuery<Grade[]>({
    cacheKey: `grades-${activeSemesterId ?? 'current'}`,
    getCached: async () => {
      if (activeSemesterId) return getGradesForSemester(activeSemesterId);
      const all = await getAllCachedGrades();
      return all.length > 0 ? all : null;
    },
    fetchFresh: async () => {
      const res = await getGrades(activeSemesterId);
      setGradesData(res);

      // On first load, also fetch all semesters summary
      if (!activeSemesterId) {
        getGradesAllSemesters()
          .catch(() => ({ semesters: [] as SemesterSummary[] }))
          .then((allSemRes) => {
            setAllSemesterData(allSemRes.semesters);
            const yearSems = allSemRes.semesters
              .filter((s) => s.academicYear === res.semester.academicYear)
              .sort((a, b) => a.label.localeCompare(b.label));
            setSemesterTabIds([yearSems[0]?.id ?? null, yearSems[1]?.id ?? null]);
            const currentIdx = yearSems.findIndex((s) => s.id === res.semester.id);
            setActiveSemester(currentIdx === 1 ? 2 : 1);
          });
      }

      return mapGradesToCache(res.grades, studentId, res.semester.id);
    },
    updateCache: (data) => upsertGrades(data),
  });

  // ─── Derive subjects from cached Grade[] ────────────────────────────────────

  const subjects: Subject[] = useMemo(
    () =>
      (hook.data ?? []).map((g) => ({
        id: g.id,
        name: localName({ nameFr: g.subjectName, nameAr: g.subjectNameAr }, lang),
        cc: g.ccScore ?? 0,
        exam: g.examScore ?? 0,
        coef: g.coefficient,
        finale: g.finalScore ?? 0,
      })),
    [hook.data, lang],
  );

  const gpaChartData = useMemo<GPADataPoint[]>(() => {
    let real: GPADataPoint[] = allSemesterData
      .filter((s) => s.gpa !== null)
      .map((s) => ({ label: s.label, value: s.gpa as number }));

    if (real.length === 0 && gradesData?.gpa != null) {
      real = [{ label: gradesData.semester.label, value: gradesData.gpa }];
    }

    if (real.length !== 1) return real;

    const currentGpa = real[0].value;
    const clamp = (v: number) => Math.max(0, Math.min(20, v));
    return [
      { label: '—', value: clamp(currentGpa - 0.8), isEstimate: true },
      { label: '—', value: clamp(currentGpa - 0.3), isEstimate: true },
      real[0],
    ];
  }, [allSemesterData, gradesData]);

  // ─── Semester tab switch ────────────────────────────────────────────────────

  const handleSemesterChange = useCallback(
    (s: 1 | 2) => {
      setActiveSemester(s);
      const semId = semesterTabIds[s - 1];
      if (semId) {
        setActiveSemesterId(semId);
        hook.refetch();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [semesterTabIds],
  );

  // ─── Derive screen state ────────────────────────────────────────────────────

  const hookState: GradesState = useMemo(() => {
    if (hook.isLoading && !hook.data) return 'skeleton';
    if (hook.isOffline && hook.data) return 'offline';
    if (hook.data) return hook.data.length === 0 && !hook.isStale ? 'empty' : 'loaded';
    if (hook.error) return 'error';
    return 'skeleton';
  }, [hook.isLoading, hook.data, hook.isOffline, hook.error, hook.isStale]);

  const gradesState = devState ?? hookState;

  const headerGpa =
    gradesState === 'loaded' || gradesState === 'offline' || gradesState === 'session'
      ? (gradesData?.gpa ?? null)
      : null;

  const headerCredits =
    gradesState === 'loaded' || gradesState === 'offline'
      ? (gradesData?.credits ?? null)
      : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <GradesHeader
        state={gradesState === 'session' ? 'loaded' : gradesState}
        topInset={insets.top}
        gpa={headerGpa}
        activeSemester={activeSemester}
        onSemesterChange={handleSemesterChange}
        credits={headerCredits}
        onCalculatorPress={() => setCalculatorVisible(true)}
        onGpaPress={() => setGpaHistoryVisible(true)}
      />

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {gradesState === 'skeleton' && <GradesSkeleton />}

        {(gradesState === 'loaded' || gradesState === 'session' || gradesState === 'offline') && (
          <CardsBody subjects={subjects} styles={styles} />
        )}

        {gradesState === 'empty' && (
          <EmptyStateBody
            onRetry={() => hook.refetch()}
            onContact={() => {}}
            styles={styles}
          />
        )}

        {gradesState === 'error' && (
          <ErrorStateBody onRetry={() => hook.refetch()} styles={styles} />
        )}

        <View style={{ height: 56 + insets.bottom }} />
      </ScrollView>

      <SessionExpiredModal
        visible={gradesState === 'session'}
        onContinueOffline={() => setDevState('offline')}
      />

      <GradeCalculatorSheet
        visible={calculatorVisible}
        onClose={() => setCalculatorVisible(false)}
        subjects={subjects}
      />

      <GPAHistorySheet
        visible={gpaHistoryVisible}
        onClose={() => setGpaHistoryVisible(false)}
        gpaData={gpaChartData}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={gradesState}
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

  // ── Cards body
  cardsBody: {
    paddingTop: spacing.sp16,
    gap: 24,
  },

  // ── Center states (empty / error)
  centerBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
  },
  stateTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp16,
  },
  stateBody: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 245,
    lineHeight: 22,
    marginTop: spacing.sp8,
  },

  // ── Shared retry button (empty + error)
  retryBtn: {
    width: 168,
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
    alignSelf: 'center',
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },

  // ── Empty contact link
  contactLink: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.jade600,
    textAlign: 'center',
  },

  // ── Error icon circle
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Error notification banner
  notifBanner: {
    marginTop: spacing.sp24,
    marginHorizontal: spacing.sp16,
    minHeight: 64,
    borderRadius: radius.rMd,
    backgroundColor: colors.jade50,
    borderWidth: 1,
    borderColor: colors.jade400,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp12,
    alignItems: 'flex-start',
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.jade600,
  },
  notifBody: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.jade600,
    marginTop: spacing.sp4,
  },

});
