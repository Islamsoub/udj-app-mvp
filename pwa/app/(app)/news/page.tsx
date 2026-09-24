import { News } from '@/components/news/News';

/**
 * News. A server component wrapping one client island — the shell around it
 * already resolved the language and the session, so this route adds nothing but
 * the content. The reader lives here too, at /news?article=<id>; see News.tsx
 * for why it is not a route of its own.
 */
export default function NewsPage() {
  return <News />;
}
