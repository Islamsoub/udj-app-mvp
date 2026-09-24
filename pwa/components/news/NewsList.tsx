'use client';

import { useMemo } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import type { NewsArticleSummary } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { ArticleMeta, ArticleTags } from './ArticleMeta';
import { HeroImage } from './HeroImage';
import { articleHref, categoryChips, categoryKey, filterArticles } from './model';
import styles from './news.module.css';

const LIST_ID = 'news-articles';

/**
 * The loaded list: the category chips, the article cards, and the count.
 *
 * The caller has already ruled out "no articles at all", so an empty result
 * here is always a FILTER that matched nothing — a different message, with a
 * way back to everything.
 */
export function NewsList({
  articles,
  category,
  onCategory,
  onOpen,
}: {
  articles: NewsArticleSummary[];
  category: string;
  onCategory: (slug: string) => void;
  /** Opens an article in place. Receives the event so a modified click (new
   *  tab, new window) can be left to the browser. */
  onOpen: (article: NewsArticleSummary, event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const { t, lang } = useI18n();

  const chips = useMemo(() => categoryChips(articles, category), [articles, category]);
  const shown = useMemo(() => filterArticles(articles, category), [articles, category]);

  return (
    <>
      {/*
        §9: "Category filter chips use instant color swap, not a sliding pill
        (they're multi-select-adjacent in spirit, not a single-choice segmented
        control)." So NOT SegmentedControl, which is exactly the sliding pill
        and a tablist. These are toggle buttons in a labelled group, each its own
        tab stop with aria-pressed, and the stylesheet gives them no transition
        at all — the colour swaps in the frame the tap lands.

        One chip is pressed at a time: "Tout" or a single category. The spec's
        "multi-select in spirit" is about how they look and respond, and the
        endpoint filters on one slug; combining categories would be a filter
        the backend has no notion of.
      */}
      <div className={styles.chips} role="group" aria-label={t('news.filter.label')}>
        {chips.map((slug) => {
          const pressed = slug === category;
          return (
            <button
              key={slug}
              type="button"
              className={`${styles.chip} ${pressed ? styles.chipPressed : ''}`}
              aria-pressed={pressed}
              aria-controls={LIST_ID}
              onClick={() => onCategory(slug)}
            >
              {t(slug === 'all' ? 'news.filter.all' : categoryKey(slug))}
            </button>
          );
        })}
      </div>

      <div id={LIST_ID}>
        {shown.length === 0 ? (
          <div className={styles.emptyBox}>
            <p className={styles.emptyTitle}>{t('news.empty.filter.title')}</p>
            <p className={styles.emptyText}>{t('news.empty.filter.body')}</p>
            <button type="button" className={styles.retryButton} onClick={() => onCategory('all')}>
              {t('news.empty.filter.action')}
            </button>
          </div>
        ) : (
          <ul className={styles.grid}>
            {shown.map((article) => (
              <li key={article.id} className={styles.gridItem}>
                {/*
                  A real link to the article's own URL, so open-in-new-tab,
                  copy-link and share all work; a plain click is intercepted and
                  opens the reader in place, keeping this list mounted behind it.
                */}
                <a
                  href={articleHref(article.id)}
                  className={styles.card}
                  data-article-id={article.id}
                  onClick={(event) => onOpen(article, event)}
                >
                  <HeroImage src={article.heroImageUrl} className={styles.cardHero} />

                  <span className={styles.cardBody}>
                    <ArticleTags category={article.category} urgent={article.isUrgent} />
                    <span className={styles.cardTitle}>
                      {lang === 'ar' ? article.titleAr : article.titleFr}
                    </span>
                    <ArticleMeta
                      publishedAt={article.publishedAt}
                      readTime={article.readTimeMinutes}
                    />
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/*
        The count, as a live region: it announces the result of a filter change
        once, where re-reading every card would be noise.
      */}
      <p className={styles.count} role="status" aria-live="polite">
        <Interpolated
          template={t('news.count')}
          values={{ shown: shown.length, total: articles.length }}
        />
      </p>
    </>
  );
}
