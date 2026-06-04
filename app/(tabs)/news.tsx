import React, { useState, useCallback, useEffect, useMemo } from 'react';
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
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, withAlpha, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { NewsHeader } from '@/components/news/NewsHeader';
import { FilterRow, FilterKey } from '@/components/news/FilterRow';
import { HeroCard } from '@/components/news/HeroCard';
import { ArticleCard, Article, ArticleCategory } from '@/components/news/ArticleCard';
import { NewsSkeleton } from '@/components/news/NewsSkeleton';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { getNews, NewsItem } from '@/services/api';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { getCachedNews, upsertNews, getSavedArticles } from '@/services/db';
import { mapNewsToCache } from '@/services/cacheMappers';
import { formatTimestamp, formatReadTime } from '@/utils/dateFormat';
import { localTitle } from '@/utils/i18nName';

// ─── Types ────────────────────────────────────────────────────────────────────

type NewsState = 'skeleton' | 'loaded' | 'offline' | 'empty' | 'error' | 'session';

// ─── Convert NewsItem → Article ───────────────────────────────────────────────

function newsItemToArticle(item: NewsItem, localReadIds: Set<string>, lang: string): Article {
  return {
    id: item.id,
    category: item.category as ArticleCategory,
    title: localTitle({ titleFr: item.title, titleAr: item.titleAr }, lang),
    timestamp: formatTimestamp(item.publishedAt),
    readTime: formatReadTime(item.readTimeMinutes),
    isRead: item.read || localReadIds.has(item.id),
    bookmarked: item.bookmarked,
  };
}

function newsItemToHero(item: NewsItem, lang: string) {
  return {
    id: item.id,
    title: localTitle({ titleFr: item.title, titleAr: item.titleAr }, lang),
    timestamp: formatTimestamp(item.publishedAt),
    readTime: formatReadTime(item.readTimeMinutes),
  };
}

const FILTER_CATEGORY: Partial<Record<FilterKey, string>> = {
  events:    'events',
  scolarite: 'scolarite',
  sport:     'sport',
  youth:     'youth',
  sponsors:  'sponsors',
};

// ─── Saved articles warning (offline body) ────────────────────────────────────

function SavedArticlesBanner() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <View style={styles.savedBanner}>
      <Text style={styles.savedBannerText}>{t('news.offline.saved_count')}</Text>
    </View>
  );
}

// ─── Loaded body ──────────────────────────────────────────────────────────────

interface LoadedBodyProps {
  heroArticle: NewsItem | null;
  listArticles: NewsItem[];
  onArticlePress: (id: string) => void;
  localReadIds: Set<string>;
}

function LoadedBody({ heroArticle, listArticles, onArticlePress, localReadIds }: LoadedBodyProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <View style={styles.loadedBody}>
      {heroArticle != null && (
        <HeroCard article={newsItemToHero(heroArticle, lang)} onPress={() => onArticlePress(heroArticle.id)} />
      )}
      <View style={styles.loadedArticleList}>
        {listArticles.map((article) => (
          <ArticleCard key={article.id} article={newsItemToArticle(article, localReadIds, lang)} onPress={() => onArticlePress(article.id)} />
        ))}
      </View>
    </View>
  );
}

// ─── Offline body ─────────────────────────────────────────────────────────────

interface OfflineBodyProps {
  articles: NewsItem[];
  onArticlePress: (id: string) => void;
  localReadIds: Set<string>;
}

function OfflineBody({ articles, onArticlePress, localReadIds }: OfflineBodyProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { i18n } = useTranslation();
  const lang = i18n.language;
  return (
    <View style={styles.offlineBody}>
      <SavedArticlesBanner />
      <View style={styles.offlineArticleList}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={newsItemToArticle(article, localReadIds, lang)} onPress={() => onArticlePress(article.id)} />
        ))}
      </View>
    </View>
  );
}

// ─── Empty body ───────────────────────────────────────────────────────────────

