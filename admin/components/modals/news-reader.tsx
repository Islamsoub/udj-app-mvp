'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Image as ImageIcon, Megaphone } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DeleteNewsModal } from '@/components/modals/delete-news-modal';
import { useModal } from '@/hooks/use-modal';
import { CATEGORY_LABELS, CATEGORY_TONES } from '@/lib/constants';
import { fmtDate, fmtNumber } from '@/lib/utils';
import type { NewsArticle } from '@/lib/types';

const STRIPES = {
  background: 'repeating-linear-gradient(45deg, var(--surface2) 0 12px, var(--sunken) 12px 24px)',
} as const;

/** NewsReader (impl spec §28, supplement §5.1) — read-only article preview. */
export function NewsReader({ article }: { article: NewsArticle }) {
  const router = useRouter();
  const { open, close } = useModal();
  const published = article.publishedAt != null;
  const [imgError, setImgError] = useState(false);
  const showImg = article.heroImageUrl && !imgError;

  return (
    <Modal
      title={article.titleFr}
      sub={`Université de Djibouti${published ? ` · ${fmtDate(article.publishedAt!)}` : ''}`}
      icon={<Megaphone size={19} />}
      iconTone="exam"
      width={640}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            Fermer
          </Button>
          {/* Modifier is the expected action from a row click; Supprimer stays
              reachable but loses its fill so it is not the visual focus. */}
          <Button
            kind="quiet"
            className="text-danger hover:bg-danger-bg"
            onClick={() => open(<DeleteNewsModal article={article} />)}
          >
            Supprimer
          </Button>
          <Button
            kind="primary"
            onClick={() => {
              close();
              router.push(`/news/create?id=${article.id}`);
            }}
          >
            Modifier
          </Button>
        </>
      }
    >
      {showImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={article.heroImageUrl!}
          alt=""
          className="h-[200px] w-full rounded-[12px] object-cover"
          onError={() => setImgError(true)}
        />
      ) : (
        <div
          className="flex h-[200px] items-center justify-center rounded-[12px]"
          style={STRIPES}
        >
          <ImageIcon size={24} className="text-ink3" />
        </div>
      )}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Badge tone={CATEGORY_TONES[article.category] ?? 'slate'}>
          {CATEGORY_LABELS[article.category] ?? article.category}
        </Badge>
        {article.isUrgent && (
          <Badge tone="danger" dot>
            Urgent
          </Badge>
        )}
      </div>
      <h2 className="mt-3 text-[20px] font-extrabold leading-snug text-ink">{article.titleFr}</h2>
      {published && (
        <div className="mt-2 font-mono text-[11px] text-ink3">
          {article.readTimeMinutes} min de lecture · {fmtNumber(article.viewsCount ?? 0)} vues
        </div>
      )}
      <div
        className="rich-body mt-4 text-[14px] leading-relaxed text-ink2"
        dangerouslySetInnerHTML={{ __html: article.bodyFr }}
      />
    </Modal>
  );
}
