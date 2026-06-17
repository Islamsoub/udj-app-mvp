import React, { useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, radius, spacing, elevation, withAlpha, sizing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import {
  NotificationItem,
  NotificationItemData,
  NotificationType,
} from '@/components/notifications/NotificationItem';
import { NotificationSkeleton } from '@/components/notifications/NotificationSkeleton';
import { SettingsHeader } from '@/components/settings/SettingsHeader';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  CachedNotification,
} from '@/services/api';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { getCachedNotifications, upsertNotifications, markNotificationReadLocal } from '@/services/db';
import { mapNotificationsToCache } from '@/services/cacheMappers';
import { localTitle, localBody } from '@/utils/i18nName';
import type { TFunction } from 'i18next';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationsState = 'loaded' | 'skeleton' | 'empty' | 'error' | 'offline' | 'session';

type Section = {
  key: string;
  items: NotificationItemData[];
};

// ─── Date grouping helpers ────────────────────────────────────────────────────

function mapNotifType(type: string): NotificationType {
  switch (type.toLowerCase()) {
    case 'grades':     return 'grades';
    case 'schedule':   return 'schedule';
    case 'attendance': return 'attendance';
    case 'news':       return 'news';
    default:           return 'general';
  }
}

function formatTimestamp(date: Date, now: Date, t: TFunction): string {
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return t('notifications.time_just_now');
  if (diffMin < 60) return t('notifications.time_minutes_ago', { count: diffMin });
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return t('notifications.time_hours_ago', { count: diffH });
  if (diffH < 48) return t('notifications.time_yesterday');
  const diffDays = Math.floor(diffH / 24);
  return t('notifications.time_days_ago', { count: diffDays });
}

function groupNotificationsByDate(
  notifications: CachedNotification[],
  lang: string,
  t: TFunction,
): Section[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekAgoStart = new Date(todayStart.getTime() - 7 * 86400000);

  const todayItems: NotificationItemData[] = [];
  const yesterdayItems: NotificationItemData[] = [];
  const thisWeekItems: NotificationItemData[] = [];
  const earlierItems: NotificationItemData[] = [];

  for (const n of notifications) {
    const date = new Date(n.createdAt);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const item: NotificationItemData = {
      id: n.id,
      type: mapNotifType(n.type),
      title: localTitle({ titleFr: n.titleFr, titleAr: n.titleAr }, lang),
      body: localBody({ bodyFr: n.bodyFr, bodyAr: n.bodyAr }, lang),
      timestamp: formatTimestamp(date, now, t),
      isUnread: !n.isRead,
    };

    if (dayStart.getTime() === todayStart.getTime()) {
      todayItems.push(item);
    } else if (dayStart.getTime() === yesterdayStart.getTime()) {
      yesterdayItems.push(item);
    } else if (dayStart.getTime() >= weekAgoStart.getTime()) {
      thisWeekItems.push(item);
    } else {
      earlierItems.push(item);
    }
  }

  const sections: Section[] = [];
  if (todayItems.length > 0) sections.push({ key: 'today', items: todayItems });
  if (yesterdayItems.length > 0) sections.push({ key: 'yesterday', items: yesterdayItems });
  if (thisWeekItems.length > 0) sections.push({ key: 'thisWeek', items: thisWeekItems });
  if (earlierItems.length > 0) sections.push({ key: 'earlier', items: earlierItems });
  return sections;
}

// ─── DEV switcher ─────────────────────────────────────────────────────────────

const ALL_STATES: NotificationsState[] = [
  'loaded', 'skeleton', 'empty', 'error', 'offline', 'session',
];

const STATE_LABELS: Record<NotificationsState, string> = {
  loaded:   'Loaded',
  skeleton: 'Skeleton',
  empty:    'Empty',
  error:    'Error',
  offline:  'Offline',
  session:  'Session',
};

const SECTION_LABEL_KEYS: Record<string, string> = {
  today:     'notifications.today',
  yesterday: 'notifications.yesterday',
  thisWeek:  'notifications.thisWeek',
  earlier:   'notifications.group_earlier',
};

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  labelKey,
  onMarkAll,
  isOffline,
  isFirst,
}: {
  labelKey: string;
  onMarkAll?: () => void;
  isOffline?: boolean;
  isFirst?: boolean;
}) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <View style={[styles.sectionBand, isFirst ? styles.sectionBandFirst : styles.sectionBandLater]}>
      <Text style={styles.sectionLabel}>{t(labelKey)}</Text>
      {onMarkAll != null && (
        <Pressable
          onPress={onMarkAll}
          disabled={isOffline}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={({ pressed }) => [
            styles.markAllBtn,
            !isOffline && pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 6 },
          ]}
        >
          <Text style={[styles.markAllText, isOffline && styles.markAllTextDisabled]}>
            {t('notifications.markAllRead')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Loaded content ───────────────────────────────────────────────────────────

type LoadedContentProps = {
  sections: Section[];
  onMarkAll: () => void;
  isOffline: boolean;
  onItemPress: (item: NotificationItemData) => void;
  refreshing: boolean;
  onRefresh: () => void;
};

function LoadedContent({ sections, onMarkAll, isOffline, onItemPress, refreshing, onRefresh }: LoadedContentProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.jade400}
          colors={[colors.jade400]}
          progressBackgroundColor={colors.surface}
        />
      }
    >
      {sections.map((section, index) => (
        <View key={section.key}>
          <SectionHeader
            labelKey={SECTION_LABEL_KEYS[section.key]}
            onMarkAll={index === 0 ? onMarkAll : undefined}
            isOffline={isOffline}
            isFirst={index === 0}
          />
          <View style={styles.card}>
            {section.items.map((item, itemIndex) => (
              <NotificationItem
                key={item.id}
                item={item}
                onPress={() => onItemPress(item)}
                isLast={itemIndex === section.items.length - 1}
              />
            ))}
          </View>
        </View>
      ))}
      <View style={{ height: spacing.sp64 }} />
    </ScrollView>
  );
}