function EmptyBody({ isSaved }: { isSaved?: boolean }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={styles.centeredBody}>
      <Image
        source={require('../../assets/icons/Mailbox.png')}
        style={{ width: 100, height: 100 }}
        resizeMode="contain"
      />

      <Text style={styles.stateTitle}>
        {isSaved ? t('news.empty_saved') : t('news.empty.title')}
      </Text>

      {!isSaved && (
        <>
          <Text style={styles.stateBody}>{t('news.empty.body')}</Text>

          <View style={styles.notifBanner}>
            <Text style={styles.notifBannerEmoji}>🔔</Text>
            <Text style={styles.notifBannerText}>{t('news.empty.notification')}</Text>
          </View>

          <Pressable hitSlop={8} style={({ pressed }) => pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 6 }}>
            <Text style={styles.seeAllLink}>{t('news.empty.see_all')}</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

// ─── Error body ───────────────────────────────────────────────────────────────

interface ErrorBodyProps {
  onRetry: () => void;
}

function ErrorBody({ onRetry }: ErrorBodyProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

      <Pressable style={({ pressed }) => [styles.retryBtn, pressed && { backgroundColor: colors.jade600 }]} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('news.error.retry')}</Text>
      </Pressable>

      <Pressable hitSlop={8} style={({ pressed }) => [{ marginTop: spacing.sp16 }, pressed && { backgroundColor: withAlpha(colors.jade400, 0.15), borderRadius: 6 }]}>
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
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [devState, setDevState] = useState<NewsState | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const localReadIds = useMemo(() => new Set<string>(), []);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ─── Offline query ──────────────────────────────────────────────────────────

  const isSavedTab = activeFilter === 'saved';

  const hook = useOfflineQuery<NewsItem[]>({
    cacheKey: isSavedTab ? 'news-saved' : `news-${filterCategory ?? 'all'}`,
    getCached: () => isSavedTab ? getSavedArticles(20) : getCachedNews(20, filterCategory),
    fetchFresh: async () => {
      if (isSavedTab) {
        return getSavedArticles(20);
      }
      const data = await getNews();
      const all = mapNewsToCache(data.articles ?? []);
      await upsertNews(all);
      return filterCategory ? all.filter((a) => a.category === filterCategory) : all;
    },
    updateCache: () => Promise.resolve(),
  });

  // ─── Derive hero/list articles ──────────────────────────────────────────────

  const { heroArticle, listArticles } = useMemo(() => {
    const raw = hook.data ?? [];
    const items = !isSavedTab && filterCategory
      ? raw.filter((a) => a.category === filterCategory)
      : raw;
    // Hero is only ever the urgent/official article — never a fallback first item.
    // On "Tout" this surfaces the urgent article; on a category tab `items` is
    // already filtered to that category, so the hero appears only when the urgent
    // article belongs to the active filter.
    const hero = items.find((a) => a.isUrgent) ?? null;
    const list = hero ? items.filter((a) => a.id !== hero.id) : items;
    return { heroArticle: hero, listArticles: list };
  }, [hook.data, filterCategory, isSavedTab]);

  // ─── Derive screen state ────────────────────────────────────────────────────

  const hookState: NewsState = useMemo(() => {
    if (hook.isLoading && !hook.data) return 'skeleton';
    if (hook.isOffline && hook.data) return 'offline';
    if (hook.data) return hook.data.length === 0 && !hook.isStale ? 'empty' : 'loaded';
    if (hook.error) return 'error';
    return 'skeleton';
  }, [hook.isLoading, hook.data, hook.isOffline, hook.error, hook.isStale]);

  const newsState = devState ?? hookState;

  // Show filters in all states except skeleton so the active chip stays visible during
  // error/offline states and the user knows which filter will be used on retry.
  const showFilterRow = newsState !== 'skeleton';

  function handleFilterChange(filter: FilterKey) {
    setActiveFilter(filter);
    const cat = filter === 'all' || filter === 'saved' ? undefined : FILTER_CATEGORY[filter];
    setFilterCategory(cat);
  }

  function handleArticlePress(id: string) {
    router.push({ pathname: '/article-reader', params: { id } });
  }

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <NewsHeader
        state={newsState === 'session' ? 'loaded' : newsState}
        topInset={insets.top}
      />

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {showFilterRow && (
          <FilterRow activeFilter={activeFilter} onFilterChange={handleFilterChange} />
        )}

        {newsState === 'skeleton' && <NewsSkeleton />}

        {(newsState === 'loaded' || newsState === 'session') && (heroArticle != null || listArticles.length > 0) && (
          <LoadedBody
            heroArticle={heroArticle}
            listArticles={listArticles}
            onArticlePress={handleArticlePress}
            localReadIds={localReadIds}
          />
        )}

        {newsState === 'offline' && (
          <OfflineBody
            articles={hook.data ?? []}
            onArticlePress={handleArticlePress}
            localReadIds={localReadIds}
          />
        )}

        {newsState === 'empty' && <EmptyBody isSaved={isSavedTab} />}

        {newsState === 'error' && (
          <ErrorBody onRetry={() => hook.refetch()} />
        )}

        <View style={{ height: 56 + insets.bottom }} />
      </ScrollView>

      <SessionExpiredModal
        visible={newsState === 'session'}
        onContinueOffline={() => setDevState('offline')}
      />

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={newsState}
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
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ── Saved articles warning banner (offline body)
  savedBanner: {
    marginHorizontal: spacing.sp16,
    height: spacing.sp48,
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
