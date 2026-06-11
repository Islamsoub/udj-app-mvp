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
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { elevation, fonts, spacing, radius, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { buildSubjectColorMap, getSubjectColor, getNewsCategoryColors } from '@/constants/colorMap';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { CourseDetailSheet } from '@/components/schedule/CourseDetailSheet';
import { useCourseDetailStore, ExtendedCourse } from '@/stores/courseDetailStore';
import { useAuthStore } from '@/stores/authStore';
import { useNetworkStore } from '@/stores/networkStore';
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
import { formatLocalDate } from '@/utils/dateFormat';
import { localName } from '@/utils/i18nName';

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

const MENTION_KEY: Record<string, string> = {
  'Ajourné': 'home.mention.ajourne',
  'Passable': 'home.mention.passable',
  'Assez Bien': 'home.mention.assez_bien',
  'Bien': 'home.mention.bien',
  'Très Bien': 'home.mention.tres_bien',
  'Félicitations': 'home.mention.felicitations',
};

function scheduleToCard(s: Schedule, nowMins: number, colors: Palette, t: (key: string) => string, lang: string, isDark: boolean = false): AgendaCardData {
  const [sh, sm] = s.startTime.split(':').map(Number);
  const [eh, em] = s.endTime.split(':').map(Number);
  const startMins = sh * 60 + sm;
  const endMins = eh * 60 + em;

  const isActive = nowMins >= startMins && nowMins < endMins;
  const isPast = nowMins >= endMins;
  const courseStatus: 'active' | 'past' | 'upcoming' = isPast ? 'past' : isActive ? 'active' : 'upcoming';

  let accentColor: string = getSubjectColor(s.subjectName, isDark).accent;
  let statusLabel: string | undefined;
  let statusBg: string | undefined;
  let statusColor: string | undefined;
  let statusBorder: string | undefined;

  if (s.isExam) {
    accentColor = colors.exam;
    statusLabel = t('schedule.status.exam');
    statusBg = withAlpha(colors.exam, 0.15);
    statusColor = colors.exam;
    statusBorder = colors.exam;
  } else if (isActive) {
    statusLabel = t('schedule.status.active');
    statusBg = withAlpha(colors.jade400, 0.15);
    statusColor = colors.jade400;
  }

  return {
    id: s.id,
    accentColor,
    time: `${s.startTime} - ${s.endTime}`,
    course: localName({ nameFr: s.subjectName, nameAr: s.subjectNameAr }, lang),
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
  courseStatus: 'active' | 'past' | 'upcoming';
  statusLabel?: string;
  onPress?: () => void;
}

function AgendaCard({
  accentColor,
  time,
  course,
  teacher,
  location,
  courseStatus,
  statusLabel,
  onPress,
}: AgendaCardProps) {
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const isPast = courseStatus === 'past';
  const isActive = courseStatus === 'active';
  const isExam = statusLabel != null;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.agendaCard, pressed && { opacity: 0.85 }]}
    >
      <View style={[styles.agendaRail, { backgroundColor: accentColor }]} />
      <View style={styles.agendaContent}>
        <Text style={styles.agendaTime}>{time}</Text>
        <Text style={[styles.agendaCourse, isPast && { opacity: 0.45 }]} numberOfLines={2}>{course}</Text>
        <Text style={styles.agendaTeacher} numberOfLines={1}>{teacher}</Text>
        <View style={styles.pillRow}>
          <View style={styles.locationPill}>
            <Text style={styles.locationPillText}>{location}</Text>
          </View>
          {isExam && (
            <View style={styles.statusPillExam}>
              <Text style={styles.statusPillExamText}>{statusLabel}</Text>
            </View>
          )}
          {!isExam && isActive && (
            <View style={styles.statusPillActive}>
              <Text style={styles.statusPillActiveText}>{t('schedule.status.active')}</Text>
            </View>
          )}
          {!isExam && isPast && (
            <View style={styles.statusPillPast}>
              <Text style={styles.statusPillPastText}>{t('schedule.status.done')}</Text>
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
  const { fg, bg } = getNewsCategoryColors(category, colors);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.newsCard, pressed && { opacity: 0.85 }]}
    >
      {imageUrl ? (
        <Image source={{ uri: imageUrl }} style={styles.newsThumbnail} resizeMode="cover" />
      ) : (
        <View style={styles.newsThumbnailPlaceholder}>
          <Ionicons name="image-outline" size={22} color={colors.textTertiary} />
        </View>
      )}
      <View style={styles.newsText}>
        <Text style={styles.newsTitle} numberOfLines={2}>{title}</Text>
        <View style={[styles.newsCategoryPill, { backgroundColor: bg }]}>
          <Text style={[styles.newsCategoryText, { color: fg }]}>{category}</Text>
        </View>
      </View>
    </Pressable>
  );
}

