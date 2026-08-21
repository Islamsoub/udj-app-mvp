import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  StatusBar,
  RefreshControl,
} from 'react-native';
import { PressBox } from '@/components/PressBox';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { fonts, radius, spacing, fz, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { OfflineBanner } from '@/components/ui/OfflineBanner';
import { SessionExpiredModal } from '@/components/ui/SessionExpiredModal';
import { NewsHeader } from '@/components/news/NewsHeader';
import { FilterRow, FilterKey, FilterCategory } from '@/components/news/FilterRow';
import { HeroCard } from '@/components/news/HeroCard';
import { ArticleCard, Article, ArticleCategory } from '@/components/news/ArticleCard';
import { NewsSkeleton } from '@/components/news/NewsSkeleton';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { getNews, getNewsCategories, NewsItem, NewsCategory } from '@/services/api';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import {
  getCachedNews,
  upsertNews,
  getSavedArticles,
  getCachedNewsCategories,
  upsertNewsCategories,
} from '@/services/db';
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
    imageUrl: item.imageUrl,
  };
}

function newsItemToHero(item: NewsItem, lang: string) {
  return {
    id: item.id,
    title: localTitle({ titleFr: item.title, titleAr: item.titleAr }, lang),
    timestamp: formatTimestamp(item.publishedAt),
    readTime: formatReadTime(item.readTimeMinutes),
    isUrgent: item.isUrgent,
    imageUrl: item.imageUrl,
    category: item.category,
  };
}

// Graceful-degradation set: the categories that used to be hardcoded chips. Used
// only when both the network fetch and the SQLite cache come up empty (e.g. a
// fresh install that has never been online). Labels resolve via i18n.
const FALLBACK_CATEGORIES: { slug: string; i18nKey: string }[] = [
  { slug: 'events',    i18nKey: 'news.filter.events' },
  { slug: 'scolarite', i18nKey: 'news.filter.scolarite' },
  { slug: 'sport',     i18nKey: 'news.filter.sport' },
  { slug: 'youth',     i18nKey: 'news.filter.youth' },
  { slug: 'sponsors',  i18nKey: 'news.filter.sponsors' },
];

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
      <View style={styles.offlineArticleList}>
        {articles.map((article) => (
          <ArticleCard key={article.id} article={newsItemToArticle(article, localReadIds, lang)} onPress={() => onArticlePress(article.id)} />
        ))}
      </View>
    </View>
  );
}

// ─── Empty body ───────────────────────────────────────────────────────────────

