'use client';

import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { AlertTriangle, Image as ImageIcon, Save, Send } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { RichText } from '@/components/shared/rich-text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/hooks/use-toast';
import { useCreateNews, useNews, useNewsCategories, useUpdateNews } from '@/hooks/queries/use-news';
import { CATEGORY_TONES } from '@/lib/constants';
import { apiErrorMessage, cn } from '@/lib/utils';
import type { CreateNewsInput } from '@/lib/types';

const STRIPES = {
  background: 'repeating-linear-gradient(45deg, var(--surface2) 0 12px, var(--sunken) 12px 24px)',
} as const;

/** Max number of simultaneously-urgent articles (AD §7.3). */
const MAX_URGENT = 3;

/** Strip HTML tags for the plain-text preview / emptiness check. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
}

/** News editor (impl spec §20; Pass C-2 change-set §30.8) — create + edit (?id=). */
export default function NewsCreatePage() {
  return (
    <Suspense fallback={null}>
      <NewsEditor />
    </Suspense>
  );
}

function NewsEditor() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const router = useRouter();
  const { toast } = useToast();
  const { data: articles } = useNews();
  const { data: categories } = useNewsCategories();
  const article = id ? articles?.find((a) => a.id === id) : undefined;
  const create = useCreateNews();
  const update = useUpdateNews();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [push, setPush] = useState(false);

  // Pre-fill once in edit mode.
  const prefilled = useRef(false);
  useEffect(() => {
    if (article && !prefilled.current) {
      prefilled.current = true;
      setTitle(article.titleFr);
      setBody(article.bodyFr);
      setCategory(article.categoryRel?.slug ?? article.category);
      setUrgent(article.isUrgent);
    }
  }, [article]);

  // Urgent articles always push — the toggle auto-enables + locks (§30.8).
  useEffect(() => {
    if (urgent) setPush(true);
  }, [urgent]);

  // Urgent-limit warning: which article would be un-pinned if this becomes urgent.
  const urgentOthers = useMemo(
    () =>
      (articles ?? [])
        .filter((a) => a.isUrgent && a.id !== id)
        .sort((a, b) =>
          (a.publishedAt ?? a.createdAt ?? '').localeCompare(b.publishedAt ?? b.createdAt ?? '')
        ),
    [articles, id]
  );
  const willUnpin = urgent && urgentOthers.length >= MAX_URGENT ? urgentOthers[0] : null;

  const canPublish = title.trim() !== '' && stripHtml(body).trim() !== '';
  const busy = create.isPending || update.isPending;

  const selectedCategory = (categories ?? []).find((c) => c.slug === category);

  const save = async (publishNow: boolean) => {
    const notify = urgent || push;
    const data: CreateNewsInput = {
      titleFr: title.trim(),
      bodyFr: body,
      category: category || 'general',
      categoryId: selectedCategory?.id ?? null,
      isUrgent: urgent,
      sendNotification: notify,
      ...(publishNow ? { publishedAt: new Date().toISOString() } : {}),
    };
    try {
      if (article) await update.mutateAsync({ id: article.id, data });
      else await create.mutateAsync(data);
      if (publishNow) toast(`Article publié${notify ? ' · Étudiants notifiés' : ''}`, 'send');
      else toast('Brouillon enregistré', 'check');
      router.push('/news');
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const previewText = stripHtml(body).trim();

  return (
    <div>
      <PageHead
        back="/news"
        title={id ? "Modifier l'article" : 'Nouvel article'}
        actions={
          <>
            <Button kind="ghost" icon={<Save size={17} />} disabled={busy} onClick={() => save(false)}>
              Enregistrer le brouillon
            </Button>
            <Button
              icon={<Send size={17} />}
              disabled={!canPublish || busy}
              onClick={() => save(true)}
            >
              Publier
            </Button>
          </>
        }
      />

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 320px' }}>
        {/* Editor */}
        <Card>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Titre de l'article…"
            className="w-full border-0 bg-transparent text-[26px] font-extrabold text-ink outline-none placeholder:text-ink3"
          />
          <div className="my-4 border-t border-hair" />
          <button
            type="button"
            onClick={() => toast("Téléversement d'image disponible prochainement")}
            className="flex h-[200px] w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed border-hair2"
            style={STRIPES}
          >
            <ImageIcon size={22} className="text-ink3" />
            <span className="text-[12.5px] text-ink3">
              Glissez une image de couverture · 1200×630 recommandé
            </span>
          </button>
          <div className="mt-4">
            <RichText
              value={body}
              onChange={setBody}
              placeholder="Rédigez votre article…"
              minHeight={260}
            />
          </div>
        </Card>

        {/* Settings column */}
        <div className="flex flex-col gap-4 self-start">
          <Card>
            <div className="mb-3 text-[14px] font-bold text-ink">Catégorie</div>
            <div className="flex flex-wrap gap-[6px]">
              {(categories ?? []).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(c.slug)}
                  className={cn(
                    'cursor-pointer rounded-full border-0 px-3 py-[6px] text-[12.5px] font-semibold transition-colors',
                    category === c.slug
                      ? 'bg-jade text-white'
                      : 'bg-surface2 text-ink2 hover:bg-sunken'
                  )}
                >
                  {c.nameFr}
                </button>
              ))}
              {(categories ?? []).length === 0 && (
                <span className="text-[12.5px] text-ink3">Aucune catégorie configurée.</span>
              )}
            </div>
          </Card>

          <Card>
            <div className="mb-1 text-[14px] font-bold text-ink">Options</div>

            {/* Urgent */}
            <div className="flex items-center justify-between gap-3 border-b border-hair py-3">
              <div>
                <div className="text-[13px] font-semibold text-ink">Marquer comme urgent</div>
                <div className="mt-[2px] text-[11.5px] text-ink3">Bannière rouge dans l&apos;app</div>
              </div>
              <Toggle checked={urgent} onChange={setUrgent} aria-label="Marquer comme urgent" />
            </div>

            {/* Push notification (auto-locked when urgent, §30.8) */}
            <div className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="text-[13px] font-semibold text-ink">Notification push</div>
                  {urgent && (
                    <span className="rounded-full bg-jade-faint px-[7px] py-[1px] text-[10px] font-bold uppercase tracking-[0.06em] text-jade-text">
                      Auto
                    </span>
                  )}
                </div>
                <div className="mt-[2px] text-[11.5px] text-ink3">
                  {urgent
                    ? 'Les articles urgents envoient automatiquement une notification.'
                    : 'Envoyer une notification push à tous les étudiants.'}
                </div>
              </div>
              <Toggle
                checked={push}
                onChange={setPush}
                disabled={urgent}
                aria-label="Notification push"
              />
            </div>

            {/* Urgent-limit warning (§30.8 / AD §7.3) */}
            {willUnpin && (
              <div className="mt-1 flex items-start gap-2 rounded-[10px] bg-amber-bg px-3 py-2 text-[12px] text-amber">
                <AlertTriangle size={14} className="mt-[1px] shrink-0" />
                <span>
                  L&apos;article «&nbsp;{willUnpin.titleFr}&nbsp;» ne sera plus marqué comme urgent.
                </span>
              </div>
            )}
          </Card>

          <Card>
            <div className="mb-3 text-[14px] font-bold text-ink">Aperçu (app étudiante)</div>
            <div className="overflow-hidden rounded-[12px] border border-hair">
              <div className="flex h-[90px] items-center justify-center" style={STRIPES}>
                <ImageIcon size={18} className="text-ink3" />
              </div>
              <div className="p-3">
                <div className="flex flex-wrap items-center gap-[6px]">
                  {selectedCategory && (
                    <Badge tone={CATEGORY_TONES[selectedCategory.slug] ?? 'slate'}>
                      {selectedCategory.nameFr}
                    </Badge>
                  )}
                  {urgent && (
                    <Badge tone="danger" dot>
                      Urgent
                    </Badge>
                  )}
                </div>
                <div className="mt-2 text-[14px] font-bold leading-snug text-ink">
                  {title.trim() || "Titre de l'article"}
                </div>
                {previewText && (
                  <div
                    className="mt-1 overflow-hidden text-[12px] leading-relaxed text-ink2"
                    style={{
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                    }}
                  >
                    {previewText}
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
