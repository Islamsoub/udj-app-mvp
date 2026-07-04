'use client';

import { Trash2 } from 'lucide-react';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useToast } from '@/hooks/use-toast';
import { useDeleteNews } from '@/hooks/queries/use-news';
import { apiErrorMessage } from '@/lib/utils';
import type { NewsArticle } from '@/lib/types';

/** DeleteNewsModal (supplement §4.3) — permanent-delete confirm. */
export function DeleteNewsModal({ article }: { article: NewsArticle }) {
  const remove = useDeleteNews();
  const { toast } = useToast();

  return (
    <ConfirmModal
      title="Supprimer l'article"
      icon={<Trash2 size={19} />}
      iconTone="danger"
      body={
        <>
          « {article.titleFr} » sera définitivement supprimé. Les étudiants ne verront plus cet
          article dans l&apos;application. <b>Cette action est irréversible.</b>
        </>
      }
      confirmLabel="Supprimer"
      confirmKind="dangerSolid"
      busy={remove.isPending}
      onConfirm={async () => {
        try {
          await remove.mutateAsync(article.id);
        } catch (err) {
          toast(apiErrorMessage(err), 'x');
          return { keep: true };
        }
      }}
    />
  );
}
