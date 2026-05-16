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
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { GradesHeader } from '@/components/grades/GradesHeader';
import { SubjectCard, Subject } from '@/components/grades/SubjectCard';
import { GradesSkeleton } from '@/components/grades/GradesSkeleton';
import { GradeCalculatorSheet } from '@/components/grades/GradeCalculatorSheet';
import { GPAHistorySheet } from '@/components/grades/GPAHistorySheet';
import { DevSwitcher } from '@/components/ui/DevSwitcher';

import {
  getGrades,
  getGradesAllSemesters,
  GradesResponse,
  SemesterSummary,
} from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type GradesState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

// ─── Empty state body ─────────────────────────────────────────────────────────

interface EmptyStateProps {
  onRetry: () => void;
  onContact: () => void;
}

function EmptyStateBody({ onRetry, onContact }: EmptyStateProps) {
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
}

function ErrorStateBody({ onRetry }: ErrorStateProps) {
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

function CardsBody({ subjects }: { subjects: Subject[] }) {
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
  const [gradesState, setGradesState] = useState<GradesState>('skeleton');
  const [activeSemester, setActiveSemester] = useState<1 | 2>(2);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [gpaHistoryVisible, setGpaHistoryVisible] = useState(false);
  const [gradesData, setGradesData] = useState<GradesResponse | null>(null);
  const [allSemesterData, setAllSemesterData] = useState<SemesterSummary[]>([]);
  // [s1Id, s2Id] mapped from the current academic year's sorted semesters
  const [semesterTabIds, setSemesterTabIds] = useState<[string | null, string | null]>([null, null]);
  const insets = useSafeAreaInsets();

  // Derived: Subject[] for SubjectCard and GradeCalculatorSheet
  const subjects: Subject[] = useMemo(
    () =>
      (gradesData?.grades ?? []).map((g) => ({
        id: g.id,
        name: g.subject.nameFr,
        cc: g.noteCc ?? 0,
        exam: g.noteCf ?? 0,
        coef: g.subject.coefficient,
        finale: g.noteFinale ?? 0,
      })),
    [gradesData],
  );

  // Derived: chart data for GPAHistorySheet
  const gpaChartData = useMemo(
    () =>
      allSemesterData
        .filter((s) => s.gpa !== null)
        .map((s) => ({ label: s.label, value: s.gpa as number })),
    [allSemesterData],
  );

  // Fetch a single semester's grades and transition state
  const fetchGrades = useCallback(async (semesterId?: string) => {
    setGradesState('skeleton');
    try {
      const data = await getGrades(semesterId);
      setGradesData(data);
      setGradesState(data.grades.length === 0 ? 'empty' : 'loaded');
    } catch (err) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) setGradesState('session');
        else if (!err.response) setGradesState('offline');
        else setGradesState('error');
      } else {
        setGradesState('error');
      }
    }
  }, []);

  // On mount: fetch current semester grades + all semesters in parallel
  useEffect(() => {
    let cancelled = false;

    async function init() {
      setGradesState('skeleton');
      try {
        const [gradesRes, allSemRes] = await Promise.all([
          getGrades(),
          // If allSemesters fails, degrade gracefully — don't block the grades display
          getGradesAllSemesters().catch(() => ({ semesters: [] as SemesterSummary[] })),
        ]);

        if (cancelled) return;

        setGradesData(gradesRes);
        setAllSemesterData(allSemRes.semesters);

        // Map sorted semesters for the current academic year to S1/S2 tabs
        const yearSems = allSemRes.semesters
          .filter((s) => s.academicYear === gradesRes.semester.academicYear)
          .sort((a, b) => a.label.localeCompare(b.label));

        setSemesterTabIds([yearSems[0]?.id ?? null, yearSems[1]?.id ?? null]);

        // Set the active tab to the tab that matches the current semester
        const currentIdx = yearSems.findIndex((s) => s.id === gradesRes.semester.id);
        setActiveSemester(currentIdx === 1 ? 2 : 1);

        setGradesState(gradesRes.grades.length === 0 ? 'empty' : 'loaded');
      } catch (err) {
        if (cancelled) return;
        if (isAxiosError(err)) {
          if (err.response?.status === 401) setGradesState('session');
          else if (!err.response) setGradesState('offline');
          else setGradesState('error');
        } else {
          setGradesState('error');
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, []);

  // Semester tab switch: re-fetch the selected semester by UUID
  const handleSemesterChange = useCallback(
    (s: 1 | 2) => {
      setActiveSemester(s);
      const semId = semesterTabIds[s - 1];
      if (semId) fetchGrades(semId);
    },
    [semesterTabIds, fetchGrades],
  );

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

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Green top bar */}
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

        {/* Body content */}
        {gradesState === 'skeleton' && <GradesSkeleton />}

        {(gradesState === 'loaded' || gradesState === 'session') && (
          <CardsBody subjects={subjects} />
        )}

        {gradesState === 'offline' && <CardsBody subjects={subjects} />}

        {gradesState === 'empty' && (
          <EmptyStateBody
            onRetry={() => fetchGrades()}
            onContact={() => console.log('[GRADES] contact triggered')}
          />
        )}

        {gradesState === 'error' && (
          <ErrorStateBody
            onRetry={() => fetchGrades()}
          />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <SessionExpiredModal
        visible={gradesState === 'session'}
        onContinueOffline={() => setGradesState('offline')}
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
        onChange={setGradesState}
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
