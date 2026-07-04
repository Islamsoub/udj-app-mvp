'use client';

import { useState, type ReactNode } from 'react';
import { AlertTriangle, GraduationCap, RotateCcw } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextArea } from '@/components/ui/input';
import { FField } from '@/components/ui/form-helpers';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useUpdateStudentStatus } from '@/hooks/queries/use-students';
import { apiErrorMessage } from '@/lib/utils';
import type { Tone } from '@/lib/tokens';
import type { StudentStatus } from '@/lib/types';

/**
 * StatusModal (impl spec §28, supplement §4.2) — suspend / graduate /
 * reactivate a student, with config-per-action and optional reason.
 */
export type StatusAction = 'suspend' | 'graduate' | 'reactivate';

interface ActionConfig {
  icon: ReactNode;
  tone: Tone;
  title: string;
  body: (name: string, matricule: string) => ReactNode;
  note?: string;
  buttonLabel: string;
  buttonKind: 'primary' | 'danger';
  status: StudentStatus;
  toast: string;
}

const CONFIG: Record<StatusAction, ActionConfig> = {
  suspend: {
    icon: <AlertTriangle size={19} />,
    tone: 'amber',
    title: "Suspendre l'étudiant",
    body: (name, matricule) => (
      <>
        <b className="text-ink">{name}</b> (
        <span className="font-mono text-[12.5px]">{matricule}</span>) ne pourra plus accéder à
        l&apos;application.
      </>
    ),
    note: 'Cette action est réversible.',
    buttonLabel: 'Suspendre',
    buttonKind: 'danger',
    status: 'SUSPENDED',
    toast: 'Étudiant suspendu',
  },
  graduate: {
    icon: <GraduationCap size={19} />,
    tone: 'blue',
    title: 'Marquer comme diplômé',
    body: (name, matricule) => (
      <>
        <b className="text-ink">{name}</b> (
        <span className="font-mono text-[12.5px]">{matricule}</span>) sera marqué comme diplômé,
        accès en lecture seule.
      </>
    ),
    buttonLabel: 'Marquer diplômé',
    buttonKind: 'primary',
    status: 'GRADUATED',
    toast: 'Étudiant marqué diplômé',
  },
  reactivate: {
    icon: <RotateCcw size={19} />,
    tone: 'jade',
    title: "Réactiver l'étudiant",
    body: (name, matricule) => (
      <>
        <b className="text-ink">{name}</b> (
        <span className="font-mono text-[12.5px]">{matricule}</span>) retrouvera l&apos;accès à
        l&apos;application.
      </>
    ),
    buttonLabel: 'Réactiver',
    buttonKind: 'primary',
    status: 'ACTIVE',
    toast: 'Étudiant réactivé',
  },
};

export function StatusModal({
  student,
  action,
}: {
  student: { id: string; name: string; matricule: string };
  action: StatusAction;
}) {
  const cfg = CONFIG[action];
  const { close } = useModal();
  const { toast } = useToast();
  const updateStatus = useUpdateStudentStatus();
  const [reason, setReason] = useState('');

  const handleConfirm = async () => {
    try {
      await updateStatus.mutateAsync({
        id: student.id,
        status: cfg.status,
        reason: reason.trim() || undefined,
      });
      toast(cfg.toast, 'check');
      close();
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  return (
    <Modal
      title={cfg.title}
      icon={cfg.icon}
      iconTone={cfg.tone}
      width={440}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            Annuler
          </Button>
          <Button kind={cfg.buttonKind} disabled={updateStatus.isPending} onClick={handleConfirm}>
            {cfg.buttonLabel}
          </Button>
        </>
      }
    >
      <div className="text-[13.5px] leading-relaxed text-ink2">
        {cfg.body(student.name, student.matricule)}
      </div>
      <div className="mt-4">
        <FField label="Raison (optionnel)">
          <TextArea
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Ajouter une raison…"
          />
        </FField>
      </div>
      {cfg.note && <div className="mt-1 text-[12.5px] text-ink3">{cfg.note}</div>}
    </Modal>
  );
}
