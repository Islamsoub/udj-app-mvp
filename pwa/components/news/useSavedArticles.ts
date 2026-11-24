'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getSavedArticles, saveArticle, unsaveArticle } from '@/lib/api-client';

/**
 * The student's saved articles ("Enregistrer"), held once for the news screen
 * and shared by the list's "Enregistrés" pill and the reader's button.
 *
 * ── LOADED ONCE PER VISIT, AND AFTER EACH CHANGE ─────────────────────────────
 *
 * Fetched when the screen mounts, again when the connection comes back, and
 * again after every save or unsave the server has confirmed, so the list
 * always shows what the server holds (another device may have changed it).
 *
 * ── THE SERVER DECIDES, THE SCREEN FOLLOWS ───────────────────────────────────
 *
 * Not optimistic. A toggle changes nothing until its PUT or DELETE resolves;
 * then the id is added or removed. On failure nothing changed, so there is
 * nothing to roll back: the caller shows a short message and the button stays
 * as it was. One request per article at a time (`pending`), so a double tap
 * cannot race itself.
 *
 * ── NOT CACHED ───────────────────────────────────────────────────────────────
 *
 * The ids live in this component's memory only, never in the offline store:
 * lab machines are shared, and what a student saved is theirs. Offline, the
 * list says a connection is needed and the button is disabled.
 */

export type SavedPhase = 'loading' | 'ready' | 'error' | 'offline';

export interface SavedArticles {
  phase: SavedPhase;
  /** Saved ids, newest save first. Empty until `phase` is ready. */
  ids: string[];
  isSaved: (articleId: string) => boolean;
  /** Ids with a save or unsave in flight. */
  pending: ReadonlySet<string>;
  /** Saves or unsaves one article. Resolves true once the server confirmed,
   *  false if it failed (state unchanged). */
  toggle: (articleId: string) => Promise<boolean>;
  retry: () => void;
}

export function useSavedArticles(online: boolean): SavedArticles {
  const [phase, setPhase] = useState<SavedPhase>(online ? 'loading' : 'offline');
  const [ids, setIds] = useState<string[]>([]);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());

  /** Bumped by every load, so an older response never overwrites a newer one. */
  const generation = useRef(0);
  const idsRef = useRef(ids);
  idsRef.current = ids;

  const load = useCallback(async (quiet: boolean) => {
    const mine = ++generation.current;
    if (!quiet) setPhase('loading');
    try {
      const { savedArticles } = await getSavedArticles();
      if (mine !== generation.current) return;
      setIds(savedArticles.map((s) => s.articleId));
      setPhase('ready');
    } catch {
      if (mine !== generation.current) return;
      // A quiet refresh after a confirmed change keeps what is on screen: the
      // change itself already landed.
      if (!quiet) setPhase(navigator.onLine ? 'error' : 'offline');
    }
  }, []);

  useEffect(() => {
    if (!online) {
      setPhase('offline');
      return;
    }
    void load(false);
  }, [online, load]);

  const toggle = useCallback(
    async (articleId: string) => {
      if (pending.has(articleId)) return false;
      const wasSaved = idsRef.current.includes(articleId);

      setPending((current) => new Set(current).add(articleId));
      try {
        if (wasSaved) await unsaveArticle(articleId);
        else await saveArticle(articleId);

        setIds((current) =>
          wasSaved ? current.filter((id) => id !== articleId) : [articleId, ...current]
        );
        void load(true);
        return true;
      } catch {
        return false;
      } finally {
        setPending((current) => {
          const next = new Set(current);
          next.delete(articleId);
          return next;
        });
      }
    },
    [pending, load]
  );

  const isSaved = useCallback((articleId: string) => ids.includes(articleId), [ids]);
  const retry = useCallback(() => void load(false), [load]);

  return { phase, ids, isSaved, pending, toggle, retry };
}
