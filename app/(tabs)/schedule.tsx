import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { ScheduleHeader } from '@/components/schedule/ScheduleHeader';
import { TimelineRow, DayEntry } from '@/components/schedule/TimelineRow';
import { CacheBanner } from '@/components/schedule/CacheBanner';
import { OfflineCourseCard } from '@/components/schedule/OfflineCourseCard';
import { Course } from '@/components/schedule/CourseCard';

// ─── Types ────────────────────────────────────────────────────────────────────

type ScheduleState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ENTRIES: DayEntry[] = [
  {
    id: '1',
    subject: 'Mathématiques Générales L2',
    teacher: 'Pr. Abdi Hassan',
    room: 'Amphi A1',
    gutter: '07:30',
    start: '08:00',
    end: '10:00',
    status: 'past',
  },
  {
    id: '2',
    subject: 'Mathématiques Générales L2',
    teacher: 'Pr. Abdi Hassan',
    room: 'Amphi A1',
    start: '08:00',
    end: '10:00',
    status: 'active',
  },
  { type: 'pause', time: '10:00', durationHours: 4 },
  {
    id: '3',
    subject: 'Algorithmique et Structures',
    teacher: 'Dr. Fadumo Ali',
    room: 'Labo 3',
    start: '14:00',
    end: '16:00',
    status: 'upcoming',
  },
  {
    id: '4',
    subject: 'Physique Quantique L2',
    teacher: 'Pr. Mohamed Wais',
    room: 'Salle 204',
    start: '16:30',
    end: '18:30',
    status: 'upcoming',
  },
];

const MOCK_OFFLINE_COURSES: Course[] = MOCK_ENTRIES.filter(
  (e): e is Course => !('type' in e),
);

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

// ─── Offline banner ───────────────────────────────────────────────────────────

function ScheduleOfflineBanner({ topInset }: { topInset: number }) {
  const { t } = useTranslation();
  return (
    <View style={[styles.offlineBanner, { paddingTop: topInset + spacing.sp12 }]}>
      <View style={styles.offlineDot} />
      <Text style={styles.offlineBannerText}>{t('schedule.offline.banner')}</Text>
    </View>
  );
}

// ─── Session expired modal ────────────────────────────────────────────────────

interface SessionModalProps {
  onClose: () => void;
  onOffline: () => void;
}

function SessionExpiredModal({ onClose, onOffline }: SessionModalProps) {
  const { t } = useTranslation();
  const router = useRouter();

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalSheet}>
        <View style={styles.dragHandle} />
        <View style={styles.modalIconCircle}>
          <Ionicons name="key-outline" size={36} color={colors.exam} />
        </View>
        <Text style={styles.modalTitle}>{t('schedule.session.title')}</Text>
        <Text style={styles.modalBody}>{t('schedule.session.body')}</Text>
        <Pressable
          style={styles.modalPrimaryBtn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.modalPrimaryBtnText}>{t('schedule.session.login')}</Text>
        </Pressable>
        <Pressable
          style={styles.modalOutlineBtn}
          onPress={() => { onClose(); onOffline(); }}
        >
          <Text style={styles.modalOutlineBtnText}>{t('schedule.session.continue_offline')}</Text>
        </Pressable>
      </View>
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

function LoadedTimeline() {
  return (
    <View style={styles.timelineBody}>
      {MOCK_ENTRIES.map((entry, i) => (
        <TimelineRow
          key={'id' in entry ? entry.id : `pause-${i}`}
          entry={entry}
          isLast={i === MOCK_ENTRIES.length - 1}
        />
      ))}
    </View>
  );
}

// ─── Offline body ──────────────────────────────────────────────────────────────

