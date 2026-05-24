import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Animated,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { fonts, spacing, radius, sizing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { getSubjectColor, getCategoryColor } from '@/constants/colorMap';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { CourseDetailSheet } from '@/components/schedule/CourseDetailSheet';
import { useCourseDetailStore, ExtendedCourse } from '@/stores/courseDetailStore';
import { useAuthStore } from '@/stores/authStore';
import { getStudentMe, getSchedule, getNews, Schedule, NewsItem } from '@/services/api';
import type { StudentProfileCache } from '@/services/api';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import {
  getStudentProfile,
  getFullSemesterSchedule,
  getCachedNews,
  upsertProfile,
  upsertSchedules,
  upsertNews,
} from '@/services/db';
import {
  mapProfileToCache,
  mapScheduleToCache,
  mapNewsToCache,
} from '@/services/cacheMappers';
import { getGreeting, isWeekend } from '@/utils/greeting';

type HomeState = 'loaded' | 'error' | 'empty' | 'skeleton' | 'offline';

// ─── Agenda card display props ────────────────────────────────────────────────

interface AgendaCardData {
  id: string;
  accentColor: string;
  time: string;
  course: string;
  teacher: string;
  location: string;
  statusLabel?: string;
  statusBg?: string;
  statusColor?: string;
  statusBorder?: string;
  isOffline?: boolean;
  courseStatus: 'active' | 'past' | 'upcoming';
  code: string;
  coefficient: number;
  dayOfWeek: number;
}

function toExtendedCourse(item: AgendaCardData): ExtendedCourse {
  const parts = item.time.split(' - ');
  return {
    id: item.id,
    subject: item.course,
    teacher: item.teacher,
    room: item.location,
    start: parts[0].trim(),
    end: parts[1]?.trim() ?? '',
    status: item.courseStatus,
    code: item.code,
    coefficient: item.coefficient,
    dayOfWeek: item.dayOfWeek,
  };
}

function scheduleToCard(s: Schedule, nowMins: number, colors: Palette): AgendaCardData {
  const [sh, sm] = s.startTime.split(':').map(Number);
  const [eh, em] = s.endTime.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  const isActive = nowMins >= startMins && nowMins < endMins;
  const isPast = nowMins >= endMins;
  const courseStatus: 'active' | 'past' | 'upcoming' = isPast ? 'past' : isActive ? 'active' : 'upcoming';

  let accentColor: string = getSubjectColor(s.subjectName).accent;
  let statusLabel: string | undefined;
  let statusBg: string | undefined;
  let statusColor: string | undefined;
  let statusBorder: string | undefined;

  if (s.isExam) {
    accentColor = colors.exam;
    statusLabel = 'Examen';
    statusBg = withAlpha(colors.exam, 0.15);
    statusColor = colors.exam;
    statusBorder = colors.exam;
  } else if (isActive) {
    statusLabel = 'En cours';
    statusBg = withAlpha(colors.jade400, 0.15);
    statusColor = colors.jade400;
  }

  return {
    id: s.id,
    accentColor,
    time: `${s.startTime} - ${s.endTime}`,
    course: s.subjectName,
    teacher: s.lecturerName,
    location: s.room,
    statusLabel,
    statusBg,
    statusColor,
    statusBorder,
    courseStatus,
    code: s.subjectCode,
    coefficient: s.coefficient,
    dayOfWeek: s.dayOfWeek,
  };
}

// ─── Skeleton pulse ───────────────────────────────────────────────────────────

function SkeletonBox({ style }: { style: object }) {
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [opacity]);

  return <Animated.View style={[style, { opacity }]} />;
}

// ─── Agenda card ─────────────────────────────────────────────────────────────

interface AgendaCardProps {
  accentColor: string;
  time: string;
  course: string;
  teacher: string;
  location: string;
  statusLabel?: string;
  statusBg?: string;
  statusColor?: string;
  statusBorder?: string;
  isOffline?: boolean;
  onPress?: () => void;
}

