'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
/*
 * Imported rather than copied, as Schedule and Attendance do: StateLayers is
 * §5's skeleton crossfade with nothing screen-specific in it, and
 * useReducedMotion is the render-time read of the reduced-motion query that
 * the reader's JS-driven exit needs.
 */
import { useReducedMotion } from '@/components/attendance/useReducedMotion';
import { useCardData } from '@/components/dashboard/useCardData';
import { StateLayers } from '@/components/grades/StateLayers';
import { Toast } from '@/components/shell/Toast';
import { useOnline } from '@/components/shell/useOnline';
import type { NewsArticleSummary, NewsListResponse } from '@/lib/api-types';
import { useI18n } from '@/lib/i18n';
import { useExitBackstop } from '@/lib/useExitBackstop';
import { ARTICLE_PARAM, articleHref, loadAllNews } from './model';

/** The history-state key that counts this screen's reader entries (see `depth`). */
const DEPTH_KEY = 'unipocketNewsDepth';
import { NewsList } from './NewsList';
import { Reader } from './Reader';
import { NewsSkeleton } from './skeletons';
import { useSavedArticles } from './useSavedArticles';
import styles from './news.module.css';

/**
 * The news screen: the article list and, over it, the reader.
 *
 * ── THE READER IS AN IN-PLACE VIEW WITH ITS OWN URL ──────────────────────────
 *
 * Not a separate route, and not URL-less either. Opening an article pushes
 * `/news?article=<id>` onto the history and renders the reader in place, with
 * the list still mounted (hidden) behind it:
 *
 *   • The URL is real. It can be shared, bookmarked, reloaded and opened in a
 *     new tab — a cold load of it opens straight into the reader — and the
 *     browser's Back button closes the reader like "Retour" does.
 *
 *   • The list survives. A route of its own would unmount the list on the way
 *     in and refetch it on the way out: a 400ms skeleton, the chips back on
 *     "Tout", the scroll position gone — on every article, on the connections
 *     this app is for. Here "Retour" returns to exactly the card the student
 *     left, with the filter and the scroll where they were.
 *
 *   • The shell does not notice. The pathname stays /news, so the nav item,
 *     the topbar title and §4's page-load bar treat it as one screen — which it
 *     is: §4 reserves slides for drill-downs like this, not for tab switches.
 *
 * States: the shell owns session expiry and the offline banner. The list's own
 * are here — skeleton with §5's 400ms floor, loaded, empty, error with a retry,
 * offline — plus the empty FILTER, which NewsList owns because it is a
 * property of the chips, not of the response. The reader has its own set.
 */
export function News() {
  return (
    /*
      useSearchParams needs a Suspense boundary above it, or a render that cannot
      read the query would take the whole route down with it. The fallback is
      the screen's own skeleton, so it is indistinguishable from loading.
    */
    <Suspense fallback={<NewsFallback />}>
      <NewsScreen />
    </Suspense>
  );
}

function NewsFallback() {
  const { t } = useI18n();
  return (
    <>
      <h1 className={styles.srOnly}>{t('news.heading')}</h1>
      <div className={styles.screen} aria-hidden="true">
        <NewsSkeleton />
      </div>
    </>
  );
}