function OfflineBody() {
  return (
    <View style={styles.offlineBody}>
      <CacheBanner />
      {MOCK_OFFLINE_COURSES.map((course) => (
        <OfflineCourseCard key={course.id} course={course} />
      ))}
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

interface DevSwitcherProps {
  current: ScheduleState;
  onChange: (s: ScheduleState) => void;
}

function DevSwitcher({ current, onChange }: DevSwitcherProps) {
  return (
    <View
      style={styles.devSwitcher}
      onLayout={(e) => console.log('[DEV] switcher layout:', JSON.stringify(e.nativeEvent.layout))}
    >
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.devScroll}>
        {ALL_STATES.map((s) => (
          <Pressable
            key={s}
            style={[styles.devBtn, current === s && styles.devBtnActive]}
            onPress={() => onChange(s)}
          >
            <Text style={[styles.devBtnText, current === s && styles.devBtnTextActive]}>
              {STATE_LABELS[s]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ScheduleScreen() {
  const [schedState, setSchedState] = useState<ScheduleState>('loaded');
  const [selectedDay, setSelectedDay] = useState(() => new Date().getDay());
  const insets = useSafeAreaInsets();

  const showHeader = schedState !== 'skeleton';
  const showOfflineBanner = schedState === 'offline';

  return (
    <View
      style={styles.root}
      onLayout={(e) => console.log('[DEV] root layout:', JSON.stringify(e.nativeEvent.layout))}
    >
      <StatusBar barStyle="dark-content" />

      {showOfflineBanner && <ScheduleOfflineBanner topInset={insets.top} />}

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

        {(schedState === 'loaded' || schedState === 'session') && <LoadedTimeline />}

        {schedState === 'offline' && <OfflineBody />}

        {schedState === 'empty' && (
          <EmptyStateBody
            onExport={() => console.log('[ICAL] export triggered')}
            onNextWeek={() => {}}
          />
        )}

        {schedState === 'error' && (
          <ErrorStateBody
            onRetry={() => console.log('[SCHEDULE] retry triggered')}
            onViewCache={() => setSchedState('offline')}
          />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {schedState === 'session' && (
        <SessionExpiredModal
          onClose={() => setSchedState('loaded')}
          onOffline={() => setSchedState('offline')}
        />
      )}

      {__DEV__ && (
        <DevSwitcher current={schedState} onChange={setSchedState} />
      )}
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

  // ── Offline banner
  offlineBanner: {
    backgroundColor: colors.offlineBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.offline,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
    paddingBottom: spacing.sp12,
    gap: spacing.sp8,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.offline,
  },
  offlineBannerText: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.offline,
    flex: 1,
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

  // ── Session expired modal
  modalOverlay: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    start: 0,
    end: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.surface,
    borderTopStartRadius: radius.r2xl,
    borderTopEndRadius: radius.r2xl,
    padding: spacing.sp24,
    paddingBottom: 40,
  },
  dragHandle: {
    width: 49,
    height: 9,
    borderRadius: spacing.sp8,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.sp24,
  },
  modalIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: 'rgba(139,92,246,0.15)',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp16,
  },
  modalBody: {
    fontSize: 14,
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.sp8,
  },
  modalPrimaryBtn: {
    width: '100%',
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp24,
  },
  modalPrimaryBtnText: {
    fontSize: 15,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  modalOutlineBtn: {
    width: '100%',
    height: 56,
    borderRadius: radius.rLg,
    borderWidth: 1,
    borderColor: colors.jade600,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp12,
  },
  modalOutlineBtnText: {
    fontSize: 15,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.jade400,
  },

  // ── DEV switcher
  devSwitcher: {
    position: 'absolute',
    bottom: 67,
    start: 0,
    end: 0,
  },
  devScroll: {
    paddingHorizontal: spacing.sp8,
    gap: spacing.sp4,
  },
  devBtn: {
    paddingHorizontal: spacing.sp8,
    paddingVertical: spacing.sp4,
    borderRadius: radius.rSm,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  devBtnActive: {
    backgroundColor: colors.jade400,
  },
  devBtnText: {
    fontSize: 11,
    color: colors.surface,
    fontFamily: fonts.sans,
  },
  devBtnTextActive: {
    fontWeight: '700',
  },
});
