import React, { useState, useCallback, useMemo } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { fonts, radius, spacing, withAlpha, sizing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import {
  NotificationItem,
  NotificationItemData,
  NotificationType,
} from '@/components/notifications/NotificationItem';
import { NotificationSkeleton } from '@/components/notifications/NotificationSkeleton';
import {
  getNotifications,
  markAllNotificationsRead,
  CachedNotification,
} from '@/services/api';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { getCachedNotifications, upsertNotifications } from '@/services/db';
import { mapNotificationsToCache } from '@/services/cacheMappers';
import { localTitle, localBody } from '@/utils/i18nName';

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

function formatTimestamp(date: Date, now: Date): string {
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `Il y a ${diffH} h`;
  return date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
  });
}

function groupNotificationsByDate(notifications: CachedNotification[], lang: string): Section[] {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterdayStart = new Date(todayStart.getTime() - 86400000);
  const weekAgoStart = new Date(todayStart.getTime() - 7 * 86400000);

  const todayItems: NotificationItemData[] = [];
  const yesterdayItems: NotificationItemData[] = [];
  const thisWeekItems: NotificationItemData[] = [];

  for (const n of notifications) {
    const date = new Date(n.createdAt);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const item: NotificationItemData = {
      id: n.id,
      type: mapNotifType(n.type),
      title: localTitle({ titleFr: n.titleFr, titleAr: n.titleAr }, lang),
      body: localBody({ bodyFr: n.bodyFr, bodyAr: n.bodyAr }, lang),
      timestamp: formatTimestamp(date, now),
      isUnread: !n.isRead,
      referenceId: (n as CachedNotification & { referenceId?: string }).referenceId,
    };

    if (dayStart.getTime() === todayStart.getTime()) {
      todayItems.push(item);
    } else if (dayStart.getTime() === yesterdayStart.getTime()) {
      yesterdayItems.push(item);
    } else if (dayStart.getTime() >= weekAgoStart.getTime()) {
      thisWeekItems.push(item);
    }
  }

  const sections: Section[] = [];
  if (todayItems.length > 0) sections.push({ key: 'today', items: todayItems });
  if (yesterdayItems.length > 0) sections.push({ key: 'yesterday', items: yesterdayItems });
  if (thisWeekItems.length > 0) sections.push({ key: 'thisWeek', items: thisWeekItems });
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
};

// ─── Header ───────────────────────────────────────────────────────────────────

type HeaderProps = {
  topInset: number;
  onBack: () => void;
};

function Header({ topInset, onBack }: HeaderProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={[styles.headerContainer, { paddingTop: topInset }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={onBack}
          style={({ pressed }) => [styles.backBtn, pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.15), borderRadius: 999 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('notifications.title')}
        </Text>
      </View>
    </View>
  );
}

// ─── Offline banner ───────────────────────────────────────────────────────────

function NotificationsOfflineBanner() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <View style={styles.offlineBanner}>
      <View style={styles.offlineDot} />
      <Text style={styles.offlineBannerText}>
        {t('common.offlineBanner', { time: 'hier 14:30' })}
      </Text>
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ labelKey, onMarkAll }: { labelKey: string; onMarkAll?: () => void }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <View style={styles.sectionBand}>
      <Text style={styles.sectionLabel}>{t(labelKey)}</Text>
      {onMarkAll != null && (
        <Pressable
          onPress={onMarkAll}
          style={({ pressed }) => [styles.markAllBtn, pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 6 }]}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
        </Pressable>
      )}
    </View>
  );
}

// ─── Loaded content ───────────────────────────────────────────────────────────

type LoadedContentProps = {
  sections: Section[];
  onMarkAll: () => void;
  onItemPress: (item: NotificationItemData) => void;
};

function LoadedContent({ sections, onMarkAll, onItemPress }: LoadedContentProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {sections.map((section, index) => (
        <View key={section.key}>
          <SectionHeader
            labelKey={SECTION_LABEL_KEYS[section.key]}
            onMarkAll={index === 0 ? onMarkAll : undefined}
          />
          {section.items.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onPress={() => onItemPress(item)}
            />
          ))}
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
        <Ionicons name="notifications-outline" size={48} color={colors.jade400} />
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
      <Pressable style={({ pressed }) => [styles.retryBtn, pressed && { backgroundColor: colors.jade600 }]} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('notifications.retry')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [devState, setDevState] = useState<NotificationsState | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

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

  // ─── Derive grouped sections (with optimistic read overlay) ─────────────────

  const sections = useMemo(() => {
    const data = (hook.data ?? []).map((n) =>
      readIds.has(n.id) ? { ...n, isRead: true } : n,
    );
    return groupNotificationsByDate(data, lang);
  }, [hook.data, readIds, lang]);

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
        if (item.referenceId) {
          router.push({ pathname: '/article-reader', params: { id: item.referenceId } });
        } else {
          router.push('/(tabs)/news');
        }
        break;
      case 'general':
      default:
        break;
    }
  }, [router]);

  const handleMarkAll = useCallback(async () => {
    if (hook.isOffline) return;
    try {
      await markAllNotificationsRead();
      setReadIds(new Set());
      hook.refetch();
    } catch {
      // ignore — UI stays as-is
    }
  }, [hook]);

  const showContent =
    screenState === 'loaded' ||
    screenState === 'offline' ||
    screenState === 'session';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <Header
        topInset={insets.top}
        onBack={() => router.back()}
      />

      <View style={styles.content}>
        {screenState === 'offline' && <NotificationsOfflineBanner />}

        {screenState === 'skeleton' && <NotificationSkeleton />}
        {showContent && <LoadedContent sections={sections} onMarkAll={handleMarkAll} onItemPress={handleItemPress} />}
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

  // ── Header
  headerContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
    height: 56,
  },
  backBtn: {
    width: sizing.touchTarget,
    height: sizing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
  },
  markAllBtn: {
    height: sizing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markAllText: {
    fontSize: 14,
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.jade400,
  },

  // ── Offline banner
  offlineBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    borderBottomWidth: 1,
    borderBottomColor: '#FBD38D',
    paddingVertical: spacing.sp12,
    paddingHorizontal: spacing.sp16,
  },
  offlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F97316',
    marginEnd: spacing.sp8,
  },
  offlineBannerText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: '#9A3412',
    flex: 1,
  },

  // ── Section band
  sectionBand: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.background,
    paddingVertical: spacing.sp8,
    paddingHorizontal: spacing.sp16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
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
    width: 120,
    height: 120,
    borderRadius: 216,
    backgroundColor: '#E8F5F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorIconCircle: {
    width: 120,
    height: 120,
    borderRadius: 216,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stateTitle: {
    fontSize: 16,
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
    lineHeight: 22,
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
    fontSize: 16,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