function AgendaCard({
  accentColor,
  time,
  course,
  teacher,
  location,
  statusLabel,
  statusBg,
  statusColor,
  statusBorder,
  isOffline,
  onPress,
}: AgendaCardProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.agendaCard, pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.06) }]}
    >
      <View style={[styles.agendaAccent, { backgroundColor: accentColor }]} />
      <View style={styles.agendaContent}>
        <Text style={styles.agendaTime}>{time}</Text>
        <Text style={styles.agendaCourse}>{course}</Text>
        <Text style={styles.agendaTeacher}>{teacher}</Text>
        {isOffline && (
          <View style={styles.offlineWarningRow}>
            <Ionicons name="warning-outline" size={12} color={colors.warning} />
            <Text style={styles.offlineWarningText}>données locales</Text>
          </View>
        )}
        <View style={styles.pillRow}>
          <View style={styles.locationPill}>
            <Text style={styles.locationPillText}>{location}</Text>
          </View>
          {statusLabel != null && (
            <View
              style={[
                styles.statusPill,
                { backgroundColor: statusBg },
                statusBorder != null && { borderWidth: 1, borderColor: statusBorder },
              ]}
            >
              <Text style={[styles.statusPillText, { color: statusColor }]}>
                {statusLabel}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Pressable>
  );
}

// ─── News card ────────────────────────────────────────────────────────────────

function NewsCard({
  title,
  category,
  imageUrl,
  onPress,
}: {
  title: string;
  category: string;
  imageUrl?: string | null;
  onPress: () => void;
}) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.newsCard, pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.06) }]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.newsThumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.newsThumbnail} />
      )}
      <View style={styles.newsText}>
        <Text style={styles.newsTitle} numberOfLines={2}>{title}</Text>
        <View style={[styles.newsCategoryPill, { backgroundColor: getCategoryColor(category).bg }]}>
          <Text style={[styles.newsCategoryText, { color: getCategoryColor(category).text }]}>{category}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Skeleton header ──────────────────────────────────────────────────────────

function SkeletonHeader() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.headerSection}>
      <View style={styles.headerTopRow}>
        <SkeletonBox style={styles.skelBar180} />
        <SkeletonBox style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: withAlpha(colors.skeletonBox, 0.6) }} />
      </View>
      <SkeletonBox style={[styles.skelBar, { width: 240, marginTop: 8 }]} />
      <SkeletonBox style={[styles.skelBar, { width: 160, marginTop: 8 }]} />
      <View style={styles.divider} />
      <View style={styles.statRow}>
        {[0, 1, 2].map((i) => (
          <SkeletonBox key={i} style={styles.skelStatCard} />
        ))}
      </View>
    </View>
  );
}

// ─── Skeleton body ────────────────────────────────────────────────────────────

function SkeletonBody() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.bodySection}>
      <View style={styles.sectionHeadingRow}>
        <SkeletonBox style={{ width: 169, height: 15, borderRadius: radius.rFull, backgroundColor: withAlpha(colors.skeletonBox, 0.6) }} />
        <SkeletonBox style={{ width: 44, height: 15, borderRadius: radius.rFull, backgroundColor: withAlpha(colors.skeletonBox, 0.6) }} />
      </View>
      {[0, 1, 2].map((i) => (
        <View key={i} style={styles.skelAgendaCard}>
          <SkeletonBox style={styles.skelAccent} />
          <View style={styles.skelAgendaInner}>
            <SkeletonBox style={[styles.skelBar, { width: 100 }]} />
            <SkeletonBox style={[styles.skelBar, { width: 200, marginTop: spacing.sp6 }]} />
            <SkeletonBox style={[styles.skelBar, { width: 140, marginTop: spacing.sp6 }]} />
            <SkeletonBox style={[styles.skelBar, { width: 80, marginTop: spacing.sp6 }]} />
          </View>
        </View>
      ))}
      <View style={[styles.sectionHeadingRow, { marginTop: 24 }]}>
        <SkeletonBox style={{ width: 169, height: 15, borderRadius: radius.rFull, backgroundColor: withAlpha(colors.skeletonBox, 0.6) }} />
        <SkeletonBox style={{ width: 44, height: 15, borderRadius: radius.rFull, backgroundColor: withAlpha(colors.skeletonBox, 0.6) }} />
      </View>
      {[0, 1].map((i) => (
        <SkeletonBox key={i} style={styles.skelNewsCard} />
      ))}
    </View>
  );
}

// ─── Loaded header ────────────────────────────────────────────────────────────

interface LoadedHeaderProps {
  isOffline: boolean;
  topInset: number;
  lastSyncTime?: string;
  profile: StudentProfileCache | null;
}

