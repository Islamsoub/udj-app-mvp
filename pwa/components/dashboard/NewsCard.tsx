'use client';

import Link from 'next/link';
import { CategoryPill, UrgentPill } from '@/components/news/ArticleMeta';
import { HeroImage } from '@/components/news/HeroImage';
import { articleHref } from '@/components/news/model';
import { getNews } from '@/lib/api-client';
import type { NewsArticleSummary, NewsListResponse } from '@/lib/api-types';
import { isolateLtrRuns } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { Card, CardStates, EmptyState } from './Card';
import { ShortDate } from './ShortDate';
import { useCardData } from './useCardData';
import styles from './dashboard.module.css';

/** Design shows two; three fills the full-width row without crowding it. */
const PREVIEW_LIMIT = 3;

/**
 * Actualités récentes (dashboard.html:125-130; app.css:471-484).
 *
 * Each article is its own link, to the reader at /news?article=<id> — the news
 * screen opens it in place, from a fresh load as well as from its list. So the
 * card itself is NOT a link (a link inside a link is invalid HTML), and "Voir
 * tout" in the heading row goes to the list.
 *
 * No unread dot: the PWA does not record which articles a student has opened —
 * the API has no read state for news, and nothing on this device keeps one —
 * so a dot would mark every article, which says nothing.
 */
export function NewsCard({
  index,
  animate,
  online,
  className,
}: {
  index: number;
  animate: boolean;
  online: boolean;
  className?: string;
}) {
  const { t } = useI18n();
  const state = useCardData<NewsListResponse>(() => getNews({ limit: PREVIEW_LIMIT }), online);

  return (
    <Card
      title={t('dashboard.news.title')}
      action={{ href: '/news', label: t('dashboard.news.see_all') }}
      className={className}
      index={index}
      animate={animate}
    >
      <CardStates
        state={state}
        skeleton={
          <div className={styles.articleList}>
            {[0, 1].map((row) => (
              <div key={row} className={styles.articleCard}>
                <div className={`${styles.skeleton} ${styles.articleThumbSkeleton}`} />
                <div className={styles.skeletonStack} style={{ flex: 1, gap: 8 }}>
                  <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
                  <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineWide}`} />
                </div>
              </div>
            ))}
          </div>
        }
      >
        {(data) =>
          data.articles.length === 0 ? (
            <EmptyState body={t('dashboard.news.empty')} />
          ) : (
            <ul className={styles.articleList}>
              {data.articles.map((article) => (
                <li key={article.id}>
                  <ArticleRow article={article} />
                </li>
              ))}
            </ul>
          )
        }
      </CardStates>
    </Card>
  );
}

/** app.css:476-480 .article-card2: thumbnail, then pills and date over the title. */
function ArticleRow({ article }: { article: NewsArticleSummary }) {
  const { lang } = useI18n();
  const title = lang === 'ar' ? article.titleAr : article.titleFr;

  return (
    <Link href={articleHref(article.id)} className={styles.articleCard}>
      {/*
        The news screen's image frame: space reserved, never blank, a failed or
        missing image becomes the placeholder. Here at Design's 56px, with
        Design's stripes and no glyph (.articleThumb).
      */}
      <HeroImage src={article.heroImageUrl} className={styles.articleThumb} />
      <span className={styles.articleBody}>
        <span className={styles.articleTop}>
          <span className={styles.articleTags}>
            {article.isUrgent && <UrgentPill className={styles.catPill} />}
            <CategoryPill category={article.category} className={styles.catPill} />
          </span>
          <span className={styles.articleDate}>
            <ShortDate date={new Date(article.publishedAt)} now={Date.now()} />
          </span>
        </span>
        <span className={styles.articleTitle}>{isolateLtrRuns(title)}</span>
      </span>
    </Link>
  );
}
