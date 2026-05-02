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
import { NewsHeader } from '@/components/news/NewsHeader';
import { FilterRow, FilterKey } from '@/components/news/FilterRow';
import { HeroCard } from '@/components/news/HeroCard';
import { ArticleCard, Article } from '@/components/news/ArticleCard';
import { NewsSkeleton } from '@/components/news/NewsSkeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

type NewsState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

// ─── Mock data ────────────────────────────────────────────────────────────────

const MOCK_ARTICLES: Article[] = [
  {
    id: '0',
    category: 'Scolarite',
    title: 'Calendrier des examens du Semestre 2 – Session juin 2025',
    timestamp: 'Hier a 16H00',
    readTime: '5 min de lecture',
    isHero: true,
  },
  {
    id: '1',
    category: 'Evenement',
    title: 'Cérémonie de remise des diplômes — Promotion 2025',
    timestamp: 'Il y a 2j',
    readTime: '3 min',
  },
  {
    id: '2',
    category: 'Scolarite',
    title: 'Réinscriptions 2025-2026 : modalités et dates limites',
    timestamp: 'Il y a 2j',
    readTime: '3 min',
  },
  {
    id: '3',
    category: 'Sport',
    title: 'Tournoi inter-facultés de football — inscriptions ouvertes',
    timestamp: 'Il y a 2j',
    readTime: '3 min',
  },
];

const HERO_ARTICLE = MOCK_ARTICLES[0];
const LIST_ARTICLES = MOCK_ARTICLES.slice(1);

// ─── News offline banner ──────────────────────────────────────────────────────

function NewsOfflineBanner() {
  const { t } = useTranslation();
  return (
    <View style={styles.offlineBanner}>
      <View style={styles.offlineDot} />
      <Text style={styles.offlineBannerText}>{t('news.offline.banner')}</Text>
    </View>
  );
}

// ─── Saved articles warning (offline body) ────────────────────────────────────

