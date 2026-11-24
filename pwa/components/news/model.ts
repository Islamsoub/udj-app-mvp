import { getNews } from '@/lib/api-client';
import type { NewsArticleSummary, NewsListResponse } from '@/lib/api-types';
import type { Lang } from '@/lib/i18n-shared';
import type { TranslationKey } from '@/lib/i18n-types';

/**
 * The news screen's data rules.
 *
 * ── WHICH CATEGORY FIELD ─────────────────────────────────────────────────────
 *
 * `news_articles` carries the category twice: a `category` text column holding
 * the slug, and a `category_id` foreign key to `news_categories`. GET /news
 * (backend/src/routes/news.ts) selects and filters on the TEXT column only —
 * `where: { category }`, with the query lowercased — and does not return
 * `categoryId` at all. The slug is therefore the only category identity this
 * screen has, and everything below keys on it.
 *
 * The category NAMES live in `news_categories` and are served by the public
 * GET /news/categories, but this screen's data comes from getNews and
 * getNewsArticle alone, so the labels are in the locale files keyed by slug —
 * all six rows the table holds today, four of them in use.
 */

/**
 * The slugs this client has labels for, in the table's `display_order`.
 *
 * An article whose slug is not here still lists under "Tout", with a generic
 * label; it just gets no chip of its own, because a chip needs a name and
 * showing the raw slug to a student would be worse than showing none.
 */
export const KNOWN_CATEGORIES = [
  'official',
  'events',
  'scolarite',
  'sport',
  'youth',
  'sponsors',
] as const;

export type KnownCategory = (typeof KNOWN_CATEGORIES)[number];

export function isKnownCategory(slug: string): slug is KnownCategory {
  return (KNOWN_CATEGORIES as readonly string[]).includes(slug);
}

/** The label key for a slug, or the generic one for a slug this client does not know. */
export function categoryKey(slug: string): TranslationKey {
  return isKnownCategory(slug) ? `news.category.${slug}` : 'news.category.other';
}

/**
 * The filter chips for a loaded list: "all", then every KNOWN category that at
 * least one article is in, in display order.
 *
 * Derived from the data rather than fixed, so the two categories with no
 * articles (Jeunesse, Sponsors today) do not sit there as permanent dead ends.
 * The SELECTED one is kept even when it has emptied — after a refetch, say — so
 * the control never loses the chip whose empty result it is currently showing.
 */
export function categoryChips(articles: NewsArticleSummary[], selected: string): string[] {
  const present = new Set(articles.map((a) => a.category));
  const chips = KNOWN_CATEGORIES.filter((slug) => present.has(slug) || slug === selected);
  return ['all', ...chips];
}

/**
 * Filters by slug, exactly as the endpoint's own `where: { category }` would.
 *
 * Done here, over one full load, rather than as a request per chip: §9 asks for
 * an INSTANT colour swap, and a round trip plus a 400ms skeleton on every tap —
 * on the connections this app is built for — is the opposite of instant. The
 * backend lowercases the query and compares it to the stored slug; the stored
 * slugs are lowercase and so are these, so the two agree.
 */
export function filterArticles(articles: NewsArticleSummary[], category: string): NewsArticleSummary[] {
  return category === 'all' ? articles : articles.filter((a) => a.category === category);
}

/**
 * The "Enregistrés" pill's id in the same filter as the category slugs. Not a
 * slug any article can have: categories are lowercase words from the admin
 * portal, and this one is reserved here.
 */
export const SAVED_FILTER = '__saved';

/**
 * A title or a query, folded for comparison: accents and other combining marks
 * removed (é → e, and in Arabic the short vowels and the hamza or madda on an
 * alef, so أ إ آ match ا), then lower-cased in the active language. Both sides
 * go through this, so "Évènement", "evenement" and "ÉVÈNEMENT" all meet.
 *
 * Two Arabic letters are also folded, because students type them both ways:
 * ة (ta marbuta) as ه, and ى (alef maqsura) as ي — "المكتبه" finds "المكتبة".
 */
export function foldForSearch(text: string, lang: Lang): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/ة/g, 'ه')
    .replace(/ى/g, 'ي')
    .toLocaleLowerCase(lang)
    .trim();
}

/** The title in the active language — the one the card shows and search reads. */
export function articleTitle(article: NewsArticleSummary, lang: Lang): string {
  return lang === 'ar' ? article.titleAr : article.titleFr;
}

/**
 * What the list shows: the selected pill, then the search on top of it.
 *
 *   • a category slug, or "all" — as filterArticles, newest published first;
 *   • SAVED_FILTER — the saved articles, newest SAVE first (the server's
 *     order). A saved id with no article in the loaded list (withdrawn since,
 *     or rescheduled) is skipped: there is nothing to draw for it.
 *
 * The search is a substring of the title in the active language, folded on
 * both sides (foldForSearch). It covers every published article: the list is
 * loaded whole (loadAllNews), not a page of it.
 */
export function visibleArticles(
  articles: NewsArticleSummary[],
  { filter, savedIds, query, lang }: { filter: string; savedIds: string[]; query: string; lang: Lang }
): NewsArticleSummary[] {
  let shown: NewsArticleSummary[];
  if (filter === SAVED_FILTER) {
    const byId = new Map(articles.map((a) => [a.id, a]));
    shown = savedIds.flatMap((id) => {
      const article = byId.get(id);
      return article === undefined ? [] : [article];
    });
  } else {
    shown = filterArticles(articles, filter);
  }

  const needle = foldForSearch(query, lang);
  if (needle === '') return shown;
  return shown.filter((a) => foldForSearch(articleTitle(a, lang), lang).includes(needle));
}

/**
 * "Articles similaires": `count` other articles, the same category first, then
 * the rest, each group newest first. Newest by publishedAt rather than by list
 * position, so it holds whatever order the caller's list is in.
 */
export function relatedArticles(
  articles: NewsArticleSummary[],
  current: { id: string; category: string },
  count = 2
): NewsArticleSummary[] {
  const newest = (a: NewsArticleSummary, b: NewsArticleSummary) =>
    Date.parse(b.publishedAt) - Date.parse(a.publishedAt);
  const others = articles.filter((a) => a.id !== current.id);
  const same = others.filter((a) => a.category === current.category).sort(newest);
  const rest = others.filter((a) => a.category !== current.category).sort(newest);
  return [...same, ...rest].slice(0, count);
}

/**
 * The backend's ceiling for `limit` (routes/news.ts clamps it to 1-100). Asked
 * for explicitly, because the DEFAULT is 10 — a bare getNews() returns ten of
 * the fifteen articles and says nothing about the other five.
 */
const PAGE_SIZE = 100;

/** A runaway guard, not a product limit: 20 pages is 2,000 articles. */
const MAX_PAGES = 20;

/**
 * Every article, newest first, in as few requests as the endpoint allows.
 *
 * Pages until one comes back short, which is the only end-of-list signal the
 * endpoint gives — it returns no total. Today that is a single request.
 */
export async function loadAllNews(): Promise<NewsListResponse> {
  const articles: NewsArticleSummary[] = [];

  for (let page = 0; page < MAX_PAGES; page++) {
    const { articles: batch } = await getNews({ limit: PAGE_SIZE, offset: page * PAGE_SIZE });
    articles.push(...batch);
    if (batch.length < PAGE_SIZE) break;
  }

  return { articles };
}

/** The query parameter that holds the open article. */
export const ARTICLE_PARAM = 'article';

/** The shareable URL of one article. */
export function articleHref(id: string): string {
  return `/news?${ARTICLE_PARAM}=${encodeURIComponent(id)}`;
}
