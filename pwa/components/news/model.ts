import { getNews } from '@/lib/api-client';
import type { NewsArticleSummary, NewsListResponse } from '@/lib/api-types';
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
