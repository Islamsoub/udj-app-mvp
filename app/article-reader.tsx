import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  StatusBar,
  Share,
} from 'react-native';
import { PressBox } from '@/components/PressBox';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { fonts, fz, radius, spacing, withAlpha, sizing, type Palette } from '@/constants/theme';
import { useColors } from '@/hooks/useColors';
import { getNewsCategoryColors } from '@/constants/colorMap';
import { ArticleReaderHeader } from '@/components/news/ArticleReaderHeader';
import { SkeletonBox } from '@/components/ui/SkeletonBox';
import { DevSwitcher } from '@/components/ui/DevSwitcher';
import { getNewsArticle, NewsItem } from '@/services/api';
import { useOfflineQuery } from '@/hooks/useOfflineQuery';
import { isValidUUID } from '@/utils/validate';
import { getCachedArticle, upsertArticle, toggleNewsBookmark } from '@/services/db';
import { mapArticleDetailToCache } from '@/services/cacheMappers';
import { localTitle, localBody } from '@/utils/i18nName';
import type { ArticleCategory } from '@/components/news/ArticleCard';

// ─── Types ────────────────────────────────────────────────────────────────────

type ArticleReaderState = 'loaded' | 'skeleton' | 'error' | 'offline' | 'offlineEmpty';

interface ArticleData {
  id: string;
  category: ArticleCategory;
  title: string;
  fullDate: string;
  author: string;
  body: string;
  heroImageUrl?: string | null;
  url?: string;
}

// ─── Cached article → ArticleData mapper ──────────────────────────────────────
// The reader renders exclusively from the SQLite cache (populated by the offline
// query below), so the same mapper serves both the online and offline paths —
// there is no mock fallback and fabricated content can never render.

function mapCachedArticle(item: NewsItem, lang: string): ArticleData {
  const date = new Date(item.publishedAt);
  const dateStr = date.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return {
    id: item.id,
    category: item.category as ArticleCategory,
    title: localTitle({ titleFr: item.title, titleAr: item.titleAr }, lang),
    fullDate: `${dateStr} · ${timeStr}`,
    author: item.author || 'Service Communication',
    body: localBody({ bodyFr: item.body, bodyAr: item.bodyAr }, lang),
    heroImageUrl: item.imageUrl,
  };
}

// ─── Article offline banner ───────────────────────────────────────────────────

function ArticleOfflineBanner() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <View style={styles.offlineBanner}>
      <Text style={styles.offlineBannerText}>{t('article.offline.banner')}</Text>
    </View>
  );
}

// ─── Hero section ─────────────────────────────────────────────────────────────

function ArticleHero({ imageUrl }: { imageUrl?: string | null }) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();

  if (imageUrl) {
    return (
      <View style={styles.heroImageContainer}>
        <Image source={{ uri: imageUrl }} style={styles.heroImage} resizeMode="cover" />
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.45)']}
          style={styles.heroScrim}
        />
      </View>
    );
  }

  return (
    <View style={styles.hero}>
      <View style={styles.heroLabelPill}>
        <Text style={styles.heroLabelText}>{t('article.hero_label')}</Text>
      </View>
    </View>
  );
}

// ─── Loaded body ──────────────────────────────────────────────────────────────

interface LoadedBodyProps {
  article: ArticleData;
  bottomInset: number;
}

function LoadedBody({ article, bottomInset }: LoadedBodyProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  const paragraphs = article.body.split('\n\n');
  const catColor = getNewsCategoryColors(article.category, colors);

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={{ paddingBottom: bottomInset + 56 + spacing.sp32 }}
      showsVerticalScrollIndicator={false}
    >
      <ArticleHero imageUrl={article.heroImageUrl} />

      <View style={styles.bodyContent}>
        <View style={[styles.categoryPill, { backgroundColor: catColor.bg }]}>
          <Text style={[styles.categoryText, { color: catColor.fg }]}>
            {t(`news.cat.${article.category}`)}
          </Text>
        </View>

        <Text style={styles.date}>{article.fullDate}</Text>
        <Text style={styles.title}>{article.title}</Text>
        <Text style={styles.author}>{article.author}</Text>

        <View style={styles.divider} />

        {paragraphs.map((p, i) => (
          <Text key={i} style={styles.bodyParagraph}>{p}</Text>
        ))}
      </View>
    </ScrollView>
  );
}

// ─── Skeleton body ────────────────────────────────────────────────────────────