// ─── Skeleton header ──────────────────────────────────────────────────────────

function SkeletonHeader({ topInset }: { topInset: number }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[styles.headerSection, { paddingTop: topInset + 2 }]}>
      <View style={styles.headerTopRow}>
        <SkeletonBox style={styles.skelBar180} />
        <SkeletonBox style={styles.skelBellCircle} />
      </View>
      <SkeletonBox style={[styles.skelBar, { width: 180, marginTop: 14 }]} />
      <SkeletonBox style={[styles.skelBar, { width: 140, marginTop: spacing.sp8 }]} />
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
      <View style={[styles.sectionHeadingRow, { marginTop: 18 }]}>
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
      <View style={[styles.sectionHeadingRow, { marginTop: 26 }]}>
        <SkeletonBox style={{ width: 169, height: 15, borderRadius: radius.rFull, backgroundColor: withAlpha(colors.skeletonBox, 0.6) }} />
        <SkeletonBox style={{ width: 44, height: 15, borderRadius: radius.rFull, backgroundColor: withAlpha(colors.skeletonBox, 0.6) }} />
      </View>
      {[0, 1].map((i) => (
        <View key={i} style={styles.skelNewsCard}>
          <SkeletonBox style={styles.skelNewsThumbnail} />
          <View style={styles.skelNewsTextBlock}>
            <SkeletonBox style={[styles.skelBar, { width: '80%' }]} />
            <SkeletonBox style={[styles.skelBar, { width: '55%', marginTop: spacing.sp8 }]} />
          </View>
        </View>
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
  isScrolled: boolean;
}

function LoadedHeader({
  isOffline,
  topInset,
  lastSyncTime,
  profile,
  isScrolled,
}: LoadedHeaderProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const dateStr = formatLocalDate(new Date());

  const displayName = profile?.firstName ?? '—';
  const displayGpa = profile?.gpa != null ? profile.gpa.toFixed(1) : '--';
  const displayMention = profile?.mention ?? '';
  const displayAttendance = profile?.attendancePercentage != null ? `${profile.attendancePercentage}%` : '--';
  const displayCredits = String(profile?.creditsEarned ?? 0);
  const displayCreditsTotal = profile?.creditsTotal ?? 0;

  const showBadge = false; // TODO: wire to notifications unread count

  return (
    <View style={[
      styles.headerSection,
      { paddingTop: topInset + 2 },
      isScrolled ? elevation.card : (isDark ? styles.headerBorderBottom : null),
    ]}>
      <View style={styles.headerTopRow}>
        <Text style={styles.dateLabel}>{dateStr}</Text>
        <Pressable
          style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.push('/notifications')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={19} color={colors.textPrimary} />
          {showBadge && <View style={styles.bellBadge} />}
        </Pressable>
      </View>
      <Text style={styles.greeting}>
        <Text style={styles.greetingBase}>{t('home.hello')} </Text>
        <Text style={styles.greetingName}>{displayName}</Text>
      </Text>
      {isOffline ? (
        <Text style={styles.subtitleOffline}>
          <Text style={styles.subtitleOfflineNormal}>{t('home.offline_data')} – </Text>
          <Text style={styles.subtitleOfflineTime}>{t('common.last_sync_short', { time: lastSyncTime })}</Text>
        </Text>
      ) : (
        <Text style={styles.subtitle}>{t(getGreeting())}</Text>
      )}
      <View style={styles.divider} />
      <View style={styles.statRow}>
        <StatCard
          label={t('home.stat.gpa')}
          value={displayGpa}
          sub={MENTION_KEY[displayMention] ? t(MENTION_KEY[displayMention]) : displayMention}
          onPress={() => router.push('/(tabs)/grades')}
        />
        <StatCard
          label={t('home.stat.presence')}
          value={displayAttendance}
          sub={t('home.stat.attendance_limit')}
          onPress={() => router.push('/attendance')}
        />
        <StatCard
          label={t('home.stat.credits')}
          value={displayCredits}
          sub={t('home.stat.credits_of', { total: displayCreditsTotal })}
          onPress={() => router.push('/(tabs)/grades')}
        />
      </View>
    </View>
  );
}

function StatCard({ label, value, sub, onPress }: { label: string; value: string; sub: string; onPress?: () => void }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <Pressable
      style={({ pressed }) => [styles.statCard, pressed && { opacity: 0.7 }]}
      onPress={onPress}
      hitSlop={4}
    >
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statSub} numberOfLines={1} ellipsizeMode="tail">{sub}</Text>
    </Pressable>
  );
}

