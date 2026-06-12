import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  StatusBar,
  Share,
} from 'react-native';
import { isAxiosError } from 'axios';
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
import { getNewsArticle, NewsArticleDetail } from '@/services/api';
import { isValidUUID } from '@/utils/validate';
import { isArticleBookmarked, toggleNewsBookmark } from '@/services/db';
import { localTitle, localBody } from '@/utils/i18nName';
import type { ArticleCategory } from '@/components/news/ArticleCard';

// ─── Types ────────────────────────────────────────────────────────────────────

type ArticleReaderState = 'loaded' | 'skeleton' | 'error' | 'offline';

interface ArticleData {
  id: string;
  category: ArticleCategory;
  title: string;
  fullDate: string;
  author: string;
  body: string;
  url?: string;
}

// ─── Mock data (fallback for dev / DevSwitcher) ───────────────────────────────

const MOCK_ARTICLE: ArticleData = {
  id: '0',
  category: 'scolarite',
  title: 'Inscriptions aux examens de rattrapage : ouverture des dépôts',
  fullDate: '12 mai 2026 · 09:30',
  author: 'Service Scolarité',
  body:
    "Les dépôts de dossiers pour les examens de rattrapage de la session de juin 2026 sont désormais ouverts. Tous les étudiants concernés sont invités à se présenter au service de la scolarité muni de leur carte étudiant et des pièces justificatives requises.\n\nLes dépôts se dérouleront du lundi 12 mai au vendredi 16 mai 2026, de 08h00 à 14h00 du lundi au jeudi, et de 08h00 à 11h30 le vendredi. Passé ce délai, aucun dossier ne sera accepté.\n\nPour toute question relative aux modalités d'inscription, les étudiants peuvent contacter directement le service de la scolarité ou consulter l'affichage officiel sur le tableau d'annonces de leur faculté.",
};

// ─── API response → ArticleData mapper ───────────────────────────────────────

function mapArticleDetail(detail: NewsArticleDetail, lang: string): ArticleData {
  const date = new Date(detail.publishedAt);
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
    id: detail.id,
    category: detail.category as ArticleCategory,
    title: localTitle(detail, lang),
    fullDate: `${dateStr} · ${timeStr}`,
    author: detail.author ?? 'Service Communication',
    body: localBody(detail, lang),
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

function ArticleHero() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  return (
    <View style={styles.hero}>
      <View style={styles.heroLabelPill}>
        <Text style={styles.heroLabelText}>UDJ · UNIVERSITÉ DE DJIBOUTI</Text>
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
      <ArticleHero />

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
      <Pressable style={({ pressed }) => [styles.retryBtn, pressed && { backgroundColor: colors.jade600 }]} onPress={onRetry}>
        <Text style={styles.retryBtnText}>{t('article.error.retry')}</Text>
      </Pressable>
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
      <Pressable style={({ pressed }) => [styles.bookmarkBtn, pressed && { backgroundColor: withAlpha(colors.textPrimary, 0.15), borderRadius: 999 }]} onPress={onBookmark} hitSlop={8}>
        <Ionicons
          name={isBookmarked ? 'bookmark' : 'bookmark-outline'}
          size={24}
          color={isBookmarked ? colors.jade400 : colors.textPrimary}
        />
      </Pressable>
      <Pressable style={({ pressed }) => [styles.shareBtn, pressed && { backgroundColor: colors.jade600 }]} onPress={onShare}>
        <Ionicons name="share-social-outline" size={18} color={colors.surface} />
        <Text style={styles.shareBtnText}>{t('article.share')}</Text>
      </Pressable>
    </View>
  );
}

// ─── DEV switcher ─────────────────────────────────────────────────────────────

const ALL_STATES: ArticleReaderState[] = ['loaded', 'skeleton', 'error', 'offline'];
const STATE_LABELS: Record<ArticleReaderState, string> = {
  loaded: 'loaded',
  skeleton: 'loading',
  error: 'error',
  offline: 'offline',
};

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function ArticleReaderScreen() {
  const { colors } = useColors();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const { i18n } = useTranslation();
  const lang = i18n.language;
  const [readerState, setReaderState] = useState<ArticleReaderState>('skeleton');
  const [articleData, setArticleData] = useState<ArticleData | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const fetchArticle = useCallback(async (articleId: string) => {
    setReaderState('skeleton');
    try {
      const [detail, bookmarked] = await Promise.all([
        getNewsArticle(articleId),
        isArticleBookmarked(articleId),
      ]);
      setArticleData(mapArticleDetail(detail, lang));
      setIsBookmarked(bookmarked);
      setReaderState('loaded');
    } catch (err: unknown) {
      if (isAxiosError(err)) {
        if (!err.response) setReaderState('offline');
        else setReaderState('error');
      } else {
        setReaderState('error');
      }
    }
  }, [lang]);

  useEffect(() => {
    if (!isValidUUID(id)) {
      router.back();
      return;
    }
    fetchArticle(id);
  }, [id, fetchArticle, router]);

  function handleBack() {
    router.back();
  }

  async function handleShare() {
    try {
      const deepLink = `unipocket://article/${article.id}`;
      await Share.share({
        message: `${article.title}\n\n${deepLink}`,
      });
    } catch {
      // Share dismissed or unavailable — no-op
    }
  }

  async function handleBookmark() {
    const next = !isBookmarked;
    setIsBookmarked(next);
    try {
      await toggleNewsBookmark(article.id, next);
    } catch {
      setIsBookmarked(!next);
    }
  }

  const article = articleData ?? MOCK_ARTICLE;
  const isError = readerState === 'error';

  return (
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <ArticleReaderHeader
        topInset={insets.top}
        onBack={handleBack}
      />

      {readerState === 'offline' && <ArticleOfflineBanner />}

      {isError ? (
        <ErrorBody onRetry={() => id && fetchArticle(id)} />
      ) : (
        <>
          {readerState === 'skeleton' && <SkeletonBody />}
          {(readerState === 'loaded' || readerState === 'offline') && (
            <LoadedBody article={article} bottomInset={insets.bottom} />
          )}
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
        onChange={setReaderState}
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

  // ── Hero image placeholder
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
