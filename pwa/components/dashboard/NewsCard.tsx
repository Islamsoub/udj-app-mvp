'use client';

import { ArticleTags } from '@/components/news/ArticleMeta';
import { getNews } from '@/lib/api-client';
import type { NewsListResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { Card, CardStates, EmptyState } from './Card';
import { Interpolated } from './Interpolated';
import { NewsIcon } from './icons';
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
      icon={<NewsIcon />}
      href="/news"
      index={index}
      animate={animate}
    >
      <CardStates
        state={state}
        skeleton={
          <div className={styles.skeletonStack}>
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineWide}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineWide}`} />
            <div className={`${styles.skeleton} ${styles.skeletonLine} ${styles.skeletonLineShort}`} />
          </div>
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
                    {lang === 'ar' ? article.titleAr : article.titleFr}
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
