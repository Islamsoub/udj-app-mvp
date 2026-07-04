'use client';

import { useState } from 'react';
import { Copy, KeyRound } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useResetStudentPassword } from '@/hooks/queries/use-students';
import { apiErrorMessage } from '@/lib/utils';

/**
 * ResetPwModal (impl spec §28, supplement §4.1). Confirm → generates a temp
 * password shown in a jadeFaint box with a Copier button; footer swaps to
 * "Terminé".
 */
export function ResetPwModal({
  student,
}: {
  student: { id: string; name: string; matricule: string };
}) {
  const { close } = useModal();
  const { toast } = useToast();
  const resetPassword = useResetStudentPassword();
  const [newPassword, setNewPassword] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleReset = async () => {
    try {
      const res = await resetPassword.mutateAsync(student.id);
      setNewPassword(res.newPassword);
      toast('Mot de passe réinitialisé', 'check');
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const handleCopy = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <Modal
      title="Réinitialiser le mot de passe"
      icon={<KeyRound size={19} />}
      iconTone="amber"
      width={440}
      footer={
        newPassword ? (
          <Button kind="primary" onClick={close}>
            Terminé
          </Button>
        ) : (
          <>
            <Button kind="quiet" onClick={close}>
              Annuler
            </Button>
            <Button kind="dangerSolid" disabled={resetPassword.isPending} onClick={handleReset}>
              Réinitialiser
            </Button>
          </>
        )
      }
    >
      <div className="text-[13.5px] leading-relaxed text-ink2">
        Le mot de passe de <b className="text-ink">{student.name}</b> (
        <span className="font-mono text-[12.5px]">{student.matricule}</span>) sera remplacé par un
        mot de passe temporaire. L&apos;étudiant devra se reconnecter avec le nouveau mot de passe.
      </div>
      {newPassword && (
        <div className="mt-4 flex items-center justify-between gap-3 rounded-[12px] bg-jade-faint p-4">
          <span className="font-mono text-[15px] font-bold text-jade-text">{newPassword}</span>
          <Button kind="soft" size="sm" icon={<Copy size={14} />} onClick={handleCopy}>
            {copied ? 'Copié ✓' : 'Copier'}
          </Button>
        </div>
      )}
    </Modal>
  );
}
