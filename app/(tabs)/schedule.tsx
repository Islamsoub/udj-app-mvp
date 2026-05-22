import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { ScheduleHeader } from '@/components/schedule/ScheduleHeader';
import { TimelineRow, PauseEntry } from '@/components/schedule/TimelineRow';
import { CacheBanner } from '@/components/schedule/CacheBanner';
import { OfflineCourseCard } from '@/components/schedule/OfflineCourseCard';
import { Course } from '@/components/schedule/CourseCard';
import { CourseDetailSheet } from '@/components/schedule/CourseDetailSheet';
import { useCourseDetailStore, ExtendedCourse } from '@/stores/courseDetailStore';
import { CourseStatus } from '@/components/schedule/StatusPill';
import { getSchedule, Schedule } from '@/services/api';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { getFullSemesterSchedule, upsertSchedules } from '@/services/db';
import { mapScheduleToCache } from '@/services/cacheMappers';
import { useAuthStore } from '@/stores/authStore';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

// ─── Convert flat Schedule cache → ScheduleEntry ──────────────────────────────

import type { ScheduleEntry } from '@/services/api';

function scheduleToEntry(s: Schedule): ScheduleEntry {
  return {
    id: s.id,
    dayOfWeek: s.dayOfWeek,
    startTime: s.startTime,
    endTime: s.endTime,
    room: s.room,
    professorName: s.lecturerName,
    type: s.isExam ? 'EXAM' : 'CM',
    subject: {
      id: s.subjectCode,
      nameFr: s.subjectName,
      nameAr: s.subjectName,
      code: s.subjectCode,
      coefficient: s.coefficient,
    },
  };
}

// ─── API helpers ──────────────────────────────────────────────────────────────

function computeStatus(startTime: string, endTime: string): CourseStatus {
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = startTime.split(':').map(Number);
  const [eh, em] = endTime.split(':').map(Number);
  if (nowMinutes >= eh * 60 + em) return 'past';
  if (nowMinutes >= sh * 60 + sm) return 'active';
  return 'upcoming';
}

function buildTimelineEntries(
  entries: ScheduleEntry[],
): (ExtendedCourse | PauseEntry)[] {
  const sorted = [...entries].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );
  const result: (ExtendedCourse | PauseEntry)[] = [];

  sorted.forEach((entry, i) => {
    result.push({
      id: entry.id,
      subject: entry.subject.nameFr,
      teacher: entry.professorName,
      room: entry.room,
      start: entry.startTime,
      end: entry.endTime,
      status: computeStatus(entry.startTime, entry.endTime),
      code: entry.subject.code,
      coefficient: entry.subject.coefficient,
    });

    const next = sorted[i + 1];
    if (next) {
      const [eh, em] = entry.endTime.split(':').map(Number);
      const [nh, nm] = next.startTime.split(':').map(Number);
      const gapMinutes = nh * 60 + nm - (eh * 60 + em);
      if (gapMinutes >= 60) {
        result.push({
          type: 'pause',
          time: entry.endTime,
          durationHours: Math.round(gapMinutes / 60),
        });
      }
    }
  });

  return result;
}

// ─── Skeleton: header ─────────────────────────────────────────────────────────

function SkeletonScheduleHeader({ topInset }: { topInset: number }) {
  return (
    <View style={[skelStyles.header, { paddingTop: topInset + spacing.sp16 }]}>
      {/* Title row */}
      <View style={skelStyles.titleRow}>
        <SkeletonBox width={169} height={15} borderRadius={8} />
        <View style={skelStyles.actions}>
          <View style={skelStyles.circle} />
          <View style={skelStyles.circle} />
        </View>
      </View>

      {/* Day strip */}
      <View style={skelStyles.dayStrip}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <View key={i} style={skelStyles.dayCell}>
            <SkeletonBox width={24} height={8} borderRadius={4} />
            <SkeletonBox width={40} height={40} borderRadius={20} />
          </View>
        ))}
      </View>

      {/* Subtitle shimmer */}
      <SkeletonBox
        width={142}
        height={15}
        borderRadius={8}
        style={{ marginStart: spacing.sp16, marginTop: spacing.sp16 }}
      />

      {/* Bottom divider shimmer */}
      <View style={skelStyles.dividerSkel} />
    </View>
  );
}

const skelStyles = StyleSheet.create({
  header: {
    backgroundColor: colors.surface,
    paddingBottom: spacing.sp16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sp16,
    paddingBottom: spacing.sp16,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sp8,
  },
  circle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.border,
  },
  dayStrip: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sp16,
    gap: spacing.sp4,
    height: 56,
    alignItems: 'center',
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.sp4,
  },
  dividerSkel: {
    height: 1,
    backgroundColor: colors.border,
    marginTop: spacing.sp12,
  },
});

// ─── Skeleton: body ───────────────────────────────────────────────────────────