function EmptyBody() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();

  return (
    <View style={styles.centeredBody}>
      <View style={styles.emptyIconCircle}>
        <Ionicons name="megaphone-outline" size={28} color={colors.jadeText} />
      </View>
      <Text style={styles.stateTitle}>{t('news.empty_title')}</Text>
      <Text style={styles.stateBody}>{t('news.empty_body')}</Text>
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
        <Ionicons name="warning-outline" size={28} color={colors.exam} />
      </View>
      <Text style={styles.stateTitle}>{t('news.error.title')}</Text>
      <Text style={styles.stateBody}>{t('news.error.body')}</Text>
      <PressBox tier="button" style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('news.error.retry')}</Text>
      </PressBox>
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
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t, i18n } = useTranslation();
  const [devState, setDevState] = useState<NewsState | null>(null);
  const [activeFilter, setActiveFilter] = useState<FilterKey>('all');
  const [filterCategory, setFilterCategory] = useState<string | undefined>(undefined);
  const [rawCategories, setRawCategories] = useState<NewsCategory[]>([]);
  const [scrolled, setScrolled] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const localReadIds = useMemo(() => new Set<string>(), []);
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // ─── Dynamic filter categories ──────────────────────────────────────────────
  // Fetch once on mount; cache to SQLite on success; on failure fall back to the
  // last cached set so the chips still render offline.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await getNewsCategories();
        if (cancelled) return;
        setRawCategories(res.categories);
        upsertNewsCategories(res.categories).catch(() => {});
      } catch {
        const cached = await getCachedNewsCategories().catch(() => [] as NewsCategory[]);
        if (!cancelled && cached.length > 0) setRawCategories(cached);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // Resolve each category's label to the active language. When nothing is cached
  // (fresh offline install), degrade to the previously-hardcoded chip set.
  const filterCategories = useMemo<FilterCategory[]>(() => {
    const isAr = i18n.language?.startsWith('ar');
    if (rawCategories.length > 0) {
      return rawCategories.map((c) => ({
        slug: c.slug,
        label: isAr && c.nameAr ? c.nameAr : c.nameFr,
      }));
    }
    return FALLBACK_CATEGORIES.map((c) => ({ slug: c.slug, label: t(c.i18nKey) }));
  }, [rawCategories, i18n.language, t]);

  // ─── Offline query ──────────────────────────────────────────────────────────

  const isSavedTab = activeFilter === 'saved';

  const hook = useOfflineQuery<NewsItem[]>({
    cacheKey: isSavedTab ? 'news-saved' : `news-${filterCategory ?? 'all'}`,
    // null (not []) on an empty cache so the hook shows the skeleton.
    getCached: async () => {
      const r = isSavedTab
        ? await getSavedArticles(20)
        : await getCachedNews(20, filterCategory);
      return r.length > 0 ? r : null;
    },
    fetchFresh: async () => {
      if (isSavedTab) {
        return getSavedArticles(20);
      }
      const data = await getNews();
      const all = mapNewsToCache(data.articles ?? []);
      await upsertNews(all);
      return getCachedNews(20, filterCategory);
    },
    updateCache: () => Promise.resolve(),
  });

  // Re-read SQLite on focus to pick up bookmark changes made in the article reader
  useFocusEffect(
    useCallback(() => {
      hook.refetch();
    }, [hook.refetch])
  );

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
    // Hero only on the "all" tab — hidden when a category filter is active
    const hero = (!filterCategory && !isSavedTab) ? (items.find((a) => a.isUrgent) ?? null) : null;
    const list = hero ? items.filter((a) => a.id !== hero.id) : items;
    return { heroArticle: hero, listArticles: list };
  }, [hook.data, filterCategory, isSavedTab]);

  // ─── Derive screen state ────────────────────────────────────────────────────

  const hookState: NewsState = useMemo(() => {
    if (hook.isLoading && !hook.data) return 'skeleton';
    // No `&& hook.data` — a cold offline start has no cache, and OfflineBody
    // already renders with `hook.data ?? []`.
    if (hook.isOffline) return 'offline';
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
    // The chip value IS the category slug now ('all'/'saved' are the exceptions).
    const cat = filter === 'all' || filter === 'saved' ? undefined : filter;
    setFilterCategory(cat);
  }

  function handleArticlePress(id: string) {
    router.push({ pathname: '/article-reader', params: { id } });
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await hook.refetch();
    setRefreshing(false);
  }, [hook]);

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <NewsHeader
        state={newsState === 'session' ? 'loaded' : newsState}
        topInset={insets.top}
        scrolled={scrolled}
      />

      <OfflineBanner />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 8)}
        scrollEventThrottle={16}
        refreshControl={
          newsState !== 'skeleton' ? (
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.jade400}
              colors={[colors.jade400]}
              progressBackgroundColor={colors.surface}
            />
          ) : undefined
        }
      >
        {showFilterRow && (
          <FilterRow
            categories={filterCategories}
            activeFilter={activeFilter}
            onFilterChange={handleFilterChange}
          />
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

        {newsState === 'empty' && <EmptyBody />}

        {newsState === 'error' && (
          <ErrorBody onRetry={() => hook.refetch()} />
        )}

        <View style={{ height: 88 + insets.bottom }} />
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

  // ── Loaded body
  loadedBody: {
    paddingTop: spacing.sp20,
    paddingHorizontal: spacing.sp16,
    gap: spacing.sp12,
  },
  loadedArticleList: {
    gap: spacing.sp12,
  },

  // ── Offline body
  offlineBody: {
    paddingTop: spacing.sp20,
    paddingHorizontal: spacing.sp16,
    gap: spacing.sp12,
  },
  offlineArticleList: {
    gap: spacing.sp12,
  },

  // ── Shared center layout (empty + error)
  centeredBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp24,
    paddingBottom: spacing.sp48,
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
    maxWidth: 220,
    lineHeight: fz(22),
    marginTop: spacing.sp4,
  },

  // ── Empty state
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: radius.rFull,
    backgroundColor: colors.jadeFaint,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // ── Error state
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: radius.rFull,
    backgroundColor: colors.examBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryBtn: {
    width: 168,
    height: 48,
    borderRadius: radius.rBtn,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp48,
    alignSelf: 'center',
  },
  retryBtnText: {
    fontSize: fz(14),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.surface,
  },

});
