'use client';

import { Info } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useModal } from '@/hooks/use-modal';

/**
 * ForgotModal (impl spec §28, supplement §2.5) — self-service reset is not
 * available in MVP; contact a super admin.
 */
export function ForgotModal() {
  const { close } = useModal();
  return (
    <Modal
      title="Réinitialisation du mot de passe"
      icon={<Info size={19} />}
      iconTone="blue"
      width={420}
      footer={
        <Button kind="primary" onClick={close}>
          Compris
        </Button>
      }
    >
      <div className="text-[13.5px] leading-relaxed text-ink2">
        La réinitialisation en libre-service n&apos;est pas disponible. Contactez un super
        administrateur pour réinitialiser votre mot de passe.
      </div>
    </Modal>
  );
}