function NewsScreen() {
  const { t } = useI18n();
  const { online } = useOnline();
  const reducedMotion = useReducedMotion();

  const state = useCardData<NewsListResponse>(loadAllNews, online);
  /** "all", a category slug, or SAVED_FILTER — one pill pressed at a time. */
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');

  /*
   * The saved ids, loaded once for this visit and shared by the list's
   * "Enregistrés" pill and the reader's button (see useSavedArticles).
   */
  const saved = useSavedArticles(online);
  const [toast, setToast] = useState<string | null>(null);

  const openId = useSearchParams().get(ARTICLE_PARAM);

  /*
   * What is on screen can lag the URL by one animation: when the URL drops the
   * article, the reader stays mounted and plays its exit, and only then does
   * the list come back. `shownId` is the article being RENDERED, `openId` the
   * one the URL asks for.
   *
   * Derived during render rather than in an effect, the way StateLayers does
   * it, so the reader and the URL never disagree for a painted frame.
   */
  const [shownId, setShownId] = useState<string | null>(openId);
  const [leaving, setLeaving] = useState(false);
  const [prevOpenId, setPrevOpenId] = useState(openId);

  if (prevOpenId !== openId) {
    setPrevOpenId(openId);
    if (openId !== null) {
      setShownId(openId);
      setLeaving(false);
    } else if (reducedMotion) {
      // §2: no slide, so nothing to wait for.
      setShownId(null);
    } else {
      setLeaving(true);
    }
  }

  /*
   * How many reader entries THIS screen pushed below the current one, kept on
   * the history entry itself (`history.state`), so it stays right through the
   * browser's own Back and Forward. "Retour" pops one entry while there is one
   * of ours below — so Back and Retour are the same step, from a related
   * article back to the one that linked it, and from there to the list. A
   * reader reached from a shared link has none of ours beneath it —
   * history.back() would leave the app — so it REPLACES its own entry with the
   * list instead. Next's router keeps keys it does not own on the state.
   */
  const depth = (): number => {
    const value = (window.history.state as { [DEPTH_KEY]?: unknown } | null)?.[DEPTH_KEY];
    return typeof value === 'number' ? value : 0;
  };

  /** Scroll position and card to come back to when the reader closes. */
  const returnTo = useRef<{ scrollY: number; id: string } | null>(null);

  const open = (article: NewsArticleSummary, event: React.MouseEvent<HTMLAnchorElement>) => {
    // A modified or non-primary click is the student asking for a new tab or
    // window: the href is real, so the browser does the right thing unaided.
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();

    // From the list only: the place to come back to is the card that opened
    // the first article, not a related one opened from inside the reader.
    if (openId === null) returnTo.current = { scrollY: window.scrollY, id: article.id };
    // Next's router observes pushState, so useSearchParams re-renders with it.
    window.history.pushState({ [DEPTH_KEY]: depth() + 1 }, '', articleHref(article.id));
  };

  const back = () => {
    if (depth() > 0) {
      window.history.back();
    } else {
      window.history.replaceState(null, '', '/news');
    }
  };

  const exited = () => {
    setLeaving(false);
    setShownId(null);
  };

  // animationend is the fast path; this is the floor for a tab hidden mid-exit,
  // whose animation never advances and would leave the reader up forever.
  useExitBackstop(leaving ? shownId : null, exited);

  /*
   * Scroll follows the view. Opening starts the article at its top; closing
   * puts the list back where it was and returns focus to the card that opened
   * the reader (§10: focus returns to the trigger). `instant`, because §4 keeps
   * page-level movement to the slide itself.
   */
  useEffect(() => {
    if (shownId !== null) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      return;
    }

    const target = returnTo.current;
    returnTo.current = null;
    if (target === null) return;

    window.scrollTo({ top: target.scrollY, behavior: 'instant' });
    document
      .querySelector<HTMLAnchorElement>(`a[data-article-id="${CSS.escape(target.id)}"]`)
      ?.focus({ preventScroll: true });
  }, [shownId]);

  const summary =
    shownId !== null && state.phase === 'ready'
      ? (state.data.articles.find((a) => a.id === shownId) ?? null)
      : null;

  return (
    <>
      {/*
        The list stays MOUNTED while the reader is open — hidden, not removed —
        which is what keeps its data, its filter and its images across a read.
      */}
      <div hidden={shownId !== null}>
        {/*
          The page's only h1, visually hidden, as on the other screens: the
          topbar already shows "Actualités". While the reader is open the
          article title is the h1 instead, and this one is hidden with the list.
        */}
        <h1 className={styles.srOnly}>{t('news.heading')}</h1>

        <div className={styles.screen}>
          <StateLayers loading={state.phase === 'loading'} skeleton={<NewsSkeleton />}>
            {state.phase === 'ready' &&
              (state.data.articles.length === 0 ? (
                /*
                  NOTHING PUBLISHED AT ALL — distinct from a category that
                  matched nothing, which NewsList says itself, with a way back.
                  There is nothing to filter here, so no chips either.
                */
                <div className={styles.emptyBox}>
                  <p className={styles.emptyTitle}>{t('news.empty.none.title')}</p>
                  <p className={styles.emptyText}>{t('news.empty.none.body')}</p>
                </div>
              ) : (
                <NewsList
                  articles={state.data.articles}
                  filter={filter}
                  onFilter={setFilter}
                  query={query}
                  onQuery={setQuery}
                  saved={saved}
                  online={online}
                  onOpen={open}
                />
              ))}

            {state.phase === 'error' && (
              <div className={styles.stateBox} role="status" aria-live="polite">
                <p className={styles.stateText}>{t('news.state.error')}</p>
                <button type="button" className={styles.retryButton} onClick={state.retry}>
                  {t('actions.retry')}
                </button>
              </div>
            )}

            {state.phase === 'offline' && (
              <div className={styles.stateBox} role="status" aria-live="polite">
                {/*
                  Nothing is cached — no service worker, no local store — so
                  there is no stale list to show. The shell's banner says the
                  device is offline; this says what that costs here. No retry:
                  it refetches itself when the connection returns.
                */}
                <p className={styles.stateText}>{t('news.state.offline')}</p>
              </div>
            )}
          </StateLayers>
        </div>
      </div>

      {shownId !== null && (
        <div className={styles.readerFrame}>
          <Reader
            key={shownId}
            id={shownId}
            summary={summary}
            articles={state.phase === 'ready' ? state.data.articles : []}
            saved={saved}
            leaving={leaving}
            animate={!reducedMotion}
            onBack={back}
            onExited={exited}
            onOpen={open}
            onMessage={setToast}
          />
        </div>
      )}

      {/* "Lien copié", and a failed save or unsave. */}
      <Toast message={toast} onDone={() => setToast(null)} />
    </>
  );
}
