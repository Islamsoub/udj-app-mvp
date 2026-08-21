import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { PressBox } from '@/components/PressBox';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, radius, spacing, elevation, HEADER_PAD, fz, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { GpaHeroCard } from '@/components/grades/GpaHeroCard';
import { SubjectCard, Subject } from '@/components/grades/SubjectCard';
import { GradesSkeleton } from '@/components/grades/GradesSkeleton';
import { GradeCalculatorSheet } from '@/components/grades/GradeCalculatorSheet';
import { GPAHistorySheet, GPADataPoint } from '@/components/grades/GPAHistorySheet';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import {
  getAllCachedGrades,
  getGradesForSemester,
  getGradesSummary,
  upsertGrades,
  upsertGradesSummary,
} from '@/services/db';
import { mapGradesToCache } from '@/services/cacheMappers';
import { useAuthStore } from '@/stores/authStore';
import { localName } from '@/utils/i18nName';

import {
  getGrades,
  getGradesAllSemesters,
  GradesResponse,
  GradesSummary,
  SemesterSummary,
  Grade,
} from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type GradesState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

// ─── Empty state body ─────────────────────────────────────────────────────────

interface EmptyStateProps {
  onRetry: () => void;
  styles: ReturnType<typeof makeStyles>;
}

function EmptyStateBody({ onRetry, styles }: EmptyStateProps) {
  const { t } = useTranslation();
  const { colors } = useColors();

  return (
    <View style={[styles.centerBody, { paddingTop: spacing.sp48 }]}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="school-outline" size={28} color={colors.jadeText} />
      </View>
      <Text style={styles.stateTitle}>{t('grades.empty_title')}</Text>
      <Text style={styles.stateBody}>{t('grades.empty_body')}</Text>
      <PressBox tier="button" style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('grades.empty.retry')}</Text>
      </PressBox>
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
  const { colors } = useColors();

  return (
    <View style={[styles.centerBody, { paddingTop: spacing.sp48 }]}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="warning-outline" size={28} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>{t('grades.error.title')}</Text>
      <Text style={styles.stateBody}>{t('grades.error.body')}</Text>
      <PressBox tier="button" style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('grades.empty.retry')}</Text>
      </PressBox>
    </View>
  );
}

// ─── Cards body ───────────────────────────────────────────────────────────────

