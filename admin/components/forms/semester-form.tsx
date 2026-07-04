'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { FRow, FField } from '@/components/ui/form-helpers';
import { Toggle } from '@/components/ui/toggle';
import { DatePicker } from '@/components/shared/date-picker';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useSaveSemester } from '@/hooks/queries/use-academics';
import { semesterSchema, type SemesterValues } from '@/lib/validations';
import { apiErrorMessage } from '@/lib/utils';
import type { Semester } from '@/lib/types';

/**
 * SemesterForm (supplement §3.7). Dates flow through two DatePickers bound
 * via setValue (hidden registered inputs keep RHF validation). Saving with
 * "Semestre en cours" checked declasses the previously-current semester
 * server-side.
 */
export function SemesterForm({ semester }: { semester?: Semester }) {
  const isEdit = !!semester;
  const { close } = useModal();
  const { toast } = useToast();
  const saveSemester = useSaveSemester();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SemesterValues>({
    resolver: zodResolver(semesterSchema),
    defaultValues: {
      label: semester?.label ?? '',
      academicYear: semester?.academicYear ?? '',
      startDate: semester?.startDate ?? '',
      endDate: semester?.endDate ?? '',
      isCurrent: semester?.isCurrent ?? false,
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const isCurrent = watch('isCurrent');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveSemester.mutateAsync({ id: semester?.id, data: values });
      close();
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  });

  return (
    <Modal
      title={isEdit ? 'Modifier le semestre' : 'Nouveau semestre'}
      icon={<Calendar size={19} />}
      iconTone="jade"
      width={480}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            Annuler
          </Button>
          <Button kind="primary" type="submit" form="semester-form" disabled={isSubmitting}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="semester-form" onSubmit={onSubmit} noValidate>
        <input type="hidden" {...register('startDate')} />
        <input type="hidden" {...register('endDate')} />
        <FRow>
          <FField label="Libellé" required error={errors.label?.message} hint='ex. "Semestre 1"'>
            <TextInput {...register('label')} placeholder="Semestre 1" error={!!errors.label} autoFocus />
          </FField>
          <FField
            label="Année académique"
            required
            error={errors.academicYear?.message}
            hint='ex. "2025-2026"'
          >
            <TextInput {...register('academicYear')} mono placeholder="2025-2026" error={!!errors.academicYear} />
          </FField>
        </FRow>
        <FRow>
          <FField label="Date début" required error={errors.startDate?.message}>
            <DatePicker
              value={startDate ? new Date(startDate) : null}
              onChange={(d) => setValue('startDate', d.toISOString(), { shouldValidate: true })}
            />
          </FField>
          <FField label="Date fin" required error={errors.endDate?.message}>
            <DatePicker
              value={endDate ? new Date(endDate) : null}
              onChange={(d) => setValue('endDate', d.toISOString(), { shouldValidate: true })}
            />
          </FField>
        </FRow>
        <div className="mt-1 flex items-center justify-between gap-4 border-t border-hair pt-3">
          <div>
            <div className="text-[13.5px] font-semibold text-ink">Semestre en cours</div>
            <div className="text-[12px] text-ink2">Le semestre courant précédent sera déclassé</div>
          </div>
          <Toggle
            checked={isCurrent}
            onChange={(b) => setValue('isCurrent', b, { shouldValidate: true })}
            aria-label="Semestre en cours"
          />
        </div>
      </form>
    </Modal>
  );
}