function SavedArticlesBanner() {
  const { t } = useTranslation();
  return (
    <View style={styles.savedBanner}>
      <Text style={styles.savedBannerText}>{t('news.offline.saved_count')}</Text>
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
        <Text style={styles.modalTitle}>{t('news.session.title')}</Text>
        <Text style={styles.modalBody}>{t('news.session.body')}</Text>
        <Pressable
          style={styles.modalPrimaryBtn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Text style={styles.modalPrimaryBtnText}>{t('news.session.login')}</Text>
        </Pressable>
        <Pressable
          style={styles.modalOutlineBtn}
          onPress={() => { onClose(); onOffline(); }}
        >
          <Text style={styles.modalOutlineBtnText}>{t('news.session.continue_offline')}</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Loaded body ──────────────────────────────────────────────────────────────

function LoadedBody() {
  return (
    <View style={styles.loadedBody}>
      <HeroCard article={HERO_ARTICLE} />
      <View style={styles.loadedArticleList}>
        {LIST_ARTICLES.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </View>
    </View>
  );
}

// ─── Offline body ─────────────────────────────────────────────────────────────

function OfflineBody() {
  return (
    <View style={styles.offlineBody}>
      <SavedArticlesBanner />
      <View style={styles.offlineArticleList}>
        {LIST_ARTICLES.map((article) => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </View>
    </View>
  );
}

// ─── Empty body ───────────────────────────────────────────────────────────────

function EmptyBody() {
  const { t } = useTranslation();

  return (
    <View style={styles.centerBody}>
      {/* Mailbox icon — emoji fallback (no Mailbox.png available) */}
      <Text style={styles.emptyIcon}>📬</Text>

      <Text style={styles.stateTitle}>{t('news.empty.title')}</Text>
      <Text style={styles.stateBody}>{t('news.empty.body')}</Text>

      {/* Notification banner */}
      <View style={styles.notifBanner}>
        <Text style={styles.notifBannerEmoji}>🔔</Text>
        <Text style={styles.notifBannerText}>{t('news.empty.notification')}</Text>
      </View>

      <Pressable hitSlop={8}>
        <Text style={styles.seeAllLink}>{t('news.empty.see_all')}</Text>
      </Pressable>
    </View>
  );
}

// ─── Error body ───────────────────────────────────────────────────────────────

interface ErrorBodyProps {
  onRetry: () => void;
}

function ErrorBody({ onRetry }: ErrorBodyProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.centerBody}>
      <View style={styles.errorIconCircle}>
        <Image
          source={require('../../assets/icons/calendar-error.png')}
          style={{ width: 48, height: 48 }}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.stateTitle}>{t('news.error.title')}</Text>
      <Text style={styles.stateBody}>{t('news.error.body')}</Text>

      <Pressable style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('news.error.retry')}</Text>
      </Pressable>

      <Pressable hitSlop={8} style={{ marginTop: spacing.sp16 }}>
        <Text style={styles.savedArticlesLink}>{t('news.error.saved_articles')}</Text>
      </Pressable>
    </View>
  );
}

// ─── DEV switcher ─────────────────────────────────────────────────────────────

const ALL_STATES: NewsState[] = ['skeleton', 'loaded', 'offline', 'empty', 'error', 'session'];
const STATE_LABELS: Record<NewsState, string> = {
  skeleton: 'loading',
  loaded:   'loaded',
  offline:  'offline',
  empty:    'empty',
  error:    'error',
  session:  'session',
};

interface DevSwitcherProps {
  current: NewsState;
  onChange: (s: NewsState) => void;
}

function DevSwitcher({ current, onChange }: DevSwitcherProps) {
  return (
    <View style={styles.devSwitcher}>
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

export default function NewsScreen() {
  const [newsState, setNewsState] = useState<NewsState>('loaded');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const insets = useSafeAreaInsets();

  const showFilterRow = newsState === 'loaded' || newsState === 'offline' || newsState === 'session';
  const showOfflineBanner = newsState === 'offline';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header — handles topInset internally */}
        <NewsHeader
          state={newsState === 'session' ? 'loaded' : newsState}
          topInset={insets.top}
        />

        {/* Offline banner — appears directly below header in offline state */}
        {showOfflineBanner && <NewsOfflineBanner />}

        {/* Filter row — loaded, offline, and session states */}
        {showFilterRow && (
          <FilterRow activeFilter={activeFilter} onFilterChange={setActiveFilter} />
        )}

        {/* Body content per state */}
        {newsState === 'skeleton' && <NewsSkeleton />}

        {(newsState === 'loaded' || newsState === 'session') && <LoadedBody />}

        {newsState === 'offline' && <OfflineBody />}

        {newsState === 'empty' && <EmptyBody />}

        {newsState === 'error' && (
          <ErrorBody onRetry={() => console.log('[NEWS] retry')} />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Session expired modal overlay */}
      {newsState === 'session' && (
        <SessionExpiredModal
          onClose={() => setNewsState('loaded')}
          onOffline={() => setNewsState('offline')}
        />
      )}

      {__DEV__ && (
        <DevSwitcher current={newsState} onChange={setNewsState} />
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

  // ── Offline banner (news-specific, below header)
  offlineBanner: {
    height: 57,
    backgroundColor: colors.newsOfflineBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.offline,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sp16,
    gap: spacing.sp8,
  },
  offlineDot: {
    width: 10,
    height: 11,
    borderRadius: radius.rFull,
    backgroundColor: colors.offline,
  },
  offlineBannerText: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.danger,
    flex: 1,
  },

  // ── Saved articles warning banner (offline body)
  savedBanner: {
    marginHorizontal: spacing.sp16,
    height: 46,
    borderRadius: radius.rLg,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warningBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp16,
  },
  savedBannerText: {
    fontSize: 12,
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
  },

  // ── Loaded body
  loadedBody: {
    paddingTop: spacing.sp20,
    gap: 18,
  },
  loadedArticleList: {
    gap: 18,
  },

  // ── Offline body
  offlineBody: {
    paddingTop: spacing.sp20,
    gap: spacing.sp16,
  },
  offlineArticleList: {
    gap: spacing.sp16,
  },

  // ── Shared center layout (empty + error)
  centerBody: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.sp24,
    paddingTop: 153,
  },
  stateTitle: {
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp24,
  },
  stateBody: {
    fontSize: 14,
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    maxWidth: 218,
    lineHeight: 22,
    marginTop: spacing.sp16,
  },

  // ── Empty state
  emptyIcon: {
    fontSize: 64,
    lineHeight: 77,
  },
  notifBanner: {
    marginTop: spacing.sp24,
    width: 328,
    minHeight: 63,
    borderRadius: radius.rMd,
    backgroundColor: colors.newsNotifBg,
    borderWidth: 1,
    borderColor: colors.jade400,
    paddingHorizontal: spacing.sp16,
    paddingVertical: spacing.sp12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp12,
  },
  notifBannerEmoji: {
    fontSize: 25,
  },
  notifBannerText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.jade600,
  },
  seeAllLink: {
    marginTop: spacing.sp16,
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.jade600,
    textAlign: 'center',
  },

  // ── Error state
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
    fontSize: 14,
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
  savedArticlesLink: {
    fontSize: 12,
    fontFamily: fonts.sans,
    color: colors.jade600,
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
