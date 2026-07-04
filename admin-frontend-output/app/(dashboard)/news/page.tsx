'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Copy, Image as ImageIcon, Megaphone, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { EmptyState } from '@/components/shared/empty-state';
import { NewsReader } from '@/components/modals/news-reader';
import { DeleteNewsModal } from '@/components/modals/delete-news-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TextInput } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Menu } from '@/components/ui/dropdown-menu';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useCreateNews, useNews } from '@/hooks/queries/use-news';
import { CATEGORY_LABELS, CATEGORY_TONES } from '@/lib/constants';
import { apiErrorMessage, fmtDate, fmtNumber } from '@/lib/utils';
import type { NewsArticle } from '@/lib/types';

const STRIPES = {
  background: 'repeating-linear-gradient(45deg, var(--surface2) 0 12px, var(--sunken) 12px 24px)',
} as const;

type NewsTab = 'all' | 'published' | 'drafts';

/** News list (impl spec §19). */
export default function NewsPage() {
  const router = useRouter();
  const { open } = useModal();
  const { toast } = useToast();
  const { data: articles } = useNews();
  const createNews = useCreateNews();

  const [tab, setTab] = useState<NewsTab>('all');
  const [query, setQuery] = useState('');

  const all = useMemo(() => articles ?? [], [articles]);
  const published = all.filter((a) => a.publishedAt != null);
  const drafts = all.filter((a) => a.publishedAt == null);

  const list = useMemo(() => {
    const base = tab === 'published' ? published : tab === 'drafts' ? drafts : all;
    const q = query.trim().toLowerCase();
    return q ? base.filter((a) => a.titleFr.toLowerCase().includes(q)) : base;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [all, tab, query]);

  const duplicate = async (a: NewsArticle) => {
    try {
      await createNews.mutateAsync({
        titleFr: `Copie de — ${a.titleFr}`,
        titleAr: a.titleAr,
        bodyFr: a.bodyFr,
        bodyAr: a.bodyAr,
        category: a.category,
        isUrgent: a.isUrgent,
        heroImageUrl: a.heroImageUrl,
      });
      toast('Article dupliqué', 'check');
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const loading = !articles;

  return (
    <div>
      <PageHead
        title="Actualités"
        sub={loading ? undefined : `${published.length} publiées · ${drafts.length} brouillons`}
        actions={
          <Button icon={<Plus size={17} />} onClick={() => router.push('/news/create')}>
            Nouvel article
          </Button>
        }
      />

      {loading ? (
        <div className="h-[420px] animate-pulse rounded-[16px] bg-sunken" />
      ) : (
        <Card pad={0} className="overflow-hidden">
          <div className="flex items-center justify-between gap-3 border-b border-hair p-3">
            <div className="w-[280px]">
              <TextInput
                icon={<Search size={15} />}
                placeholder="Rechercher un article…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            <Tabs<NewsTab>
              tabs={[
                { key: 'all', label: 'Tous', count: all.length },
                { key: 'published', label: 'Publiés', count: published.length },
                { key: 'drafts', label: 'Brouillons', count: drafts.length },
              ]}
              active={tab}
              onChange={setTab}
            />
          </div>

          {list.length === 0 ? (
            <EmptyState
              icon={<Megaphone size={20} />}
              message="Aucun article publié."
              action={
                <Button icon={<Plus size={17} />} onClick={() => router.push('/news/create')}>
                  Créer un article
                </Button>
              }
            />
          ) : (
            <div className="divide-y divide-hair">
              {list.map((a) => {
                const isDraft = a.publishedAt == null;
                const dateStr = a.publishedAt ?? a.createdAt;
                return (
                  <div
                    key={a.id}
                    className="flex cursor-pointer items-center gap-4 px-4 py-3 transition-colors hover:bg-surface2"
                    onClick={() => open(<NewsReader article={a} />)}
                  >
                    <div
                      className="flex h-[56px] w-[80px] shrink-0 items-center justify-center overflow-hidden rounded-[10px]"
                      style={STRIPES}
                    >
                      {a.heroImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={a.heroImageUrl} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <ImageIcon size={18} className="text-ink3" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-[6px]">
                        <Badge tone={CATEGORY_TONES[a.category] ?? 'slate'}>
                          {CATEGORY_LABELS[a.category] ?? a.category}
                        </Badge>
                        {a.isUrgent && (
                          <Badge tone="danger" dot>
                            Urgent
                          </Badge>
                        )}
                        {isDraft && <Badge tone="amber">Brouillon</Badge>}
                      </div>
                      <div className="mt-1 truncate text-[15px] font-bold text-ink">{a.titleFr}</div>
                      <div className="mt-[2px] text-[12.5px] text-ink3">
                        Université de Djibouti
                        {dateStr ? ` · ${fmtDate(dateStr)}` : ''}
                      </div>
                    </div>
                    <div className="shrink-0 font-mono text-[12px] text-ink3">
                      {isDraft ? 'Non publié' : `${fmtNumber(a.viewsCount ?? 0)} vues`}
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/news/create?id=${a.id}`);
                      }}
                      className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-[9px] border-0 bg-transparent text-ink2 transition-colors hover:bg-sunken"
                      aria-label="Modifier"
                    >
                      <Pencil size={15} />
                    </button>
                    <Menu
                      items={[
                        {
                          icon: <Pencil size={15} />,
                          label: 'Modifier',
                          onClick: () => router.push(`/news/create?id=${a.id}`),
                        },
                        {
                          icon: <Copy size={15} />,
                          label: 'Dupliquer',
                          onClick: () => void duplicate(a),
                        },
                        { divider: true },
                        {
                          icon: <Trash2 size={15} />,
                          label: 'Supprimer',
                          tone: 'danger',
                          onClick: () => open(<DeleteNewsModal article={a} />),
                        },
                      ]}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