function SkeletonBody() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
      scrollEnabled={false}
    >
      <SkeletonBox width="100%" height={280} borderRadius={0} />

      <View style={styles.bodyContent}>
        <SkeletonBox
          width={90}
          height={28}
          borderRadius={radius.rFull}
          style={{ marginTop: spacing.sp16 }}
        />
        <SkeletonBox
          width={160}
          height={15}
          borderRadius={radius.rMd}
          style={{ marginTop: spacing.sp8 }}
        />
        <SkeletonBox
          width="100%"
          height={22}
          borderRadius={radius.rMd}
          style={{ marginTop: spacing.sp12 }}
        />
        <SkeletonBox
          width="70%"
          height={22}
          borderRadius={radius.rMd}
          style={{ marginTop: spacing.sp8 }}
        />
        <SkeletonBox
          width={180}
          height={15}
          borderRadius={radius.rMd}
          style={{ marginTop: spacing.sp8 }}
        />

        <View style={styles.divider} />

        <View style={styles.skeletonGroup}>
          <SkeletonBox width="100%" height={15} borderRadius={radius.rMd} />
          <SkeletonBox width="100%" height={15} borderRadius={radius.rMd} />
          <SkeletonBox width="80%" height={15} borderRadius={radius.rMd} />
          <SkeletonBox width="60%" height={15} borderRadius={radius.rMd} />
        </View>

        <View style={[styles.skeletonGroup, { marginTop: spacing.sp16 }]}>
          <SkeletonBox width="100%" height={15} borderRadius={radius.rMd} />
          <SkeletonBox width="100%" height={15} borderRadius={radius.rMd} />
          <SkeletonBox width="80%" height={15} borderRadius={radius.rMd} />
        </View>

        <View style={{ height: spacing.sp32 }} />
      </View>
    </ScrollView>
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
    <View style={styles.errorBody}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="warning-outline" size={32} color={colors.danger} />
      </View>
      <Text style={styles.errorTitle}>{t('article.error.title')}</Text>
      <Text style={styles.errorBodyText}>{t('article.error.body')}</Text>
      <PressBox tier="button" style={styles.retryBtn} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('article.error.retry')}</Text>
      </PressBox>
    </View>
  );
}

// ─── Offline empty body (article not in cache, device offline) ────────────────

function OfflineEmptyBody() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <View style={styles.errorBody}>
      <View style={styles.errorIconCircle}>
        <Ionicons name="cloud-offline-outline" size={32} color={colors.offline} />
      </View>
      <Text style={styles.errorTitle}>{t('news.offlineContent')}</Text>
    </View>
  );
}

// ─── Bottom action bar ────────────────────────────────────────────────────────

interface BottomBarProps {
  bottomInset: number;
  isBookmarked: boolean;
  onBookmark: () => void;
  onShare: () => void;
}

function BottomBar({ bottomInset, isBookmarked, onBookmark, onShare }: BottomBarProps) {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { t } = useTranslation();
  return (
    <View style={[styles.bottomBar, { paddingBottom: bottomInset + 8 }]}>
      <PressBox tier="icon" style={styles.bookmarkBtn} onPress={onBookmark} hitSlop={8}>
        <Ionicons
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={24}
          color={isBookmarked ? colors.jade400 : colors.textPrimary}
        />
      </PressBox>
      <PressBox tier="button" style={styles.shareBtn} onPress={onShare}>
        <Ionicons name="share-social-outline" size={18} color={colors.surface} />
        <Text style={styles.shareBtnText}>{t('article.share')}</Text>
      </PressBox>
    </View>
  );
}

// ─── DEV switcher ─────────────────────────────────────────────────────────────

