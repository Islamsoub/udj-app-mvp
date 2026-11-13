'use client';

import { ArticleTags } from '@/components/news/ArticleMeta';
import newsStyles from '@/components/news/news.module.css';
import { getNews } from '@/lib/api-client';
import type { NewsListResponse } from '@/lib/api-types';
import { isolateLtrRuns } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { Card, CardStates, EmptyState } from './Card';
import { Interpolated } from './Interpolated';
import { useCardData } from './useCardData';
import styles from './dashboard.module.css';

const PREVIEW_LIMIT = 3;

/**
 * À la une — the three most recent articles.
 *
 * The card links to /news as a whole rather than each headline linking to its
 * own article: the reader route does not exist yet, and §3's hover lift belongs
 * to the card, so nesting six more links inside a link would be both invalid
 * HTML and six more tab stops for one destination.
 */
export function NewsCard({ index, animate, online }: { index: number; animate: boolean; online: boolean }) {
  const { t, lang } = useI18n();
  const state = useCardData<NewsListResponse>(() => getNews({ limit: PREVIEW_LIMIT }), online);

  return (
    <Card
      title={t('dashboard.news.title')}
      href="/news"
      index={index}
      animate={animate}
    >
      <CardStates
        state={state}
        skeleton={
          /*
           * The loaded list's own boxes, emptied: PREVIEW_LIMIT items, each a
           * category pill, a title line and a meta line. The pill frame is
           * ArticleTags' own .tags and .pill boxes (read from news.module.css,
           * not restyled), so its height follows the real pill. The text lines
           * are one line of ghost text each, in the loaded line's type and font
           * mix (see .skeletonTextLine). A title that wraps adds its extra
           * lines (see PROGRESS.md).
           */
          <ul className={styles.newsList}>
            {Array.from({ length: PREVIEW_LIMIT }, (_, i) => (
              <li key={i} className={styles.newsItem}>
                <span className={newsStyles.tags}>
                  <span className={`${newsStyles.pill} ${styles.skeleton} ${styles.skeletonPillShape}`}>
                    <span className={`${styles.skeletonGhost} ${styles.skeletonGhostTag}`}>{'\u00a0'}</span>
                  </span>
                </span>
                <span className={`${styles.newsTitle} ${styles.skeletonTextLine} ${styles.skeletonW70}`}>{'\u00a0'}</span>
                {/* The meta line holds a .num figure ("2 min de lecture"). */}
                <span className={`${styles.newsMeta} ${styles.skeletonTextLine} ${styles.skeletonW20}`}>
                  <span className="num">0</span>
                  {'\u00a0'}
                </span>
              </li>
            ))}
          </ul>
        }
      >
        {(data) =>
          data.articles.length === 0 ? (
            <EmptyState body={t('dashboard.news.empty')} />
          ) : (
            <ul className={styles.newsList}>
              {data.articles.map((article) => (
                <li key={article.id} className={styles.newsItem}>
                  <ArticleTags category={article.category} urgent={article.isUrgent} />
                  <span className={styles.newsTitle}>
                    {isolateLtrRuns(lang === 'ar' ? article.titleAr : article.titleFr)}
                  </span>
                  <span className={styles.newsMeta}>
                    <Interpolated
                      template={t('dashboard.news.read_time')}
                      values={{ count: article.readTimeMinutes }}
                    />
                  </span>
                </li>
              ))}
            </ul>
          )
        }
      </CardStates>
    </Card>
  );
}