function CardsBody({ subjects, styles }: { subjects: Subject[]; styles: ReturnType<typeof makeStyles> }) {
  const { t } = useTranslation();
  return (
    <View>
      <Text style={styles.sectionLabel}>{t('grades.section_subjects')}</Text>
      <View style={styles.cardsBody}>
        {subjects.map((subject) => (
          <SubjectCard key={subject.id} subject={subject} />
        ))}
      </View>
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
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const isAR = lang === 'ar';
  const [devState, setDevState] = useState<GradesState | null>(null);
  const [activeSemester, setActiveSemester] = useState<1 | 2>(2);
  const [calculatorVisible, setCalculatorVisible] = useState(false);
  const [gpaHistoryVisible, setGpaHistoryVisible] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [gradesData, setGradesData] = useState<GradesResponse | null>(null);
  const [cachedSummary, setCachedSummary] = useState<GradesSummary | null>(null);
  const [allSemesterData, setAllSemesterData] = useState<SemesterSummary[]>([]);
  const [semesterTabIds, setSemesterTabIds] = useState<[string | null, string | null]>([null, null]);
  const [activeSemesterId, setActiveSemesterId] = useState<string | undefined>(undefined);
  const insets = useSafeAreaInsets();

  const studentId = useAuthStore.getState().student?.id ?? 'me';

  // ─── Offline query for current semester grades ──────────────────────────────

  const hook = useOfflineQuery<Grade[]>({
    cacheKey: `grades-${activeSemesterId ?? 'current'}`,
    // null (not []) on an empty cache, for both the per-semester and the
    // current-semester branch — a non-null result reads as a cache hit and
    // suppresses the skeleton.
    getCached: async () => {
      if (activeSemesterId) {
        const r = await getGradesForSemester(activeSemesterId);
        return r.length > 0 ? r : null;
      }
      const all = await getAllCachedGrades();
      return all.length > 0 ? all : null;
    },
    fetchFresh: async () => {
      const res = await getGrades(activeSemesterId);
      setGradesData(res);

      // Cache the semester-level GPA/mention/credits so the hero card renders
      // the same numbers on a cold offline launch (the raw response is null then).
      upsertGradesSummary({
        semesterId: res.semester.id,
        gpa: res.gpa,
        mention: res.mention,
        creditsEarned: res.credits.earned,
        creditsTotal: res.credits.total,
        cachedAt: new Date().toISOString(),
      }).catch(() => {});

      // The all-semesters summary feeds the GPA history chart, so it must refresh
      // on every fetch — not just the initial load — or the chart stays frozen
      // (and empty) after a semester switch. The tab wiring below still only
      // initialises once, so a refetch never resets the user's tab selection.
      getGradesAllSemesters()
        .catch(() => ({ semesters: [] as SemesterSummary[] }))
        .then((allSemRes) => {
          setAllSemesterData(allSemRes.semesters);
          if (!activeSemesterId) {
            const yearSems = allSemRes.semesters
              .filter((s) => s.academicYear === res.semester.academicYear)
              .sort((a, b) => a.label.localeCompare(b.label));
            setSemesterTabIds([yearSems[0]?.id ?? null, yearSems[1]?.id ?? null]);
            const currentIdx = yearSems.findIndex((s) => s.id === res.semester.id);
            setActiveSemester(currentIdx === 1 ? 2 : 1);
          }
        })
        .catch(() => {}); // The .catch above covers the request; this covers the handler.

      return mapGradesToCache(
        res.grades,
        studentId,
        res.semester.id,
        res.ccPublished,
        res.nfPublished,
      );
    },
    updateCache: (data) => upsertGrades(data),
  });

  // ─── Derive subjects from cached Grade[] ────────────────────────────────────
  // Scores stay null when unpublished — the SubjectCard renders "—"/"En attente",
  // never a fabricated 0.00.

  const subjects: Subject[] = useMemo(
    () =>
      (hook.data ?? []).map((g) => ({
        id: g.id,
        name: localName({ nameFr: g.subjectName, nameAr: g.subjectNameAr }, lang),
        cc: g.ccScore,
        exam: g.examScore,
        coef: g.coefficient,
        finale: g.finalScore,
        ccPublished: g.ccPublished,
        nfPublished: g.nfPublished,
      })),
    [hook.data, lang],
  );

  // Load the cached semester summary (GPA/mention/credits) cache-first so the
  // hero card works on a cold offline launch. Re-reads after each sync.
  useEffect(() => {
    let alive = true;
    getGradesSummary(activeSemesterId)
      .then((s) => {
        if (alive) setCachedSummary(s);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [activeSemesterId, hook.data]);

  // Final results are published once the response says so (fresh fetch) or any
  // cached grade carries an NF score / flag (offline). Drives the GPA-pending
  // message and gates the mention badge.
  const nfPublished = useMemo(() => {
    if (gradesData) return gradesData.nfPublished ?? gradesData.gpa !== null;
    return (hook.data ?? []).some((g) => g.nfPublished ?? g.finalScore !== null);
  }, [gradesData, hook.data]);

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

  // ─── Semester switch ────────────────────────────────────────────────────────

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

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await hook.refetch();
    setRefreshing(false);
  }, [hook]);

  // ─── Derive screen state ────────────────────────────────────────────────────

  const hookState: GradesState = useMemo(() => {
    if (hook.isLoading && !hook.data) return 'skeleton';
    // No `&& hook.data` — a cold offline start has no cache, and the offline
    // body renders fine with an empty list.
    if (hook.isOffline) return 'offline';
    if (hook.data) return hook.data.length === 0 && !hook.isStale ? 'empty' : 'loaded';
    if (hook.error) return 'error';
    return 'skeleton';
  }, [hook.isLoading, hook.data, hook.isOffline, hook.error, hook.isStale]);

  const gradesState = devState ?? hookState;

  // Prefer the fresh response; fall back to the cached summary so the hero shows
  // real GPA/credits offline instead of "—".
  const summaryGpa = gradesData?.gpa ?? cachedSummary?.gpa ?? null;
  const summaryCredits = gradesData?.credits
    ?? (cachedSummary
      ? { earned: cachedSummary.creditsEarned, total: cachedSummary.creditsTotal }
      : null);

  const headerGpa =
    gradesState === 'loaded' || gradesState === 'offline' || gradesState === 'session'
      ? summaryGpa
      : null;

  const headerCredits =
    gradesState === 'loaded' || gradesState === 'offline'
      ? summaryCredits
      : null;

  // Show the "moyenne après résultats finaux" message instead of a GPA when the
  // semester's final results aren't published yet (grades exist, just CC-only).
  const heroPending =
    (gradesState === 'loaded' || gradesState === 'offline' || gradesState === 'session') &&
    !nfPublished;

  // ─── Scroll shadow ──────────────────────────────────────────────────────────

  const scrollShadow = isScrolled
    ? {
        ...elevation.card,
        borderBottomWidth: isDark ? StyleSheet.hairlineWidth : 0,
        borderBottomColor: colors.hair,
      }
    : undefined;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      {/* Pinned header */}
      <View style={[styles.pinnedHeader, { paddingTop: insets.top + HEADER_PAD }, scrollShadow]}>
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, isAR && styles.headerTitleAR]}>
            {t('grades.title')}
          </Text>
          <PressBox
            tier="icon"
            style={styles.calcBtn}
            onPress={() => setCalculatorVisible(true)}
            hitSlop={8}
          >
            <Ionicons name="calculator-outline" size={19} color={colors.textPrimary} />
          </PressBox>
        </View>
      </View>

      {/* Segmented semester control */}
      {gradesState !== 'error' && (
        <View style={styles.semControl}>
          <PressBox
            tier="tint"
            style={[styles.semSeg, activeSemester === 1 && styles.semSegActive]}
            onPress={() => handleSemesterChange(1)}
          >
            <Text style={[styles.semLabel, activeSemester === 1 && styles.semLabelActive]}>
              {t('grades.semester_1')}
            </Text>
          </PressBox>
          <PressBox
            tier="tint"
            style={[styles.semSeg, activeSemester === 2 && styles.semSegActive]}
            onPress={() => handleSemesterChange(2)}
          >
            <Text style={[styles.semLabel, activeSemester === 2 && styles.semLabelActive]}>
              {t('grades.semester_2')}
            </Text>
          </PressBox>
        </View>
      )}

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setIsScrolled(e.nativeEvent.contentOffset.y > 2)}
        scrollEventThrottle={16}
        refreshControl={
          gradesState !== 'skeleton' ? (
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
        {/* Hero card */}
        {gradesState === 'skeleton' && (
          <GpaHeroCard
            gpa={null}
            credits={null}
            activeSemester={activeSemester}
            onPress={undefined}
            skeleton
          />
        )}
        {(gradesState === 'loaded' || gradesState === 'offline' || gradesState === 'session' || gradesState === 'empty') && (
          <GpaHeroCard
            gpa={headerGpa}
            credits={headerCredits}
            activeSemester={activeSemester}
            pending={heroPending}
            onPress={() => setGpaHistoryVisible(true)}
          />
        )}

        {gradesState === 'skeleton' && <GradesSkeleton />}

        {(gradesState === 'loaded' || gradesState === 'session' || gradesState === 'offline') && (
          <CardsBody subjects={subjects} styles={styles} />
        )}

        {gradesState === 'empty' && (
          <EmptyStateBody
            onRetry={() => hook.refetch()}
            styles={styles}
          />
        )}

        {gradesState === 'error' && (
          <ErrorStateBody onRetry={() => hook.refetch()} styles={styles} />
        )}

        <View style={{ height: 88 + insets.bottom }} />
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

  // ── Pinned header
  pinnedHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sp20,
    paddingBottom: spacing.sp12,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sp4,
  },
  headerTitle: {
    fontSize: fz(24),
    fontWeight: '800',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerTitleAR: {
    fontSize: fz(26),
    fontWeight: '700',
    letterSpacing: 0,
  },
  calcBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.rFull,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#1C2320', // segmented control shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2, // segmented control subtle lift
  },

  // ── Segmented semester control
  semControl: {
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.sunken,
    padding: 3,
    marginHorizontal: spacing.sp20,
    marginTop: spacing.sp4,
    flexDirection: 'row',
    marginBottom: spacing.sp4,
  },
  semSeg: {
    flex: 1,
    borderRadius: 9, // concentric inset: container rMd 12 minus padding 3
    alignItems: 'center',
    justifyContent: 'center',
  },
  semSegActive: {
    backgroundColor: colors.jade400,
  },
  semLabel: {
    fontSize: fz(13.5),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
  },
  semLabelActive: {
    fontWeight: '700',
    // On the jade400 active segment. A literal #FFFFFF stayed white while the
    // jade brightened to #2ECC96 in dark mode; surface inverts with the theme.
    color: colors.surface,
  },

  // ── Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Section label
  sectionLabel: {
    fontSize: fz(12.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    marginTop: spacing.sp16,
    marginBottom: spacing.sp12,
    marginHorizontal: spacing.sp20,
  },

  // ── Cards body
  cardsBody: {
    gap: 12,
    paddingHorizontal: spacing.sp16,
  },

  // ── Center states (empty / error)
  centerBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
  },
  stateTitle: {
    fontSize: fz(14),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp16,
  },
  stateBody: {
    fontSize: fz(14),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 245,
    lineHeight: fz(22),
    marginTop: spacing.sp8,
  },

  // ── Shared retry button
  retryBtn: {
    width: 168,
    height: 48,
    borderRadius: radius.rBtn,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp48,
    alignSelf: 'center',
  },
  retryBtnText: {
    fontSize: fz(15),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },

  // ── Empty state icon circle
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.rFull,
    backgroundColor: colors.jadeFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Error icon circle
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.rFull,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
