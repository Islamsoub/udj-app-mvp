import React, { useState } from 'react';
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
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { NotificationItem, NotificationItemData } from '@/components/notifications/NotificationItem';
import { NotificationSkeleton } from '@/components/notifications/NotificationSkeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

type NotificationsState = 'loaded' | 'skeleton' | 'empty' | 'error' | 'offline' | 'session';

// ─── Mock data ────────────────────────────────────────────────────────────────

type Section = {
  key: string;
  items: NotificationItemData[];
};

const MOCK_SECTIONS: Section[] = [
  {
    key: 'today',
    items: [
      {
        id: '1',
        type: 'grades',
        title: 'Vos notes de Mathématiques Générales L2 sont disponibles',
        body: 'Consultez votre relevé pour le détail des évaluations du semestre.',
        timestamp: 'Il y a 12 min',
        isUnread: true,
      },
      {
        id: '2',
        type: 'schedule',
        title: 'Cours dans 15 minutes — Amphi A1',
        body: 'Algorithmique avancée avec Pr. Hassan Robleh.',
        timestamp: 'Il y a 1 h',
        isUnread: true,
      },
    ],
  },
  {
    key: 'yesterday',
    items: [
      {
        id: '3',
        type: 'attendance',
        title: 'Présence Physique Quantique à 72% — sous le seuil',
        body: "Vous risquez d'être déclaré non-assidu. Justifiez vos absences.",
        timestamp: 'Hier, 14:32',
        isUnread: false,
      },
      {
        id: '4',
        type: 'general',
        title: '3 nouvelles notifications',
        body: "Mises à jour d'emploi du temps et nouvelles publications.",
        timestamp: 'Hier, 09:15',
        isUnread: false,
      },
    ],
  },
  {
    key: 'thisWeek',
    items: [
      {
        id: '5',
        type: 'schedule',
        title: 'Examen final déplacé au 18 juin',
        body: 'Statistiques L2 — nouvelle salle : Amphi C103.',
        timestamp: 'Lundi 8 mai',
        isUnread: false,
      },
    ],
  },
];

const SECTION_LABEL_KEYS: Record<string, string> = {
  today:     'notifications.today',
  yesterday: 'notifications.yesterday',
  thisWeek:  'notifications.thisWeek',
};

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

// ─── Header ───────────────────────────────────────────────────────────────────

type HeaderProps = {
  topInset: number;
  isSkeleton: boolean;
  onBack: () => void;
  onMarkAll: () => void;
};

function Header({ topInset, isSkeleton, onBack, onMarkAll }: HeaderProps) {
  const { t } = useTranslation();

  return (
    <View style={[styles.headerContainer, { paddingTop: topInset }]}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={onBack}
          style={styles.backBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>

        <Text style={styles.headerTitle} numberOfLines={1}>
          {t('notifications.title')}
        </Text>

        {isSkeleton ? (
          <SkeletonBox width={110} height={14} borderRadius={4} />
        ) : (
          <Pressable
            onPress={onMarkAll}
            style={styles.markAllBtn}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.markAllText}>{t('notifications.markAllRead')}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Offline banner ───────────────────────────────────────────────────────────

function NotificationsOfflineBanner() {
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

function SectionHeader({ labelKey }: { labelKey: string }) {
  const { t } = useTranslation();
  return (
    <View style={styles.sectionBand}>
      <Text style={styles.sectionLabel}>{t(labelKey)}</Text>
    </View>
  );
}

// ─── Loaded content ───────────────────────────────────────────────────────────

function LoadedContent() {
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {MOCK_SECTIONS.map((section) => (
        <View key={section.key}>
          <SectionHeader labelKey={SECTION_LABEL_KEYS[section.key]} />
          {section.items.map((item) => (
            <NotificationItem
              key={item.id}
              item={item}
              onPress={() => console.log('[NOTIFICATIONS] pressed', item.id)}
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
  const { t } = useTranslation();
  return (
    <View style={styles.centerBody}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="warning" size={48} color={colors.danger} />
      </View>
      <Text style={styles.stateTitle}>{t('notifications.errorTitle')}</Text>
      <Text style={styles.stateBody}>{t('notifications.errorBody')}</Text>
      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('notifications.retry')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [screenState, setScreenState] = useState<NotificationsState>('loaded');

  const showContent =
    screenState === 'loaded' ||
    screenState === 'offline' ||
    screenState === 'session';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <Header
        topInset={insets.top}
        isSkeleton={screenState === 'skeleton'}
        onBack={() => router.back()}
        onMarkAll={() => console.log('[NOTIFICATIONS] mark all read')}
      />

      <View style={styles.content}>
        {screenState === 'offline' && <NotificationsOfflineBanner />}

        {screenState === 'skeleton' && <NotificationSkeleton />}
        {showContent && <LoadedContent />}
        {screenState === 'empty' && <EmptyBody />}
        {screenState === 'error' && (
          <ErrorBody onRetry={() => console.log('[NOTIFICATIONS] retry')} />
        )}
      </View>

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
    width: 44,
    height: 44,
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
    height: 44,
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
    backgroundColor: colors.background,
    paddingVertical: spacing.sp12,
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
