'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextInput, TextArea } from '@/components/ui/input';
import { FField } from '@/components/ui/form-helpers';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useCorrectGrade } from '@/hooks/queries/use-grades';
import { gradeCorrectionSchema, type GradeCorrectionValues } from '@/lib/validations';
import { fmt } from '@/lib/grade-helpers';
import { apiErrorMessage } from '@/lib/utils';
import type { GradeChangeResult } from '@/lib/types';

/**
 * GradeCorrectionModal (Pass C-2, change-set §30.3 / AD §3.4) — the only way to
 * change a published grade. Shows the current value (read-only), a new value,
 * and a mandatory reason; POSTs /admin/grades/:id/change which records the
 * reason + old/new value in the audit log. SUPER_ADMIN / REGISTRAR only (the
 * caller gates who can open it; the backend rbac guard enforces it).
 */
export interface GradeCorrectionModalProps {
  gradeId: string;
  field: 'cc' | 'cf';
  currentValue: number | null;
  studentName?: string;
  subjectLabel?: string;
  onCorrected?: (result: GradeChangeResult) => void;
}

export function GradeCorrectionModal({
  gradeId,
  field,
  currentValue,
  studentName,
  subjectLabel,
  onCorrected,
}: GradeCorrectionModalProps) {
  const { close } = useModal();
  const { toast } = useToast();
  const correct = useCorrectGrade();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<GradeCorrectionValues>({
    resolver: zodResolver(gradeCorrectionSchema),
    defaultValues: { field, value: currentValue ?? 0, reason: '' },
  });

  const fieldLabel = field === 'cc' ? 'Contrôle continu (CC)' : 'Contrôle final (CF)';
  const sub = [studentName, subjectLabel, fieldLabel].filter(Boolean).join(' · ');

  const onSubmit = async (values: GradeCorrectionValues) => {
    try {
      const result = await correct.mutateAsync({
        id: gradeId,
        field,
        value: values.value,
        reason: values.reason,
      });
      onCorrected?.(result);
      close();
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  return (
    <Modal
      title="Correction de note"
      sub={sub || undefined}
      icon={<Pencil size={18} />}
      iconTone="amber"
      width={440}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            Annuler
          </Button>
          <Button type="submit" form="grade-correction-form" disabled={isSubmitting}>
            Enregistrer la correction
          </Button>
        </>
      }
    >
      <form id="grade-correction-form" onSubmit={handleSubmit(onSubmit)}>
        <FField label="Valeur actuelle">
          <TextInput mono readOnly value={fmt(currentValue)} />
        </FField>
        <div className="h-[14px]" />
        <FField label="Nouvelle valeur" required error={errors.value?.message}>
          <TextInput
            type="number"
            step="0.25"
            min={0}
            max={20}
            mono
            error={!!errors.value}
            {...register('value', { valueAsNumber: true })}
          />
        </FField>
        <div className="h-[14px]" />
        <FField
          label="Motif de la correction"
          required
          error={errors.reason?.message}
          hint="Consigné au journal d’audit avec l’ancienne et la nouvelle valeur."
        >
          <TextArea
            rows={3}
            placeholder="Ex. Erreur de saisie confirmée par le procès-verbal de la matière."
            error={!!errors.reason}
            {...register('reason')}
          />
        </FField>
      </form>
    </Modal>
  );
}
