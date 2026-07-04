'use client';

import { useState, type ReactNode } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { useModal } from '@/hooks/use-modal';
import type { Tone } from '@/lib/tokens';

/**
 * ConfirmModal (impl spec §6): built on Modal, width 440, danger by default.
 * Optional `requireText` gates the confirm button until the user types the
 * exact string (Close-semester). onConfirm may return {keep:true} to keep the
 * modal open (e.g. to show a generated value).
 */
export interface ConfirmModalProps {
  title: string;
  sub?: string;
  icon?: ReactNode;
  iconTone?: Tone;
  body: ReactNode;
  confirmLabel: string;
  confirmKind?: 'primary' | 'soft' | 'danger' | 'dangerSolid';
  cancelLabel?: string;
  requireText?: string;
  onConfirm: () => void | { keep: true } | Promise<void | { keep: true }>;
  busy?: boolean;
}

export function ConfirmModal({
  title,
  sub,
  icon = <AlertTriangle size={19} />,
  iconTone = 'danger',
  body,
  confirmLabel,
  confirmKind = 'dangerSolid',
  cancelLabel = 'Annuler',
  requireText,
  onConfirm,
  busy,
}: ConfirmModalProps) {
  const { close } = useModal();
  const [typed, setTyped] = useState('');
  const [pending, setPending] = useState(false);
  const gated = requireText != null && typed !== requireText;

  const handleConfirm = async () => {
    setPending(true);
    try {
      const result = await onConfirm();
      if (!(result && typeof result === 'object' && result.keep)) close();
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      title={title}
      sub={sub}
      icon={icon}
      iconTone={iconTone}
      width={440}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            {cancelLabel}
          </Button>
          <Button kind={confirmKind} disabled={gated || pending || busy} onClick={handleConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-[13.5px] leading-relaxed text-ink2">{body}</div>
      {requireText != null && (
        <div className="mt-4">
          <div className="mb-[7px] text-[12.5px] font-semibold text-ink2">
            Confirmez en tapant <span className="font-mono text-ink">{requireText}</span> :
          </div>
          <TextInput mono value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={requireText} />
        </div>
      )}
    </Modal>
  );
}
