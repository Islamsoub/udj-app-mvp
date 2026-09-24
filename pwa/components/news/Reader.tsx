'use client';

import { useEffect, useRef } from 'react';
import { useCardData } from '@/components/dashboard/useCardData';
import { useOnline } from '@/components/shell/useOnline';
import { ApiError, getNewsArticle } from '@/lib/api-client';
import type { NewsArticleDetail, NewsArticleSummary } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { ArticleMeta, ArticleTags } from './ArticleMeta';
import { HeroImage } from './HeroImage';
import { BackIcon } from './icons';
import styles from './news.module.css';

/**
 * The reader view for one article.
 *
 * Mounted with `key={id}`, so each article gets its own fetch and its own state
 * — useCardData re-runs only on retry or reconnect, never on a changed fetcher.
 *
 * ── THE HEADER DOES NOT WAIT FOR THE BODY ────────────────────────────────────
 *
 * Opened from the list, everything above the body — image, tags, title, date —
 * is already known from the summary the card was drawn from. It is shown at
 * once and only the body waits on GET /news/:id, so on a slow connection the
 * student is reading the headline while the text is still in flight. Opened
 * cold from a shared link there is no summary, and the whole view is a skeleton
 * until the detail lands.
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
  leaving,
  animate,
  onBack,
  onExited,
}: {
  id: string;
  /** The list's copy of this article, when it was opened from the list. */
  summary: NewsArticleSummary | null;
  leaving: boolean;
  /** False under prefers-reduced-motion: no slide in either direction. */
  animate: boolean;
  onBack: () => void;
  /** Called when the leaving slide has finished, so the list can come back. */
  onExited: () => void;
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
      <button type="button" className={styles.back} onClick={onBack}>
        <BackIcon className={styles.backIcon} />
        {t('news.reader.back')}
      </button>

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
              <HeroImage src={head.heroImageUrl} className={styles.readerHero} eager />
              <ArticleTags category={head.category} urgent={head.isUrgent} />
              <h1 className={styles.readerTitle}>{lang === 'ar' ? head.titleAr : head.titleFr}</h1>
              <ArticleMeta publishedAt={head.publishedAt} readTime={head.readTimeMinutes} />
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
          {paragraph}
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