// ─── Simple header (error / empty / loading) ──────────────────────────────────

function SimpleHeader({ topInset, isScrolled }: { topInset: number; isScrolled: boolean }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={[
      styles.simpleHeader,
      { paddingTop: topInset + 2 },
      isScrolled ? elevation.card : (isDark ? styles.headerBorderBottom : null),
    ]}>
      <View style={styles.headerTopRow}>
        <Text style={styles.simpleHeaderTitle}>{t('tabs.home')}</Text>
        <Pressable
          style={({ pressed }) => [styles.bellBtn, pressed && { opacity: 0.7 }]}
          onPress={() => router.push('/notifications')}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="notifications-outline" size={19} color={colors.textPrimary} />
        </Pressable>
      </View>
      <View style={styles.divider} />
    </View>
  );
}

// ─── Session expired modal ────────────────────────────────────────────────────

function SessionExpiredModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.dragHandle} />
        <View style={styles.modalIconCircle}>
          <Ionicons name="key-outline" size={36} color={colors.warning} />
        </View>
        <Text style={styles.modalTitle}>{t('common.session.title')}</Text>
        <Text style={styles.modalBody}>{t('common.session.body')}</Text>
        <Pressable
          style={({ pressed }) => [styles.modalPrimaryBtn, pressed && { backgroundColor: colors.jade600 }]}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.modalPrimaryBtnText}>{t('common.session.login')}</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.modalOutlineBtn, pressed && { backgroundColor: withAlpha(colors.jade400, 0.15) }]}
          onPress={onClose}
        >
          <Text style={styles.modalOutlineBtnText}>{t('common.session.continue_offline')}</Text>
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
  const [isScrolled, setIsScrolled] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const setSelectedCourse = useCourseDetailStore((s) => s.setSelectedCourse);
  const lastSyncAt = useNetworkStore((s) => s.lastSyncAt);
  const lastSyncTime = lastSyncAt
    ? new Date(lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : t('common.never');

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

  // ─── Build subject color map ────────────────────────────────────────────────

  useEffect(() => {
    if (scheduleHook.data) {
      buildSubjectColorMap(scheduleHook.data.map((s) => ({ name: s.subjectName, nameAr: s.subjectNameAr })));
    }
  }, [scheduleHook.data]);

  // ─── Derive today's schedule ────────────────────────────────────────────────

  const todayDow = new Date().getDay();
  const nowMins = new Date().getHours() * 60 + new Date().getMinutes();

  const todayCards = useMemo(() => {
    const entries = scheduleHook.data ?? [];
    return entries
      .filter((s) => s.dayOfWeek === todayDow)
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
      .map((s) => scheduleToCard(s, nowMins, colors, t, lang, isDark));
  }, [scheduleHook.data, todayDow, nowMins, colors, t, lang, isDark]);

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

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    setIsScrolled(e.nativeEvent.contentOffset.y > 0);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      {/* Header — pinned, outside ScrollView */}
      {showSkeleton ? (
        <SkeletonHeader topInset={insets.top} />
      ) : showLoadedHeader ? (
        <LoadedHeader
          isOffline={isOffline}
          topInset={insets.top}
          profile={profileHook.data}
          lastSyncTime={lastSyncTime}
          isScrolled={isScrolled}
        />
      ) : (
        <SimpleHeader topInset={insets.top} isScrolled={isScrolled} />
      )}

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* Body */}
        {showSkeleton && <SkeletonBody />}

        {(homeState === 'loaded' || isOffline) && (
          <View style={styles.bodySection}>
            {/* Agenda section */}
            <View style={[styles.sectionHeadingRow, { marginTop: 18 }]}>
              <Text style={styles.sectionHeading}>{t('home.agenda_section')}</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/schedule')}
                hitSlop={8}
              >
                <Text style={styles.sectionLink}>{t('home.see_all')}</Text>
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
                  courseStatus={item.courseStatus}
                  statusLabel={item.statusLabel}
                  onPress={() => handleAgendaPress(item)}
                />
              ))
            ) : (
              <View style={styles.emptyAgendaCard}>
                <View style={styles.emptyAgendaChip}>
                  <Ionicons name="calendar-outline" size={17} color={colors.jadeText} />
                </View>
                <View>
                  <Text style={styles.emptyAgendaTitle}>
                    {t(isWeekend() ? 'home.agenda.weekend' : 'home.agenda.empty')}
                  </Text>
                  <Text style={styles.emptyAgendaSub}>{t('home.empty.body')}</Text>
                </View>
              </View>
            )}

            {/* News section */}
            <View style={[styles.sectionHeadingRow, { marginTop: 26 }]}>
              <Text style={styles.sectionHeading}>{t('home.news_section')}</Text>
              <Pressable
                onPress={() => router.push('/(tabs)/news')}
                hitSlop={8}
              >
                <Text style={styles.sectionLink}>{t('home.see_all')}</Text>
              </Pressable>
            </View>

            {newsCards.length > 0 ? (
              newsCards.map((article) => (
                <NewsCard
                  key={article.id}
                  title={lang === 'ar' && article.titleAr ? article.titleAr : article.title}
                  category={article.category}
                  imageUrl={article.imageUrl}
                  onPress={() => router.push({ pathname: '/article-reader', params: { id: article.id } })}
                />
              ))
            ) : isOffline ? (
              <View style={styles.newsOfflineCard}>
                <View style={styles.newsOfflineChip}>
                  <Ionicons name="globe-outline" size={17} color={colors.slate} />
                </View>
                <Text style={styles.newsOfflineText}>
                  {t('home.news_offline')}
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
            <Text style={styles.stateTitle}>{t('home.error.title')}</Text>
            <Text style={styles.stateBody}>{t('home.error.body')}</Text>
            <Pressable
              style={({ pressed }) => [styles.retryBtn, pressed && { backgroundColor: colors.jade600 }]}
              onPress={handleRetry}
            >
              <Text style={styles.retryBtnText}>{t('common.retry')}</Text>
            </Pressable>
          </View>
        )}

        {homeState === 'empty' && (
          <View style={styles.centerState}>
            <Text style={styles.palmEmoji}>🌴</Text>
            <Text style={styles.stateTitle}>{t('home.agenda.empty')}</Text>
            <Text style={styles.stateBody}>{t('home.empty.body')}</Text>
          </View>
        )}

        <View style={{ height: 88 + insets.bottom }} />
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
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sp20,
    paddingBottom: spacing.sp16,
  },
  headerBorderBottom: {
    borderBottomWidth: 1,
    borderBottomColor: colors.hair,
  },
  dateLabel: {
    fontSize: 12.5, fontWeight: '700', color: colors.textTertiary,
    fontFamily: fonts.sans, letterSpacing: 1.2, textTransform: 'uppercase',
  },
  greeting: { marginTop: 14 },
  greetingBase: { fontSize: 26, fontWeight: '800', color: colors.textPrimary, fontFamily: fonts.sans, letterSpacing: -0.6 },
  greetingName: { fontSize: 26, fontWeight: '800', color: colors.jade400, fontFamily: fonts.sans, letterSpacing: -0.6 },
  subtitle: { fontSize: 15, fontWeight: '500', color: colors.textSecondary, fontFamily: fonts.sans, marginTop: 3 },
  subtitleOffline: { fontSize: 15, marginTop: 3 },
  subtitleOfflineNormal: { fontSize: 15, color: colors.textSecondary, fontFamily: fonts.sans },
  subtitleOfflineTime: { fontSize: 15, color: colors.warning, fontFamily: fonts.sans },
  divider: { height: 1, backgroundColor: colors.hair, marginTop: 16 },
  statRow: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: spacing.sp16 },
  statCard: {
    flex: 1, backgroundColor: colors.sunken, borderRadius: radius.rXl,
    paddingHorizontal: 14, paddingVertical: 13,
    borderWidth: 1, borderColor: colors.hair,
  },
  statLabel: {
    fontSize: 11.5, fontWeight: '700', color: colors.textTertiary,
    textTransform: 'uppercase', fontFamily: fonts.sans, letterSpacing: 0.4,
  },
  statValue: { fontSize: 26, fontWeight: '800', color: colors.jade400, fontFamily: fonts.sans, marginTop: 4 },
  statSub: { fontSize: 12.5, fontWeight: '500', color: colors.textTertiary, fontFamily: fonts.sans, marginTop: 2 },

  headerTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  bellBtn: {
    width: 38, height: 38, borderRadius: radius.rFull,
    backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center',
    ...elevation.card,
  },
  bellBadge: {
    width: 9, height: 9, borderRadius: radius.rFull,
    backgroundColor: colors.jade400,
    position: 'absolute', top: -1, right: -1,
    borderWidth: 1.5, borderColor: colors.surface,
  },

  simpleHeader: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.sp20,
    paddingBottom: spacing.sp16,
  },
  simpleHeaderTitle: {
    fontSize: 24, fontWeight: '800', color: colors.textPrimary,
    fontFamily: fonts.sans, paddingTop: spacing.sp16, paddingBottom: spacing.sp16,
  },

  bodySection: { backgroundColor: colors.background, paddingHorizontal: spacing.sp16 },
  sectionHeadingRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    marginBottom: spacing.sp12,
  },
  sectionHeading: { fontSize: 18, fontWeight: '800', color: colors.textPrimary, fontFamily: fonts.sans, letterSpacing: -0.3 },
  sectionLink: { fontSize: 14.5, fontWeight: '600', color: colors.jadeText, fontFamily: fonts.sans },

  agendaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.rTile,
    marginBottom: spacing.sp12,
    overflow: 'hidden',
    ...elevation.card,
  },
  agendaRail: {
    position: 'absolute', top: 0, bottom: 0, start: 0, width: 5,
  },
  agendaContent: {
    flex: 1, paddingStart: spacing.sp16, paddingEnd: spacing.sp16,
    paddingTop: spacing.sp12, paddingBottom: spacing.sp12, justifyContent: 'center',
  },
  agendaTime: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, fontFamily: fonts.mono },
  agendaCourse: { fontSize: 16.5, fontWeight: '700', color: colors.textPrimary, fontFamily: fonts.sans, marginTop: spacing.sp2 },
  agendaTeacher: { fontSize: 14, fontWeight: '500', color: colors.textSecondary, fontFamily: fonts.sans },
  pillRow: { flexDirection: 'row', gap: 8, marginTop: 11, alignItems: 'center' },
  locationPill: { backgroundColor: colors.surface2, borderRadius: radius.rFull, paddingHorizontal: 10, paddingVertical: 4 },
  locationPillText: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.sans },
  statusPillActive: { backgroundColor: colors.jadeFaint, borderRadius: radius.rFull, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillActiveText: { fontSize: 13, fontWeight: '600', color: colors.jadeText, fontFamily: fonts.sans },
  statusPillPast: { backgroundColor: colors.slateBg, borderRadius: radius.rFull, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillPastText: { fontSize: 13, fontWeight: '600', color: colors.slate, fontFamily: fonts.sans },
  statusPillExam: { backgroundColor: colors.examBg, borderRadius: radius.rFull, paddingHorizontal: 10, paddingVertical: 4 },
  statusPillExamText: { fontSize: 13, fontWeight: '600', color: colors.exam, fontFamily: fonts.sans },

  emptyAgendaCard: {
    backgroundColor: colors.surface, borderRadius: radius.rTile,
    padding: 18, flexDirection: 'row', alignItems: 'center',
    gap: spacing.sp12, marginBottom: spacing.sp12,
  },
  emptyAgendaChip: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: colors.jadeFaint, alignItems: 'center', justifyContent: 'center',
  },
  emptyAgendaTitle: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, fontFamily: fonts.sans },
  emptyAgendaSub: { fontSize: 13, fontWeight: '400', color: colors.textSecondary, fontFamily: fonts.sans, marginTop: spacing.sp2 },

  newsCard: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.rXl, marginBottom: spacing.sp12,
    padding: spacing.sp12, gap: 13, alignItems: 'center',
    ...elevation.card,
  },
  newsThumbnail: { width: 52, height: 52, borderRadius: 12 },
  newsThumbnailPlaceholder: {
    width: 52, height: 52, borderRadius: 12,
    backgroundColor: colors.surface2, alignItems: 'center', justifyContent: 'center',
  },
  newsText: { flex: 1 },
  newsTitle: { fontSize: 15, fontWeight: '600', color: colors.textPrimary, fontFamily: fonts.sans, lineHeight: 19.5 },
  newsCategoryPill: {
    alignSelf: 'flex-start',
    borderRadius: radius.rFull, paddingHorizontal: spacing.sp8, paddingVertical: spacing.sp2, marginTop: spacing.sp6,
  },
  newsCategoryText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, fontFamily: fonts.sans },

  newsOfflineCard: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: radius.rTile,
    padding: spacing.sp16, gap: spacing.sp12, alignItems: 'center',
    ...elevation.card,
  },
  newsOfflineChip: {
    width: 38, height: 38, borderRadius: 11,
    backgroundColor: colors.slateBg, alignItems: 'center', justifyContent: 'center',
  },
  newsOfflineText: { flex: 1, fontSize: 13, color: colors.textSecondary, fontFamily: fonts.sans },

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
  skelBellCircle: { width: 38, height: 38, borderRadius: radius.rFull, backgroundColor: withAlpha(colors.skeletonBox, 0.6) },
  skelStatCard: {
    flex: 1, height: 80, borderRadius: radius.rXl,
    backgroundColor: colors.sunken, borderWidth: 1, borderColor: colors.hair,
  },
  skelAgendaCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.rTile, marginBottom: spacing.sp12, height: 96, overflow: 'hidden',
    ...elevation.card,
  },
  skelAccent: {
    position: 'absolute', top: 0, bottom: 0, start: 0,
    width: 5, backgroundColor: withAlpha(colors.skeletonBox, 0.6),
  },
  skelAgendaInner: {
    flex: 1, paddingStart: spacing.sp16, paddingEnd: spacing.sp16,
    paddingTop: spacing.sp12, justifyContent: 'center',
  },
  skelNewsCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: radius.rXl,
    marginBottom: spacing.sp12, padding: spacing.sp12, gap: 13,
    ...elevation.card,
  },
  skelNewsThumbnail: { width: 52, height: 52, borderRadius: 12, backgroundColor: withAlpha(colors.skeletonBox, 0.6) },
  skelNewsTextBlock: { flex: 1 },

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
