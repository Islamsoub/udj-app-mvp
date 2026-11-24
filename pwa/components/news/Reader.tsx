'use client';

import { useEffect, useRef } from 'react';
import { useCardData } from '@/components/dashboard/useCardData';
import { useOnline } from '@/components/shell/useOnline';
import { ApiError, getNewsArticle } from '@/lib/api-client';
import type { NewsArticleDetail, NewsArticleSummary } from '@/lib/api-types';
import { isolateLtrRuns } from '@/lib/bidi';
import { useI18n } from '@/lib/i18n';
import { ArticleMeta, ArticleTags, CategoryPill } from './ArticleMeta';
import { HeroImage } from './HeroImage';
import { BackIcon, BookmarkIcon, ShareIcon } from './icons';
import { articleHref, articleTitle, relatedArticles } from './model';
import type { SavedArticles } from './useSavedArticles';
import styles from './news.module.css';

const OFFLINE_HINT_ID = 'news-reader-save-offline';

/**
 * The reader view for one article, as the prototype's openReader(): the top
 * bar (.reader-top: "Retour" on the start, Enregistrer and Partager on the
 * end), the picture full width with the source pill, the article, then
 * "Articles similaires".
 *
 * Mounted with `key={id}`, so each article gets its own fetch and its own state
 * — useCardData re-runs only on retry or reconnect, never on a changed fetcher.
 *
 * ── THE HEADER DOES NOT WAIT FOR THE BODY ────────────────────────────────────
 *
 * Opened from the list, everything above the body — image, tags, title, date —
 * is already known from the summary the card was drawn from. It is shown at
 * once and only the body waits on GET /news/:id. Opened cold from a shared link
 * there is no summary, and the whole view is a skeleton until the detail lands.
 *
 * ── NOT FOUND IS NOT AN ERROR ────────────────────────────────────────────────
 *
 * A deleted article, or a mangled link, answers 404 (or 400 for an id that is
 * not a UUID). Retrying will not change that, so it is its own message without
 * a retry button — unlike a failed request, which gets one.
 */
