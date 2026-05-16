import React, { useState, useCallback, useEffect } from 'react';
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
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { colors, fonts, radius, spacing } from '@/constants/theme';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { NewsHeader } from '@/components/news/NewsHeader';
import { FilterRow, FilterKey } from '@/components/news/FilterRow';
import { HeroCard } from '@/components/news/HeroCard';
import { ArticleCard, Article, ArticleCategory } from '@/components/news/ArticleCard';
import { NewsSkeleton } from '@/components/news/NewsSkeleton';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { getNews, NewsArticleSummary } from '@/services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type NewsState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

// ─── Offline mock (DevSwitcher offline/session states only) ───────────────────

const MOCK_OFFLINE_ARTICLES: Article[] = [
  {
    id: 'mock-1',
    category: 'Evenement',
    title: 'Cérémonie de remise des diplômes — Promotion 2025',
    timestamp: 'Il y a 2j',
    readTime: '3 min',
  },
  {
    id: 'mock-2',
    category: 'Scolarite',
    title: 'Réinscriptions 2025-2026 : modalités et dates limites',
    timestamp: 'Il y a 2j',
    readTime: '3 min',
  },
  {
    id: 'mock-3',
    category: 'Sport',
    title: 'Tournoi inter-facultés de football — inscriptions ouvertes',
    timestamp: 'Il y a 2j',
    readTime: '3 min',
  },
];

// ─── Filter → API category mapping ───────────────────────────────────────────

const FILTER_CATEGORY: Partial<Record<FilterKey, string>> = {
  events:    'Evenement',
  scolarite: 'Scolarite',
  sport:     'Sport',
  youth:     'youth',
  sponsors:  'sponsors',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(publishedAt: string): string {
  const now = new Date();
  const date = new Date(publishedAt);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `Aujourd'hui à ${h}H${m}`;
  }
  if (diffDays === 1) {
    const h = date.getHours().toString().padStart(2, '0');
    const m = date.getMinutes().toString().padStart(2, '0');
    return `Hier à ${h}H${m}`;
  }
  return `Il y a ${diffDays}j`;
}

function toHeroProps(s: NewsArticleSummary) {
  return {
    id: s.id,
    title: s.titleFr,
    timestamp: formatTimestamp(s.publishedAt),
    readTime: `${s.readTimeMinutes} min`,
  };
}

function toCardProps(s: NewsArticleSummary): Article {
  return {
    id: s.id,
    category: s.category as ArticleCategory,
    title: s.titleFr,
    timestamp: formatTimestamp(s.publishedAt),
    readTime: `${s.readTimeMinutes} min`,
  };
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

// ─── Loaded body ──────────────────────────────────────────────────────────────

interface LoadedBodyProps {
  heroArticle: NewsArticleSummary;
  listArticles: NewsArticleSummary[];
  onArticlePress: (id: string) => void;
}

function LoadedBody({ heroArticle, listArticles, onArticlePress }: LoadedBodyProps) {
  return (
    <View style={styles.loadedBody}>
      <Pressable onPress={() => onArticlePress(heroArticle.id)}>
        <HeroCard article={toHeroProps(heroArticle)} />
      </Pressable>
      <View style={styles.loadedArticleList}>
        {listArticles.map((article) => (
          <Pressable key={article.id} onPress={() => onArticlePress(article.id)}>
            <ArticleCard article={toCardProps(article)} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Offline body ─────────────────────────────────────────────────────────────

interface OfflineBodyProps {
  onArticlePress: (id: string) => void;
}

function OfflineBody({ onArticlePress }: OfflineBodyProps) {
  return (
    <View style={styles.offlineBody}>
      <SavedArticlesBanner />
      <View style={styles.offlineArticleList}>
        {MOCK_OFFLINE_ARTICLES.map((article) => (
          <Pressable key={article.id} onPress={() => onArticlePress(article.id)}>
            <ArticleCard article={article} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

// ─── Empty body ───────────────────────────────────────────────────────────────

function EmptyBody() {
  const { t } = useTranslation();

  return (
    <View style={styles.centeredBody}>
      <Image
        source={require('../../assets/icons/Mailbox.png')}
        style={{ width: 100, height: 100 }}
        resizeMode="contain"
      />

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
    <View style={styles.centeredBody}>
      <View style={styles.errorIconCircle}>
        <Image
          source={require('../../assets/icons/News.png')}
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

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function NewsScreen() {
  const [newsState, setNewsState] = useState<NewsState>('skeleton');
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [heroApiArticle, setHeroApiArticle] = useState<NewsArticleSummary | null>(null);
  const [listApiArticles, setListApiArticles] = useState<NewsArticleSummary[]>([]);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const showFilterRow = newsState === 'loaded' || newsState === 'offline' || newsState === 'session';

  const fetchNews = useCallback(async (category?: string) => {
    setNewsState('skeleton');
    try {
      const data = await getNews(category ? { category } : undefined);
      const articles = data.articles ?? [];
      const hero = articles.find((a) => a.isUrgent) ?? articles[0] ?? null;
      const list = hero ? articles.filter((a) => a.id !== hero.id) : articles;
      setHeroApiArticle(hero);
      setListApiArticles(list);
      setNewsState(articles.length === 0 ? 'empty' : 'loaded');
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (err.response?.status === 401) setNewsState('session');
        else if (!err.response) setNewsState('offline');
        else setNewsState('error');
      } else {
        setNewsState('error');
      }
    }
  }, []);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  function handleFilterChange(filter: FilterKey) {
    setActiveFilter(filter);
    fetchNews(filter === 'all' ? undefined : FILTER_CATEGORY[filter]);
  }

  function handleArticlePress(id: string) {
    router.push({ pathname: '/article-reader', params: { id } });
  }

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

        <OfflineBanner />

        {/* Filter row — loaded, offline, and session states */}
        {showFilterRow && (
          <FilterRow activeFilter={activeFilter} onFilterChange={handleFilterChange} />
        )}

        {/* Body content per state */}
        {newsState === 'skeleton' && <NewsSkeleton />}

        {(newsState === 'loaded' || newsState === 'session') && heroApiArticle && (
          <LoadedBody
            heroArticle={heroApiArticle}
            listArticles={listApiArticles}
            onArticlePress={handleArticlePress}
          />
        )}

        {newsState === 'offline' && (
          <OfflineBody onArticlePress={handleArticlePress} />
        )}

        {newsState === 'empty' && <EmptyBody />}

        {newsState === 'error' && (
          <ErrorBody onRetry={() => fetchNews(FILTER_CATEGORY[activeFilter])} />
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <SessionExpiredModal
        visible={newsState === 'session'}
        onContinueOffline={() => setNewsState('offline')}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={newsState}
        onChange={setNewsState}
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
  centeredBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp24,
    paddingBottom: 40,
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
    marginHorizontal: spacing.sp16,
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
    width: 90,
    height: 90,
    borderRadius: 270,
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

});
