'use client';

import { UserCircle } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/shared/avatar';
import { useModal } from '@/hooks/use-modal';
import { useAdmin } from '@/hooks/use-admin';
import { useFaculties } from '@/hooks/queries/use-academics';
import { ROLE_META } from '@/lib/constants';

/**
 * ProfileModal (impl spec §28) — read-only current-user profile. Editable
 * only by a super admin from the Administrateurs page.
 */
function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-[7px] text-[13px]">
      <span className="text-ink3">{label}</span>
      <span className="font-semibold text-ink">{value}</span>
    </div>
  );
}

export function ProfileModal() {
  const { close } = useModal();
  const admin = useAdmin();
  const { data: faculties } = useFaculties();

  if (!admin) return null;

  const meta = ROLE_META[admin.role];
  const perimeter = admin.facultyId
    ? (faculties?.find((f) => f.id === admin.facultyId)?.nameFr ?? '—')
    : 'Direction / Scolarité';

  return (
    <Modal
      title="Mon profil"
      icon={<UserCircle size={19} />}
      iconTone="jade"
      width={420}
      footer={
        <Button kind="primary" onClick={close}>
          Fermer
        </Button>
      }
    >
      <div className="flex flex-col items-center pt-1 text-center">
        <Avatar name={admin.name} size={64} ring />
        <div className="mt-3 text-[17px] font-extrabold text-ink">{admin.name}</div>
        <div className="mt-[2px] text-[13px] text-ink2">{admin.email}</div>
        <div className="mt-2">
          <Badge tone={meta.tone}>{meta.label}</Badge>
        </div>
      </div>
      <div className="mt-4 border-t border-hair pt-2">
        <InfoRow label="Rôle" value={admin.roleLabel} />
        <InfoRow label="Périmètre" value={perimeter} />
        <InfoRow label="Dernière connexion" value="—" />
      </div>
      <div className="mt-3 text-[11.5px] text-ink3">
        Modifiable par un super administrateur depuis la page Administrateurs.
      </div>
    </Modal>
  );
}