// ─── Empty body ───────────────────────────────────────────────────────────────

function EmptyBody() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <View style={styles.centerBody}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="notifications-outline" size={28} color={colors.jadeText} />
      </View>
      <Text style={styles.stateTitle}>{t('notifications.emptyTitle')}</Text>
      <Text style={styles.stateBody}>{t('notifications.emptyBody')}</Text>
    </View>
  );
}

// ─── Error body ───────────────────────────────────────────────────────────────

function ErrorBody({ onRetry }: { onRetry: () => void }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <View style={styles.centerBody}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="warning" size={48} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>{t('notifications.errorTitle')}</Text>
      <Text style={styles.stateBody}>{t('notifications.errorBody')}</Text>
      <Pressable
        style={({ pressed }) => [styles.retryBtn, pressed && { backgroundColor: colors.jade600 }]}
        onPress={onRetry}
      >
        <Text style={styles.retryBtnText}>{t('notifications.retry')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, i18n } = useTranslation();
  const lang = i18n.language;
  const [devState, setDevState] = useState<NotificationsState | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [refreshing, setRefreshing] = useState(false);

  // ─── Offline query ──────────────────────────────────────────────────────────

  const hook = useOfflineQuery<CachedNotification[]>({
    cacheKey: 'notifications',
    getCached: async () => {
      const cached = await getCachedNotifications();
      return cached.length > 0 ? cached : null;
    },
    fetchFresh: async () => {
      const res = await getNotifications();
      return mapNotificationsToCache(res.notifications);
    },
    updateCache: (data) => upsertNotifications(data),
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await hook.refetch();
    setRefreshing(false);
  }, [hook]);

  // ─── Derive grouped sections (with optimistic read overlay) ─────────────────

  const sections = useMemo(() => {
    const data = (hook.data ?? []).map((n) =>
      readIds.has(n.id) ? { ...n, isRead: true } : n,
    );
    return groupNotificationsByDate(data, lang, t);
  }, [hook.data, readIds, lang, t]);

  // ─── Derive screen state ────────────────────────────────────────────────────

  const hookState: NotificationsState = useMemo(() => {
    if (hook.isLoading && !hook.data) return 'skeleton';
    if (hook.isOffline && hook.data) return 'offline';
    if (hook.data) return sections.length === 0 && !hook.isStale ? 'empty' : 'loaded';
    if (hook.error) return 'error';
    return 'skeleton';
  }, [hook.isLoading, hook.data, hook.isOffline, hook.error, hook.isStale, sections.length]);

  const screenState = devState ?? hookState;

  const handleItemPress = useCallback((item: NotificationItemData) => {
    if (item.isUnread) {
      setReadIds((prev) => new Set(prev).add(item.id));
      markNotificationRead(item.id).catch(() => {});
      markNotificationReadLocal(item.id).catch(() => {});
    }
    switch (item.type) {
      case 'grades':
        router.push('/(tabs)/grades');
        break;
      case 'schedule':
        router.push('/(tabs)/schedule');
        break;
      case 'attendance':
        router.push('/attendance');
        break;
      case 'news':
        router.push('/(tabs)/news');
        break;
      case 'general':
      default:
        break;
    }
  }, [router]);

  const handleMarkAll = useCallback(async () => {
    const prevReadIds = readIds;
    const allIds = new Set((hook.data ?? []).map((n) => n.id));
    setReadIds(allIds);
    try {
      await markAllNotificationsRead();
      hook.refetch();
    } catch {
      setReadIds(prevReadIds);
    }
  }, [hook, readIds]);

  const showContent =
    screenState === 'loaded' ||
    screenState === 'offline' ||
    screenState === 'session';

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <SettingsHeader
        topInset={insets.top}
        onBack={() => router.back()}
        title={t('notifications.title')}
      />

      <OfflineBanner />

      <View style={styles.content}>
        {screenState === 'skeleton' && <NotificationSkeleton />}
        {showContent && (
          <LoadedContent
            sections={sections}
            onMarkAll={handleMarkAll}
            isOffline={hook.isOffline}
            onItemPress={handleItemPress}
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        )}
        {screenState === 'empty' && <EmptyBody />}
        {screenState === 'error' && (
          <ErrorBody onRetry={() => hook.refetch()} />
        )}
      </View>

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
  content: {
    flex: 1,
  },

  // ── Section band
  sectionBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.sp20,
  },
  sectionBandFirst: {
    marginTop: spacing.sp2,
    marginBottom: spacing.sp8,
  },
  sectionBandLater: {
    marginTop: spacing.sp20,
    marginBottom: spacing.sp8,
  },
  sectionLabel: {
    fontSize: fz(12.5),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  markAllBtn: {
    height: sizing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllText: {
    fontSize: fz(14.5),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.jadeText,
  },
  markAllTextDisabled: {
    color: colors.textTertiary,
  },

  // ── Group card
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.rXl,
    ...elevation.card,
    marginHorizontal: spacing.sp16,
    overflow: 'hidden',
  },

  // ── Scroll
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    backgroundColor: colors.background,
  },

  // ── Center states (empty / error)
  centerBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp32,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.rFull,
    backgroundColor: colors.jadeFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: fz(16),
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
    lineHeight: fz(22),
    marginTop: spacing.sp8,
  },
  retryBtn: {
    width: 200,
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp24,
  },
  retryBtnText: {
    fontSize: fz(16),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
