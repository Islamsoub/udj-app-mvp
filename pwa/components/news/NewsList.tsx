'use client';

import { useMemo } from 'react';
import { Interpolated } from '@/components/dashboard/Interpolated';
import type { NewsArticleSummary } from '@/lib/api-types';
import { isolateLtrRuns } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { ArticleMeta, ArticleTags } from './ArticleMeta';
import { HeroImage } from './HeroImage';
import { BookmarkIcon, SearchIcon } from './icons';
import {
  SAVED_FILTER,
  articleHref,
  articleTitle,
  categoryChips,
  categoryKey,
  visibleArticles,
} from './model';
import type { SavedArticles } from './useSavedArticles';
import styles from './news.module.css';

const LIST_ID = 'news-articles';
const SAVED_HINT_ID = 'news-saved-offline';

/**
 * The loaded list: the toolbar (the prototype's .news-toolbar — the pills on
 * the start, the search on the end, one row that wraps on a phone), the article
 * cards, and the count.
 *
 * The caller has already ruled out "no articles at all", so an empty result
 * here is always the pill, the search, or both, matching nothing.
 */
export function NewsList({
  articles,
  filter,
  onFilter,
  query,
  onQuery,
  saved,
  online,
  onOpen,
}: {
  articles: NewsArticleSummary[];
  /** "all", a category slug, or SAVED_FILTER. */
  filter: string;
  onFilter: (filter: string) => void;
  query: string;
  onQuery: (query: string) => void;
  saved: SavedArticles;
  online: boolean;
  /** Opens an article in place. Receives the event so a modified click (new
   *  tab, new window) can be left to the browser. */
  onOpen: (article: NewsArticleSummary, event: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const { t, lang } = useI18n();

  const chips = useMemo(
    () => categoryChips(articles, filter === SAVED_FILTER ? 'all' : filter),
    [articles, filter]
  );

  /*
   * The saved pill draws from what the server holds; until that is loaded (or
   * offline) it has nothing to show, which `savedNotice` below says in words.
   */
  const savedReady = saved.phase === 'ready';
  const shown = useMemo(
    () =>
      visibleArticles(articles, {
        filter,
        savedIds: savedReady ? saved.ids : [],
        query,
        lang,
      }),
    [articles, filter, saved.ids, savedReady, query, lang]
  );

  const savedSelected = filter === SAVED_FILTER;
  const savedOffline = !online || saved.phase === 'offline';

  return (
    <>
      <div className={styles.toolbar}>
        {/*
          §9: "Category filter chips use instant color swap, not a sliding
          pill". Toggle buttons in a labelled group, each its own tab stop with
          aria-pressed; one pressed at a time. "Enregistrés" is the last of
          them: a filter like the others, over the same list.
        */}
        <div className={styles.chips} role="group" aria-label={t('news.filter.label')}>
          {chips.map((slug) => {
            const pressed = slug === filter;
            return (
              <button
                key={slug}
                type="button"
                className={`${styles.chip} ${pressed ? styles.chipPressed : ''}`}
                aria-pressed={pressed}
                aria-controls={LIST_ID}
                onClick={() => onFilter(slug)}
              >
                {t(slug === 'all' ? 'news.filter.all' : categoryKey(slug))}
              </button>
            );
          })}

          <button
            type="button"
            className={`${styles.chip} ${styles.chipSaved} ${savedSelected ? styles.chipPressed : ''}`}
            aria-pressed={savedSelected}
            aria-controls={LIST_ID}
            // Offline, the pill says why it cannot show anything — on hover and
            // to assistive tech here, and in the list when it is selected.
            title={savedOffline ? t('news.saved.offline') : undefined}
            aria-describedby={savedOffline ? SAVED_HINT_ID : undefined}
            onClick={() => onFilter(SAVED_FILTER)}
          >
            <BookmarkIcon className={styles.chipIcon} filled={savedSelected} />
            {t('news.filter.saved')}
          </button>
          {savedOffline && (
            <span id={SAVED_HINT_ID} className={styles.srOnly}>
              {t('news.saved.offline')}
            </span>
          )}
        </div>

        {/* .search-wrap: a 38px pill, 220 wide, the glyph at the start. */}
        <div className={styles.search} role="search">
          <SearchIcon className={styles.searchIcon} />
          <input
            type="search"
            className={styles.searchInput}
            value={query}
            onChange={(event) => onQuery(event.target.value)}
            placeholder={t('news.search.placeholder')}
            aria-label={t('news.search.label')}
            aria-controls={LIST_ID}
            enterKeyHint="search"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </div>

      <div id={LIST_ID}>
        {shown.length === 0 ? (
          <EmptyResult
            savedSelected={savedSelected}
            savedOffline={savedOffline}
            saved={saved}
            searching={query.trim() !== ''}
            onAll={() => onFilter('all')}
          />
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
                      {isolateLtrRuns(articleTitle(article, lang))}
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
        The count, as a live region: it announces the result of a filter or a
        search once, where re-reading every card would be noise.
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

/**
 * Why the list is empty, most specific first:
 *   1. the saved pill cannot show anything yet (offline, loading, failed);
 *   2. a search matched nothing — "Aucun article.";
 *   3. nothing saved — "Aucun article enregistré.";
 *   4. a category matched nothing — with a way back to everything.
 */
function EmptyResult({
  savedSelected,
  savedOffline,
  saved,
  searching,
  onAll,
}: {
  savedSelected: boolean;
  savedOffline: boolean;
  saved: SavedArticles;
  searching: boolean;
  onAll: () => void;
}) {
  const { t } = useI18n();

  if (savedSelected && savedOffline) {
    return <p className={styles.emptyLine}>{t('news.saved.offline')}</p>;
  }
  if (savedSelected && saved.phase === 'loading') {
    return <p className={styles.emptyLine}>{t('news.saved.loading')}</p>;
  }
  if (savedSelected && saved.phase === 'error') {
    return (
      <div className={styles.emptyLineBox}>
        <p className={styles.emptyLine}>{t('news.saved.error')}</p>
        <button type="button" className={styles.retryButton} onClick={saved.retry}>
          {t('actions.retry')}
        </button>
      </div>
    );
  }
  if (searching) {
    return <p className={styles.emptyLine}>{t('news.search.none')}</p>;
  }
  if (savedSelected) {
    return <p className={styles.emptyLine}>{t('news.saved.none')}</p>;
  }
  return (
    <div className={styles.emptyBox}>
      <p className={styles.emptyTitle}>{t('news.empty.filter.title')}</p>
      <p className={styles.emptyText}>{t('news.empty.filter.body')}</p>
      <button type="button" className={styles.retryButton} onClick={onAll}>
        {t('news.empty.filter.action')}
      </button>
    </div>
  );
}