function LoadedHeader({
  isOffline,
  topInset,
  lastSyncTime,
  profile,
}: LoadedHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const today = new Date();
  const dateStr = today
    .toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    .toUpperCase();

  const displayName = profile?.firstName ?? '—';
  const displayGpa = profile?.gpa != null ? profile.gpa.toFixed(1) : '--';
  const displayMention = profile?.mention ?? '';
  const displayAttendance = profile?.attendancePercentage != null ? `${profile.attendancePercentage}%` : '--';
  const displayCredits = String(profile?.creditsEarned ?? 0);
  const displayCreditsTotal = profile?.creditsTotal ?? 0;

  const subtitle = t(getGreeting());

  return (
    <View style={[styles.headerSection, { paddingTop: topInset + 16 }]}>
      <View style={styles.headerTopRow}>
        <Text style={styles.dateLabel}>{dateStr}</Text>
        <Pressable
          style={({ pressed }) => [styles.bellBtn, pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.15), borderRadius: 999 }]}
          onPress={() => router.push('/notifications')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
      <Text style={styles.greeting}>
        <Text style={styles.greetingBase}>Bonjour, </Text>
        <Text style={styles.greetingName}>{displayName}</Text>
      </Text>
      {isOffline ? (
        <Text style={styles.subtitleOffline}>
          <Text style={styles.subtitleOfflineNormal}>Données locales – </Text>
          <Text style={styles.subtitleOfflineTime}>{t('common.last_sync_short', { time: lastSyncTime ?? 'hier 14h30' })}</Text>
        </Text>
      ) : (
        <Text style={styles.subtitle}>{subtitle}</Text>
      )}
      <View style={styles.divider} />
      <View style={styles.statRow}>
        <StatCard label="GPA" value={displayGpa} sub={displayMention} onPress={() => router.push('/(tabs)/grades')} />
        <StatCard label="PRÉSENCE" value={displayAttendance} sub="Limite: 75%" onPress={() => router.push('/attendance')} />
        <StatCard label="CRÉDITS" value={displayCredits} sub={`/ ${displayCreditsTotal} ce sem.`} onPress={() => router.push('/(tabs)/grades')} />
      </View>
    </View>
  );
}

function StatCard({ label, value, sub, onPress }: { label: string; value: string; sub: string; onPress?: () => void }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable style={({ pressed }) => [styles.statCard, pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 8 }]} onPress={onPress} hitSlop={4}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSub}>{sub}</Text>
    </Pressable>
  );
}

// ─── Simple header (error / empty / loading) ──────────────────────────────────

function SimpleHeader({ topInset }: { topInset: number }) {
  const router = useRouter();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.simpleHeader, { paddingTop: topInset + 0 }]}>
      <View style={styles.headerTopRow}>
        <Text style={styles.simpleHeaderTitle}>Accueil</Text>
        <Pressable
          style={({ pressed }) => [styles.bellBtn, pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.15), borderRadius: 999 }]}
          onPress={() => router.push('/notifications')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.divider} />
    </View>
  );
}

// ─── Session expired modal ────────────────────────────────────────────────────

function SessionExpiredModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.dragHandle} />
        <View style={styles.modalIconCircle}>
          <Ionicons name="key-outline" size={36} color={colors.warning} />
        </View>
        <Text style={styles.modalTitle}>Session expirée</Text>
        <Text style={styles.modalBody}>
          Votre session a expiré pour des raisons de sécurité. Reconnectez-vous pour continuer à accéder à vos données.
        </Text>
        <Pressable
          style={({ pressed }) => [styles.modalPrimaryBtn, pressed && { backgroundColor: colors.jade600 }]}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.modalPrimaryBtnText}>Se connecter</Text>
        </Pressable>
        <Pressable style={({ pressed }) => [styles.modalOutlineBtn, pressed && { backgroundColor: withAlpha(colors.jade400, 0.15) }]} onPress={onClose}>
          <Text style={styles.modalOutlineBtnText}>Continuer en hors-ligne</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── DEV switcher ─────────────────────────────────────────────────────────────