function SkeletonScheduleBody() {
  return (
    <View style={styles.timelineBody}>
      {[0, 1, 2, 3].map((i) => (
        <View key={i} style={styles.skelRow}>
          {/* Gutter */}
          <View style={styles.skelGutter}>
            <SkeletonBox width={40} height={12} borderRadius={6} />
          </View>
          {/* Connector */}
          <View style={styles.skelConnector}>
            <View style={styles.skelDot} />
          </View>
          {/* Card placeholder */}
          <View style={styles.skelCardWrapper}>
            <SkeletonBox width={180} height={14} borderRadius={6} />
            <SkeletonBox
              width={140}
              height={10}
              borderRadius={6}
              style={{ marginTop: spacing.sp8 }}
            />
            <SkeletonBox
              width={80}
              height={10}
              borderRadius={6}
              style={{ marginTop: spacing.sp8 }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────────────────────

interface EmptyStateProps {
  onExport: () => void;
  onNextWeek: () => void;
}

function EmptyStateBody({ onExport, onNextWeek }: EmptyStateProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.centerBody, { paddingTop: 40 }]}>
      <Text style={styles.palmEmoji}>🌴</Text>
      <Text style={styles.stateTitle}>{t('schedule.empty.title')}</Text>
      <Text style={styles.stateBody}>{t('schedule.empty.body')}</Text>

      {/* Next course card — 250×71 per Figma */}
      <View style={styles.nextCourseCard}>
        <Text style={styles.nextCourseText}>
          {`${t('schedule.empty.next_course_label')}\n${t('schedule.empty.next_course_time')}\n${t('schedule.empty.next_course_name')}`}
        </Text>
      </View>

      {/* Action buttons — fixed widths 139+151 per Figma */}
      <View style={styles.emptyBtnRow}>
        <Pressable style={[styles.emptyBtnPrimary]} onPress={onExport}>
          <Text style={styles.emptyBtnPrimaryText}>{t('schedule.empty.export')}</Text>
        </Pressable>
        <Pressable style={[styles.emptyBtnOutline]} onPress={onNextWeek}>
          <Text style={styles.emptyBtnOutlineText}>{t('schedule.empty.next_week')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Error state ──────────────────────────────────────────────────────────────

interface ErrorStateProps {
  onRetry: () => void;
  onViewCache: () => void;
}

function ErrorStateBody({ onRetry, onViewCache }: ErrorStateProps) {
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
      <Text style={styles.stateTitle}>{t('schedule.error.title')}</Text>
      <Text style={styles.stateBody}>{t('schedule.error.body')}</Text>

      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('schedule.error.retry')}</Text>
      </Pressable>

      <Pressable onPress={onViewCache} hitSlop={8}>
        <Text style={styles.viewCacheLink}>{t('schedule.error.view_cache')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Loaded timeline body ──────────────────────────────────────────────────────

interface LoadedTimelineProps {
  entries: (ExtendedCourse | PauseEntry)[];
  onCoursePress: (course: ExtendedCourse) => void;
}

function LoadedTimeline({ entries, onCoursePress }: LoadedTimelineProps) {
  return (
    <View style={styles.timelineBody}>
      {entries.map((entry, i) => {
        const isLast = i === entries.length - 1;
        if ('type' in entry) {
          return (
            <TimelineRow key={`pause-${i}`} entry={entry} isLast={isLast} />
          );
        }
        return (
          <TimelineRow key={entry.id} entry={entry} isLast={isLast} onPress={() => onCoursePress(entry)} />
        );
      })}
    </View>
  );
}

// ─── Offline body ──────────────────────────────────────────────────────────────

function OfflineBody({ courses }: { courses: Course[] }) {
  return (
    <View style={styles.offlineBody}>
      <CacheBanner />
      {courses.length > 0 ? (
        courses.map((course) => (
          <OfflineCourseCard key={course.id} course={course} />
        ))
      ) : (
        <View style={styles.offlineEmpty}>
          <Text style={styles.offlineEmptyText}>Aucun cours en cache pour ce jour</Text>
        </View>
      )}
    </View>
  );
}

// ─── DEV switcher ─────────────────────────────────────────────────────────────

const ALL_STATES: ScheduleState[] = ['skeleton', 'loaded', 'offline', 'empty', 'error', 'session'];
const STATE_LABELS: Record<ScheduleState, string> = {
  skeleton: 'loading',
  loaded:   'loaded',
  offline:  'offline',
  empty:    'empty',
  error:    'error',
  session:  'session',
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const [devState, setDevState] = useState<ScheduleState | null>(null);
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay());
  const [courseDetailVisible, setCourseDetailVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const setSelectedCourse = useCourseDetailStore((s) => s.setSelectedCourse);
  const studentId = useAuthStore.getState().student?.id ?? 'me';

  // ─── Offline query ──────────────────────────────────────────────────────────

  const hook = useOfflineQuery<Schedule[]>({
    cacheKey: 'schedule',
    getCached: () => getFullSemesterSchedule(),
    fetchFresh: async () => {
      const res = await getSchedule();
      return mapScheduleToCache(res.entries, studentId, res.semesterId);
    },
    updateCache: (data) => upsertSchedules(data),
  });

  // ─── Derive entries ─────────────────────────────────────────────────────────

  const allEntries: ScheduleEntry[] = useMemo(
    () => (hook.data ?? []).map(scheduleToEntry),
    [hook.data],
  );

  const dayEntries = useMemo(
    () => buildTimelineEntries(allEntries.filter((e) => e.dayOfWeek === selectedDay)),
    [allEntries, selectedDay],
  );

  const offlineDayCourses: Course[] = useMemo(
    () =>
      (hook.data ?? [])
        .filter((s) => s.dayOfWeek === selectedDay)
        .sort((a, b) => a.startTime.localeCompare(b.startTime))
        .map((s) => ({
          id: s.id,
          subject: s.subjectName,
          teacher: s.lecturerName,
          room: s.room,
          start: s.startTime,
          end: s.endTime,
          status: computeStatus(s.startTime, s.endTime),
        })),
    [hook.data, selectedDay],
  );

  // ─── Derive screen state ────────────────────────────────────────────────────

  const hookState: ScheduleState = useMemo(() => {
    if (hook.isLoading && !hook.data) return 'skeleton';
    if (hook.isOffline && hook.data) return 'offline';
    if (hook.data) return dayEntries.length === 0 && !hook.isStale ? 'empty' : 'loaded';
    if (hook.error) return 'error';
    return 'skeleton';
  }, [hook.isLoading, hook.data, hook.isOffline, hook.error, hook.isStale, dayEntries.length]);

  const schedState = devState ?? hookState;

  const handleCoursePress = (course: ExtendedCourse) => {
    setSelectedCourse(course);
    setCourseDetailVisible(true);
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {schedState === 'skeleton' ? (
          <SkeletonScheduleHeader topInset={insets.top} />
        ) : (
          <ScheduleHeader
            topInset={insets.top}
            selectedDayIndex={selectedDay}
            onDaySelect={setSelectedDay}
          />
        )}

        {schedState === 'skeleton' && <SkeletonScheduleBody />}

        {(schedState === 'loaded' || schedState === 'session') && (
          <LoadedTimeline entries={dayEntries} onCoursePress={handleCoursePress} />
        )}

        {schedState === 'offline' && <OfflineBody courses={offlineDayCourses} />}

        {schedState === 'empty' && (
          <EmptyStateBody
            onExport={() => console.log('[ICAL] export triggered')}
            onNextWeek={() => {}}
          />
        )}

        {schedState === 'error' && (
          <ErrorStateBody
            onRetry={() => hook.refetch()}
            onViewCache={() => setDevState('offline')}
          />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <SessionExpiredModal
        visible={schedState === 'session'}
        onContinueOffline={() => setDevState('offline')}
      />

      <CourseDetailSheet
        visible={courseDetailVisible}
        onClose={() => setCourseDetailVisible(false)}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={schedState}
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

  // ── Timeline body (loaded & skeleton)
  timelineBody: {
    paddingTop: spacing.sp16,
  },

  // ── Skeleton row pieces
  skelRow: {
    flexDirection: 'row',
    marginBottom: 24,
    alignItems: 'flex-start',
  },
  skelGutter: {
    width: 44,
    paddingTop: 6,
    alignItems: 'flex-end',
    paddingEnd: spacing.sp8,
  },
  skelConnector: {
    width: 20,
    alignItems: 'center',
    paddingTop: 6,
  },
  skelDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.border,
  },
  skelCardWrapper: {
    flex: 1,
    minHeight: 87,
    borderRadius: radius.rLg,
    backgroundColor: colors.surface,
    padding: spacing.sp12,
    justifyContent: 'center',
    gap: 0,
  },

  // ── Offline body — 14px gap between cache banner and cards per Figma
  offlineBody: {
    paddingHorizontal: spacing.sp16,
    paddingTop: 14,
    gap: 14,
  },
  offlineEmpty: {
    padding: spacing.sp16,
    alignItems: 'center',
  },
  offlineEmptyText: {
    fontSize: 14,
    color: colors.textSecondary,
    fontFamily: fonts.sans,
  },

  // ── Center states (empty / error) — paddingTop set per-state in component
  centerBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
  },
  palmEmoji: {
    fontSize: 80,
    textAlign: 'center',
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

  // ── Empty: next course card — 250px wide per Figma
  nextCourseCard: {
    width: 250,
    alignSelf: 'center',
    borderRadius: radius.rMd,
    backgroundColor: colors.jade75,
    borderWidth: 1,
    borderColor: colors.jade400,
    paddingTop: 9,
    paddingBottom: 8,
    paddingHorizontal: 38,
    marginTop: 18,
  },
  nextCourseText: {
    fontFamily: fonts.sans,
    fontWeight: '700',
    fontSize: 12,
    color: colors.jade600,
    textAlign: 'center',
    lineHeight: 18,
  },

  // ── Empty: buttons — fixed widths 139+151 per Figma
  emptyBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 39,
  },
  emptyBtnPrimary: {
    width: 139,
    height: 55,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnPrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  emptyBtnOutline: {
    width: 151,
    height: 55,
    borderRadius: radius.rLg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.jade600,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBtnOutlineText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.jade600,
  },

  // ── Error state — 72×72 circle per Figma
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    alignSelf: 'center',
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
  viewCacheLink: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.jade600,
    marginTop: spacing.sp24,
    textAlign: 'center',
  },

});