export function Reader({
  id,
  summary,
  articles,
  saved,
  leaving,
  animate,
  onBack,
  onExited,
  onOpen,
  onMessage,
}: {
  id: string;
  /** The list's copy of this article, when it was opened from the list. */
  summary: NewsArticleSummary | null;
  /** The loaded list, for "Articles similaires" (empty until it has loaded). */
  articles: NewsArticleSummary[];
  saved: SavedArticles;
  leaving: boolean;
  /** False under prefers-reduced-motion: no slide in either direction. */
  animate: boolean;
  onBack: () => void;
  /** Called when the leaving slide has finished, so the list can come back. */
  onExited: () => void;
  /** Opens another article in place (a related one). */
  onOpen: (article: NewsArticleSummary, event: React.MouseEvent<HTMLAnchorElement>) => void;
  /** A short transient message (the shell's toast). */
  onMessage: (message: string) => void;
}) {
  const { t, lang, dir } = useI18n();
  const { online } = useOnline();

  const state = useCardData<NewsArticleDetail | null>(() => loadArticle(id), online);

  const detail = state.phase === 'ready' ? state.data : null;
  const notFound = state.phase === 'ready' && state.data === null;
  const head: NewsArticleSummary | null = detail ?? summary;

  /*
   * Focus moves into the reader when it opens (§10: focus follows the view the
   * student just asked for) and lands on the view itself, so a screen reader
   * starts from the top of the article rather than from "Retour".
   */
  const rootRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    rootRef.current?.focus({ preventScroll: true });
  }, []);

  const motion = !animate ? '' : leaving ? styles.readerLeaving : styles.readerEntering;

  const isSaved = saved.isSaved(id);
  const busy = saved.pending.has(id);
  // Saving needs the server, and the saved list must be known to say which way
  // the toggle goes: offline, or before it has loaded, the button waits.
  const canSave = online && saved.phase === 'ready' && !notFound;

  const toggleSave = async () => {
    const ok = await saved.toggle(id);
    if (!ok) onMessage(t(isSaved ? 'news.reader.unsave_failed' : 'news.reader.save_failed'));
  };

  const share = async () => {
    const url = new URL(articleHref(id), window.location.origin).toString();
    const title = head === null ? '' : articleTitle(head, lang);

    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch (err) {
        // The student closed the share sheet: nothing to say.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Any other refusal (no share target, a blocked permission) falls
        // through to the copy.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      onMessage(t('news.reader.link_copied'));
    } catch {
      onMessage(t('news.reader.copy_failed'));
    }
  };

  const related = head === null ? [] : relatedArticles(articles, head);

  return (
    <article
      ref={rootRef}
      tabIndex={-1}
      className={`${styles.reader} ${motion}`}
      /*
        §6: the slide direction is read from the active `dir` when the
        animation runs, never assumed LTR — inline-end is +x in French, -x in
        Arabic, and a transform is not mirrored by `dir` on its own.
      */
      style={{ '--slide-dir': dir === 'rtl' ? -1 : 1 } as React.CSSProperties}
      onAnimationEnd={(event) => {
        if (leaving && event.target === event.currentTarget) onExited();
      }}
    >
      {/* .reader-top: "Retour" on the start, the actions on the end. */}
      <div className={styles.readerTop}>
        <button type="button" className={styles.back} onClick={onBack}>
          <BackIcon className={styles.backIcon} />
          {t('news.reader.back')}
        </button>

        {!notFound && (
          <div className={styles.readerActions}>
            {!online && (
              <span id={OFFLINE_HINT_ID} className={styles.readerHint}>
                {t('news.reader.offline_save')}
              </span>
            )}
            {/*
              The state is the server's: the icon fills only once the PUT has
              come back, and empties only once the DELETE has. aria-pressed says
              which; the label stays the action's name.
            */}
            <button
              type="button"
              className={`${styles.iconButton} ${isSaved ? styles.iconButtonOn : ''}`}
              aria-label={t('news.reader.save')}
              aria-pressed={isSaved}
              aria-busy={busy || undefined}
              aria-describedby={!online ? OFFLINE_HINT_ID : undefined}
              title={!online ? t('news.reader.offline_save') : t('news.reader.save')}
              disabled={!canSave || busy}
              onClick={toggleSave}
            >
              <BookmarkIcon className={styles.iconButtonGlyph} filled={isSaved} />
            </button>
            <button
              type="button"
              className={styles.iconButton}
              aria-label={t('news.reader.share')}
              title={t('news.reader.share')}
              disabled={head === null}
              onClick={share}
            >
              <ShareIcon className={styles.iconButtonGlyph} />
            </button>
          </div>
        )}
      </div>

      {notFound ? (
        <div className={styles.emptyBox}>
          <p className={styles.emptyTitle}>{t('news.reader.not_found.title')}</p>
          <p className={styles.emptyText}>{t('news.reader.not_found.body')}</p>
        </div>
      ) : (
        <>
          {head === null ? (
            <ReaderHeadSkeleton />
          ) : (
            <header className={styles.readerHead}>
              {/* .reader-hero-img: full width, the source pill at the bottom
                  start corner, over the picture or the stripe. */}
              <HeroImage src={head.heroImageUrl} className={styles.readerHero} eager>
                <span className={styles.sourcePill}>{t('news.reader.source')}</span>
              </HeroImage>
              <ArticleTags category={head.category} urgent={head.isUrgent} />
              <h1 className={styles.readerTitle}>{isolateLtrRuns(articleTitle(head, lang))}</h1>
              <span className={styles.readerMeta}>
                <ArticleMeta publishedAt={head.publishedAt} readTime={head.readTimeMinutes} />
              </span>
            </header>
          )}

          {detail !== null && <ReaderBody text={lang === 'ar' ? detail.bodyAr : detail.bodyFr} />}

          {state.phase === 'loading' && <ReaderBodySkeleton />}

          {state.phase === 'error' && (
            <div className={styles.stateBox} role="status" aria-live="polite">
              <p className={styles.stateText}>{t('news.reader.error')}</p>
              <button type="button" className={styles.retryButton} onClick={state.retry}>
                {t('actions.retry')}
              </button>
            </div>
          )}

          {state.phase === 'offline' && (
            <div className={styles.stateBox} role="status" aria-live="polite">
              {/* Nothing is cached, so no text to fall back to. It refetches on
                  its own the moment the connection returns. */}
              <p className={styles.stateText}>{t('news.reader.offline')}</p>
            </div>
          )}

          {related.length > 0 && (
            <section aria-labelledby="news-related">
              <h2 id="news-related" className={styles.relatedLabel}>
                {t('news.reader.related')}
              </h2>
              <ul className={styles.relatedGrid}>
                {related.map((article) => (
                  <li key={article.id} className={styles.gridItem}>
                    <a
                      href={articleHref(article.id)}
                      className={styles.relatedCard}
                      onClick={(event) => onOpen(article, event)}
                    >
                      <HeroImage src={article.heroImageUrl} className={styles.relatedThumb} />
                      <span className={styles.relatedRight}>
                        <CategoryPill category={article.category} />
                        <span className={styles.relatedTitle}>
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
            </section>
          )}
        </>
      )}
    </article>
  );
}

/**
 * The article, or null when the server says there is no such article.
 * Any other failure is rethrown and becomes the error state, with its retry.
 */
async function loadArticle(id: string): Promise<NewsArticleDetail | null> {
  try {
    return await getNewsArticle(id);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 400)) return null;
    throw err;
  }
}

/**
 * The body, split into paragraphs on blank lines, single line breaks kept.
 *
 * Plain text rendered as text — never as HTML. The bodies are 344-931
 * characters, so there is no in-article pagination: it is one short read.
 */
function ReaderBody({ text }: { text: string }) {
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  return (
    <div className={styles.readerBody}>
      {paragraphs.map((paragraph, index) => (
        <p key={index} className={styles.readerParagraph}>
          {isolateLtrRuns(paragraph)}
        </p>
      ))}
    </div>
  );
}

/** The header's footprint: the image frame, a pill, two title lines, the meta line. */
function ReaderHeadSkeleton() {
  return (
    <div className={styles.readerHead} aria-hidden="true">
      <div className={`${styles.skeleton} ${styles.readerHero}`} />
      <div className={`${styles.skeleton} ${styles.skeletonPill}`} />
      <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
      <div className={`${styles.skeleton} ${styles.skeletonTitleShort}`} />
      <div className={`${styles.skeleton} ${styles.skeletonMeta}`} />
    </div>
  );
}

/** Four body lines — the shortest article is a paragraph or two. */
function ReaderBodySkeleton() {
  return (
    <div className={styles.readerBody} aria-hidden="true">
      <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
      <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
      <div className={`${styles.skeleton} ${styles.skeletonLine}`} />
      <div className={`${styles.skeleton} ${styles.skeletonLineShort}`} />
    </div>
  );
}