const ALL_STATES: HomeState[] = ['loaded', 'error', 'empty', 'skeleton', 'offline'];
const STATE_LABELS: Record<HomeState, string> = {
  loaded:   'loaded',
  error:    'error',
  empty:    'empty',
  skeleton: 'loading/skeleton',
  offline:  'offline',
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function HomeScreen() {
  const [devState, setDevState] = useState<HomeState | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [courseDetailVisible, setCourseDetailVisible] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const setSelectedCourse = useCourseDetailStore((s) => s.setSelectedCourse);

  const studentId = useAuthStore.getState().student?.id ?? 'me';

  // ─── Offline queries ────────────────────────────────────────────────────────

  const profileHook = useOfflineQuery<StudentProfileCache>({
    cacheKey: 'profile',
    getCached: () => getStudentProfile(),
    fetchFresh: async () => {
      const me = await getStudentMe();
      useAuthStore.getState().setStudent(me);
      return mapProfileToCache(me);
    },
    updateCache: (data) => upsertProfile(data),
  });

  const scheduleHook = useOfflineQuery<Schedule[]>({
    cacheKey: 'schedule',
    getCached: () => getFullSemesterSchedule(),
    fetchFresh: async () => {
      const res = await getSchedule();
      return mapScheduleToCache(res.entries, studentId, res.semesterId);
    },
    updateCache: (data) => upsertSchedules(data),
  });

  const newsHook = useOfflineQuery<NewsItem[]>({
    cacheKey: 'news-home',
    getCached: () => getCachedNews(5),
    fetchFresh: async () => {
      const res = await getNews({ limit: 5 });
      return mapNewsToCache(res.articles);
    },
    updateCache: (data) => upsertNews(data),
  });

  // ─── Derive today's schedule ────────────────────────────────────────────────

  const todayDow = new Date().getDay();
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

  const todayCards = useMemo(() => {
    const entries = scheduleHook.data ?? [];
    return entries
      .filter((s) => s.dayOfWeek === todayDow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((s) => scheduleToCard(s, nowMins, colors));
  }, [scheduleHook.data, todayDow, nowMins, colors]);

  const newsCards = useMemo(() => {
    return (newsHook.data ?? []).slice(0, 3);
  }, [newsHook.data]);

  // ─── Derive screen state from hooks ────────────────────────────────────────

  const hookState: HomeState = useMemo(() => {
    const anyLoading = profileHook.isLoading && !profileHook.data;
    if (anyLoading && !scheduleHook.data) return 'skeleton';

    const anyOffline = profileHook.isOffline || scheduleHook.isOffline;
    const anyData = profileHook.data != null || scheduleHook.data != null;

    if (anyData && anyOffline) return 'offline';
    if (anyData) {
      return 'loaded';
    }
    if (profileHook.error || scheduleHook.error) return 'error';
    return 'skeleton';
  }, [
    profileHook.isLoading, profileHook.data, profileHook.isOffline,
    profileHook.isStale, profileHook.error,
    scheduleHook.data, scheduleHook.isOffline, scheduleHook.error,
    todayCards.length,
  ]);

  const homeState = devState ?? hookState;

  const isOffline = homeState === 'offline';
  const showLoadedHeader = homeState === 'loaded' || isOffline;
  const showSkeleton = homeState === 'skeleton';
  const showError = homeState === 'error';

  const handleAgendaPress = (item: AgendaCardData) => {
    setSelectedCourse(toExtendedCourse(item));
    setCourseDetailVisible(true);
  };

  const handleRetry = () => {
    profileHook.refetch();
    scheduleHook.refetch();
    newsHook.refetch();
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Header — pinned, outside ScrollView */}
      {showSkeleton ? (
        <View style={{ paddingTop: insets.top }}><SkeletonHeader /></View>
      ) : showLoadedHeader ? (
        <LoadedHeader
          isOffline={isOffline}
          topInset={insets.top}
          profile={profileHook.data}
        />
      ) : (
        <SimpleHeader topInset={insets.top} />
      )}

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Body */}
        {showSkeleton && <SkeletonBody />}

        {(homeState === 'loaded' || isOffline) && (
          <View style={styles.bodySection}>
            {/* Agenda section */}
            <View style={styles.sectionHeadingRow}>
              <Text style={styles.sectionHeading}>Agenda du jour</Text>
              <Pressable onPress={() => router.push('/(tabs)/schedule')} hitSlop={8} style={({ pressed }) => pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 6 }}>
                <Text style={styles.sectionLink}>Voir tout</Text>
              </Pressable>
            </View>

            {todayCards.length > 0 ? (
              todayCards.map((item) => (
                <AgendaCard
                  key={item.id}
                  accentColor={item.accentColor}
                  time={item.time}
                  course={item.course}
                  teacher={item.teacher}
                  location={item.location}
                  statusLabel={item.statusLabel}
                  statusBg={item.statusBg}
                  statusColor={item.statusColor}
                  statusBorder={item.statusBorder}
                  isOffline={isOffline}
                  onPress={() => handleAgendaPress(item)}
                />
              ))
            ) : (
              <View style={styles.emptyAgendaCard}>
                <Text style={styles.emptyAgendaText}>
                  {t(isWeekend() ? 'home.agenda.weekend' : 'home.agenda.empty')}
                </Text>
              </View>
            )}

            {/* News section */}
            <View style={[styles.sectionHeadingRow, { marginTop: 24 }]}>
              <Text style={styles.sectionHeading}>{t('home.news_section')}</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/news')}
                hitSlop={8}
                style={({ pressed }) => pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 6 }}
              >
                <Text style={styles.sectionLink}>{t('home.see_all')}</Text>
              </Pressable>
            </View>

            {newsCards.length > 0 ? (
              newsCards.map((article) => (
                <NewsCard
                  key={article.id}
                  title={article.title}
                  category={article.category}
                  imageUrl={article.imageUrl}
                  onPress={() => router.push({ pathname: '/article-reader', params: { id: article.id } })}
                />
              ))
            ) : isOffline ? (
              <View style={styles.newsOfflineCard}>
                <View style={styles.newsOfflineIcon}>
                  <Ionicons name="globe-outline" size={18} color={colors.surface} />
                </View>
                <Text style={styles.newsOfflineText}>
                  Actualités et mises à jour indisponibles hors-ligne. Reconnectez-vous pour synchroniser.
                </Text>
              </View>
            ) : null}
          </View>
        )}

        {showError && (
          <View style={styles.centerState}>
            <View style={styles.errorIconCircle}>
              <Ionicons name="wifi-outline" size={42} color={colors.textPrimary} />
            </View>
            <Text style={styles.stateTitle}>Impossible de charger votre agenda</Text>
            <Text style={styles.stateBody}>
              Vérifiez votre connexion internet et réessayez.
            </Text>
            <Pressable style={({ pressed }) => [styles.retryBtn, pressed && { backgroundColor: colors.jade600 }]} onPress={handleRetry}>
              <Text style={styles.retryBtnText}>Réessayer</Text>
            </Pressable>
          </View>
        )}

        {homeState === 'empty' && (
          <View style={styles.centerState}>
            <Text style={styles.palmEmoji}>🌴</Text>
            <Text style={styles.stateTitle}>Aucun cours aujourd'hui</Text>
            <Text style={styles.stateBody}>
              Pas de cours programmé. Bon repos !
            </Text>
          </View>
        )}

        <View style={{ height: spacing.sp64 }} />
      </ScrollView>

      {showSessionModal && (
        <SessionExpiredModal onClose={() => setShowSessionModal(false)} />
      )}

      <CourseDetailSheet
        visible={courseDetailVisible}
        onClose={() => setCourseDetailVisible(false)}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={homeState}
        onChange={(s) => setDevState(s)}
        showModal={showSessionModal}
        onToggleModal={() => setShowSessionModal((v) => !v)}
        modalLabel="modal"
      />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const makeStyles = (colors: Palette) => StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { flexGrow: 1 },

  headerSection: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sp16,
    paddingTop: spacing.sp16,
    paddingBottom: 0,
  },
  dateLabel: {
    fontSize: 11, fontWeight: '600', color: colors.textTertiary,
    fontFamily: fonts.sans, letterSpacing: 0.5, textTransform: 'uppercase',
  },
  greeting: { marginTop: spacing.sp4 },
  greetingBase: { fontSize: 28, fontWeight: '800', color: colors.textPrimary, fontFamily: fonts.sans },
  greetingName: { fontSize: 28, fontWeight: '800', color: colors.jade400, fontFamily: fonts.sans },
  subtitle: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.sans, marginTop: spacing.sp4 },
  subtitleOffline: { fontSize: 13, marginTop: spacing.sp4 },
  subtitleOfflineNormal: { fontSize: 13, color: colors.textSecondary, fontFamily: fonts.sans },
  subtitleOfflineTime: { fontSize: 13, color: colors.warning, fontFamily: fonts.sans },
  divider: { height: 1, backgroundColor: colors.border, marginTop: spacing.sp12 },
  statRow: { flexDirection: 'row', gap: spacing.sp8, marginTop: spacing.sp12, marginBottom: spacing.sp16 },
  statCard: { flex: 1, backgroundColor: colors.background, borderRadius: radius.rLg, padding: spacing.sp12 },
  statLabel: { fontSize: 10, fontWeight: '600', color: colors.textTertiary, textTransform: 'uppercase', fontFamily: fonts.sans },
  statValue: { fontSize: 24, fontWeight: '800', color: colors.jade400, fontFamily: fonts.sans, marginTop: spacing.sp2 },
  statSub: { fontSize: 11, color: colors.textTertiary, fontFamily: fonts.sans, marginTop: spacing.sp2 },

  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bellBtn: { width: sizing.touchTarget, height: sizing.touchTarget, alignItems: 'center', justifyContent: 'center' },

  simpleHeader: { backgroundColor: colors.surface, paddingHorizontal: spacing.sp16 },
  simpleHeaderTitle: {
    fontSize: 24, fontWeight: '800', color: colors.textPrimary,
    fontFamily: fonts.sans, paddingTop: spacing.sp16, paddingBottom: spacing.sp16,
  },

  bodySection: { backgroundColor: colors.background, paddingHorizontal: spacing.sp16 },
  sectionHeadingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginTop: spacing.sp24, marginBottom: spacing.sp12,
  },
  sectionHeading: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, fontFamily: fonts.sans },
  sectionLink: { fontSize: 13, color: colors.jade400, fontFamily: fonts.sans },

  agendaCard: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.rLg, marginBottom: 23, minHeight: 91, overflow: 'hidden',
  },
  agendaAccent: { width: 9, borderTopStartRadius: radius.rLg, borderBottomStartRadius: radius.rLg },
  agendaContent: {
    flex: 1, paddingStart: spacing.sp12, paddingEnd: spacing.sp16,
    paddingTop: 11, paddingBottom: 11, justifyContent: 'center',
  },
  agendaTime: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.mono },
  agendaCourse: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, fontFamily: fonts.sans, marginTop: 1 },
  agendaTeacher: { fontSize: 12, color: colors.textSecondary, fontFamily: fonts.sans },
  offlineWarningRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sp4, marginTop: spacing.sp2 },
  offlineWarningText: { fontSize: 11, color: colors.warning, fontFamily: fonts.sans },
  pillRow: { flexDirection: 'row', gap: spacing.sp8, marginTop: spacing.sp8, alignItems: 'center' },
  locationPill: { backgroundColor: colors.background, borderRadius: radius.rFull, paddingHorizontal: 10, paddingVertical: 4 },
  locationPillText: { fontSize: 11, color: colors.textPrimary, fontWeight: '500', fontFamily: fonts.sans },
  statusPill: { borderRadius: radius.rFull, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillText: { fontSize: 11, fontWeight: '500', fontFamily: fonts.sans },

  emptyAgendaCard: {
    backgroundColor: colors.surface, borderRadius: radius.rLg,
    padding: spacing.sp16, alignItems: 'center', marginBottom: 23,
  },
  emptyAgendaText: { fontSize: 14, color: colors.textSecondary, fontFamily: fonts.sans },

  newsCard: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: radius.rLg,
    marginBottom: spacing.sp14, minHeight: 64, alignItems: 'center',
    paddingHorizontal: spacing.sp12, paddingVertical: 10, gap: spacing.sp12,
  },
  newsThumbnail: { width: 38, height: 37, borderRadius: radius.rMd, backgroundColor: colors.background },
  newsText: { flex: 1, alignItems: 'flex-start' },
  newsTitle: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.sans },
  newsCategoryPill: {
    alignSelf: 'flex-start', backgroundColor: colors.background,
    borderRadius: radius.rFull, paddingHorizontal: spacing.sp8, paddingVertical: spacing.sp2, marginTop: spacing.sp4,
  },
  newsCategoryText: { fontSize: 10, color: colors.textSecondary, fontFamily: fonts.sans, textTransform: 'capitalize' },

  newsOfflineCard: {
    flexDirection: 'row', backgroundColor: withAlpha(colors.warning, 0.08),
    borderWidth: 1, borderColor: colors.warning, borderRadius: radius.rLg,
    padding: spacing.sp16, gap: spacing.sp12, alignItems: 'center',
  },
  newsOfflineIcon: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.jade400, alignItems: 'center', justifyContent: 'center',
  },
  newsOfflineText: { flex: 1, fontSize: 13, color: colors.warning, fontFamily: fonts.sans },

  centerState: { flex: 1, alignItems: 'center', paddingHorizontal: spacing.sp24, paddingTop: 144 },
  errorIconCircle: {
    width: 72, height: 72, borderRadius: 216,
    backgroundColor: colors.errorCircleBg, alignItems: 'center', justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 16, fontWeight: '700', color: colors.textPrimary,
    textAlign: 'center', marginTop: spacing.sp16, fontFamily: fonts.sans,
  },
  stateBody: {
    fontSize: 14, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.sp8, fontFamily: fonts.sans,
  },
  retryBtn: {
    width: 168, height: 56, borderRadius: radius.rLg,
    backgroundColor: colors.jade400, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sp24,
  },
  retryBtnText: { fontSize: 15, fontWeight: '700', color: colors.surface, fontFamily: fonts.sans },
  palmEmoji: { fontSize: 80, textAlign: 'center' },

  skelBar180: { width: 180, height: 15, borderRadius: radius.rFull, backgroundColor: withAlpha(colors.skeletonBox, 0.6) },
  skelBar: { height: 15, borderRadius: radius.rFull, backgroundColor: withAlpha(colors.skeletonBox, 0.6) },
  skelStatCard: { flex: 1, height: 72, borderRadius: radius.rLg, backgroundColor: withAlpha(colors.skeletonBox, 0.6) },
  skelAgendaCard: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.rLg, marginBottom: 23, height: 91, overflow: 'hidden',
  },
  skelAccent: {
    width: 9, height: 91, backgroundColor: withAlpha(colors.skeletonBox, 0.6),
    borderTopStartRadius: radius.rLg, borderBottomStartRadius: radius.rLg,
  },
  skelAgendaInner: {
    flex: 1, paddingStart: spacing.sp12, paddingEnd: spacing.sp16,
    paddingTop: 11, gap: 0, justifyContent: 'center',
  },
  skelNewsCard: {
    width: '100%', height: 64, borderRadius: radius.rLg,
    backgroundColor: withAlpha(colors.skeletonBox, 0.6), marginBottom: spacing.sp14,
  },

  modalOverlay: {
    position: 'absolute', top: 0, bottom: 0, start: 0, end: 0,
    backgroundColor: withAlpha(colors.black, 0.5), justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface, borderTopStartRadius: radius.r2xl,
    borderTopEndRadius: radius.r2xl, padding: spacing.sp24, paddingBottom: 40,
  },
  dragHandle: {
    width: 49, height: 9, borderRadius: spacing.sp8,
    backgroundColor: colors.skeletonBox, alignSelf: 'center', marginBottom: spacing.sp24,
  },
  modalIconCircle: {
    width: 72, height: 72, borderRadius: 216, backgroundColor: colors.examCircleBg,
    alignSelf: 'center', alignItems: 'center', justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16, fontWeight: '700', color: colors.textPrimary,
    textAlign: 'center', marginTop: spacing.sp16, fontFamily: fonts.sans,
  },
  modalBody: {
    fontSize: 14, color: colors.textSecondary,
    textAlign: 'center', marginTop: spacing.sp8, fontFamily: fonts.sans,
  },
  modalPrimaryBtn: {
    width: '100%', height: 56, borderRadius: radius.rLg,
    backgroundColor: colors.jade400, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sp24,
  },
  modalPrimaryBtnText: { fontSize: 15, fontWeight: '700', color: colors.surface, fontFamily: fonts.sans },
  modalOutlineBtn: {
    width: '100%', height: 56, borderRadius: radius.rLg,
    borderWidth: 1, borderColor: colors.jade400, alignItems: 'center', justifyContent: 'center', marginTop: spacing.sp12,
  },
  modalOutlineBtnText: { fontSize: 15, fontWeight: '600', color: colors.jade400, fontFamily: fonts.sans },
});
