'use client';

import { Ban } from 'lucide-react';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useToast } from '@/hooks/use-toast';
import { useDeactivateAdmin } from '@/hooks/queries/use-admins';
import { apiErrorMessage } from '@/lib/utils';
import type { AdminUser } from '@/lib/types';

/**
 * DeactivateAdminModal (supplement §4.4) — soft-deletes the account. Audit
 * history is retained and the account can be reactivated later.
 */
export function DeactivateAdminModal({ admin }: { admin: AdminUser }) {
  const { toast } = useToast();
  const deactivateAdmin = useDeactivateAdmin();

  return (
    <ConfirmModal
      title="Désactiver le compte"
      icon={<Ban size={19} />}
      iconTone="danger"
      body={
        <>
          <b>{admin.name}</b> ne pourra plus se connecter au portail admin. Son historique
          d&rsquo;audit est conservé. Le compte peut être réactivé.
        </>
      }
      confirmLabel="Désactiver"
      busy={deactivateAdmin.isPending}
      onConfirm={async () => {
        try {
          await deactivateAdmin.mutateAsync(admin.id);
        } catch (err) {
          toast(apiErrorMessage(err), 'x');
          return { keep: true } as const;
        }
      }}
    />
  );
}