const ALL_STATES: ArticleReaderState[] = ['loaded', 'skeleton', 'error', 'offline', 'offlineEmpty'];
const STATE_LABELS: Record<ArticleReaderState, string> = {
  loaded: 'loaded',
  skeleton: 'loading',
  error: 'error',
  offline: 'offline',
  offlineEmpty: 'offline-empty',
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ArticleReaderScreen() {
  const { colors, isDark } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [devState, setDevState] = useState<ArticleReaderState | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const validId = isValidUUID(id);

  // Malformed deep link → bounce back rather than query a bad id.
  useEffect(() => {
    if (!validId) router.back();
  }, [validId, router]);

  // ─── Offline-first article load (same stale-while-revalidate flow as every
  // other screen). Reads the cached article, revalidates from the API when
  // online, and caches the full bilingual body so it survives offline. ─────────
  const hook = useOfflineQuery<NewsItem>({
    cacheKey: `article-${id}`,
    getCached: async () => {
      const item = await getCachedArticle(id);
      // A list-only row has an empty body — treat it as "not cached" so we never
      // render a blank article, and offline correctly falls to the empty state.
      return item && item.body ? item : null;
    },
    fetchFresh: async () => {
      const detail = await getNewsArticle(id);
      return mapArticleDetailToCache(detail);
    },
    updateCache: (item) => upsertArticle(item),
    enabled: validId,
  });

  const article = useMemo<ArticleData | null>(
    () => (hook.data ? mapCachedArticle(hook.data, lang) : null),
    [hook.data, lang],
  );

  // Keep the bookmark toggle in sync with the cached row.
  useEffect(() => {
    if (hook.data) setIsBookmarked(hook.data.bookmarked);
  }, [hook.data]);

  // ─── Derive screen state ─────────────────────────────────────────────────────
  const hookState: ArticleReaderState = useMemo(() => {
    if (hook.isLoading && !hook.data) return 'skeleton';
    if (hook.data) return hook.isOffline ? 'offline' : 'loaded';
    // useOfflineQuery raises Error('offline') when there is nothing cached and
    // the device is offline; any other error is a genuine fetch failure.
    if (hook.error) return hook.error.message === 'offline' ? 'offlineEmpty' : 'error';
    return 'skeleton';
  }, [hook.isLoading, hook.data, hook.isOffline, hook.error]);

  const readerState = devState ?? hookState;

  function handleBack() {
    router.back();
  }

  async function handleShare() {
    try {
      const deepLink = `unipocket://article/${id}`;
      await Share.share({
        message: `${article?.title ?? ''}\n\n${deepLink}`,
      });
    } catch {
      // Share dismissed or unavailable — no-op
    }
  }

  async function handleBookmark() {
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      await toggleNewsBookmark(id, next);
    } catch {
      setIsBookmarked(!next);
    }
  }

  const showArticle =
    (readerState === 'loaded' || readerState === 'offline') && article !== null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />

      <ArticleReaderHeader
        topInset={insets.top}
        onBack={handleBack}
      />

      {(readerState === 'offline' || readerState === 'offlineEmpty') && <ArticleOfflineBanner />}

      {readerState === 'error' && <ErrorBody onRetry={() => hook.refetch()} />}
      {readerState === 'offlineEmpty' && <OfflineEmptyBody />}
      {readerState === 'skeleton' && <SkeletonBody />}

      {showArticle && (
        <>
          <LoadedBody article={article} bottomInset={insets.bottom} />
          <BottomBar
            bottomInset={insets.bottom}
            isBookmarked={isBookmarked}
            onBookmark={handleBookmark}
            onShare={handleShare}
          />
        </>
      )}

      <DevSwitcher
        states={ALL_STATES}
        labels={STATE_LABELS}
        current={readerState}
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

  // ── Offline banner
  offlineBanner: {
    height: spacing.sp48,
    backgroundColor: colors.newsOfflineBg,
    borderBottomWidth: 1,
    borderBottomColor: colors.offline,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp16,
  },
  offlineBannerText: {
    fontSize: fz(13),
    fontFamily: fonts.sans,
    color: colors.danger,
  },

  // ── Hero — real image path
  heroImageContainer: {
    height: 280,
    overflow: 'hidden',
  },
  heroImage: {
    width: '100%',
    height: 280,
  },
  heroScrim: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    height: 140,
  },

  // ── Hero — placeholder path (no image)
  hero: {
    height: 280,
    backgroundColor: colors.jade600,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.sp16,
    paddingBottom: spacing.sp16,
  },
  heroLabelPill: {
    backgroundColor: withAlpha(colors.black, 0.3),
    paddingHorizontal: spacing.sp12,
    paddingVertical: spacing.sp6,
    borderRadius: radius.rMd,
    alignSelf: 'flex-start',
  },
  heroLabelText: {
    color: colors.surface,
    fontSize: fz(11),
    fontWeight: '600',
    fontFamily: fonts.sans,
  },

  // ── Scroll container
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.sp32,
  },

  // ── Loaded body content
  bodyContent: {
    paddingHorizontal: spacing.sp16,
  },
  categoryPill: {
    height: 28,
    borderRadius: radius.rFull,
    paddingHorizontal: spacing.sp12,
    alignSelf: 'flex-start',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sp16,
  },
  categoryText: {
    fontSize: fz(11),
    fontWeight: '700',
    fontFamily: fonts.sans,
    letterSpacing: 0.5,
  },
  date: {
    fontSize: fz(13),
    fontFamily: fonts.mono,
    color: colors.greyMedium,
    marginTop: spacing.sp8,
  },
  title: {
    fontSize: fz(22),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    lineHeight: fz(30),
    marginTop: spacing.sp12,
  },
  author: {
    fontSize: fz(15),
    fontWeight: '500',
    fontFamily: fonts.sans,
    color: colors.greyMedium,
    marginTop: spacing.sp8,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sp20,
  },
  bodyParagraph: {
    fontSize: fz(15),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    lineHeight: fz(24),
    marginBottom: spacing.sp16,
  },

  // ── Skeleton groups
  skeletonGroup: {
    gap: spacing.sp8,
  },

  // ── Error state
  errorBody: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.sp24,
  },
  errorIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 216,
    backgroundColor: colors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorTitle: {
    fontSize: fz(14),
    fontWeight: '700',
    fontFamily: fonts.sans,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: spacing.sp24,
  },
  errorBodyText: {
    fontSize: fz(14),
    fontWeight: '400',
    fontFamily: fonts.sans,
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: fz(22),
    marginTop: spacing.sp16,
  },
  retryBtn: {
    width: 168,
    height: 56,
    borderRadius: radius.rLg,
    backgroundColor: colors.jade400,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 48,
  },
  retryBtnText: {
    fontSize: fz(14),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },

  // ── Bottom action bar
  bottomBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: spacing.sp16,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bookmarkBtn: {
    width: sizing.touchTarget,
    height: sizing.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shareBtn: {
    height: sizing.touchTarget,
    paddingHorizontal: spacing.sp24,
    borderRadius: radius.rFull,
    backgroundColor: colors.jade400,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sp8,
  },
  shareBtnText: {
    fontSize: fz(14),
    fontWeight: '600',
    fontFamily: fonts.sans,
    color: colors.surface,
  },
});
