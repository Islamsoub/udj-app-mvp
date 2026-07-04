'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Image as ImageIcon, Save, Send } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { RichText } from '@/components/shared/rich-text';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Toggle } from '@/components/ui/toggle';
import { useToast } from '@/hooks/use-toast';
import { useCreateNews, useNews, useUpdateNews } from '@/hooks/queries/use-news';
import { CATEGORY_LABELS, CATEGORY_TONES } from '@/lib/constants';
import { apiErrorMessage, cn } from '@/lib/utils';
import type { CreateNewsInput } from '@/lib/types';

const STRIPES = {
  background: 'repeating-linear-gradient(45deg, var(--surface2) 0 12px, var(--sunken) 12px 24px)',
} as const;

/** Strip HTML tags for the plain-text preview / emptiness check. */
function stripHtml(html: string): string {
  return html.replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ');
}

/** News editor (impl spec §20) — create + edit (?id=). */
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
  const article = id ? articles?.find((a) => a.id === id) : undefined;
  const create = useCreateNews();
  const update = useUpdateNews();

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [category, setCategory] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [push, setPush] = useState(true);

  // Pre-fill once in edit mode.
  const prefilled = useRef(false);
  useEffect(() => {
    if (article && !prefilled.current) {
      prefilled.current = true;
      setTitle(article.titleFr);
      setBody(article.bodyFr);
      setCategory(article.category);
      setUrgent(article.isUrgent);
    }
  }, [article]);

  const canPublish = title.trim() !== '' && stripHtml(body).trim() !== '';
  const busy = create.isPending || update.isPending;

  const save = async (publishNow: boolean) => {
    const data: CreateNewsInput = {
      titleFr: title.trim(),
      bodyFr: body,
      category: category || 'general',
      isUrgent: urgent,
      ...(publishNow ? { publishedAt: new Date().toISOString() } : {}),
    };
    try {
      if (article) await update.mutateAsync({ id: article.id, data });
      else await create.mutateAsync(data);
      if (publishNow) toast(`Article publié${push ? ' · Étudiants notifiés' : ''}`, 'send');
      else toast('Brouillon enregistré', 'check');
      router.push('/news');
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const categories = Object.entries(CATEGORY_LABELS).filter(([key]) => key !== 'general');
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
              {categories.map(([key, label]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setCategory(key)}
                  className={cn(
                    'cursor-pointer rounded-full border-0 px-3 py-[6px] text-[12.5px] font-semibold transition-colors',
                    category === key
                      ? 'bg-jade text-white'
                      : 'bg-surface2 text-ink2 hover:bg-sunken'
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          </Card>

          <Card>
            <div className="mb-1 text-[14px] font-bold text-ink">Options</div>
            <div className="flex items-center justify-between gap-3 border-b border-hair py-3">
              <div>
                <div className="text-[13px] font-semibold text-ink">Marquer comme urgent</div>
                <div className="mt-[2px] text-[11.5px] text-ink3">Bannière rouge dans l&apos;app</div>
              </div>
              <Toggle checked={urgent} onChange={setUrgent} aria-label="Marquer comme urgent" />
            </div>
            <div className="flex items-center justify-between gap-3 py-3">
              <div>
                <div className="text-[13px] font-semibold text-ink">Notification push</div>
                <div className="mt-[2px] text-[11.5px] text-ink3">
                  Notifier les étudiants à la publication
                </div>
              </div>
              <Toggle checked={push} onChange={setPush} aria-label="Notification push" />
            </div>
          </Card>

          <Card>
            <div className="mb-3 text-[14px] font-bold text-ink">Aperçu (app étudiante)</div>
            <div className="overflow-hidden rounded-[12px] border border-hair">
              <div className="flex h-[90px] items-center justify-center" style={STRIPES}>
                <ImageIcon size={18} className="text-ink3" />
              </div>
              <div className="p-3">
                <div className="flex flex-wrap items-center gap-[6px]">
                  {category && (
                    <Badge tone={CATEGORY_TONES[category] ?? 'slate'}>
                      {CATEGORY_LABELS[category] ?? category}
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
