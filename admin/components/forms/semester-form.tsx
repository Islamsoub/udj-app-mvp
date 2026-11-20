'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { FRow, FField } from '@/components/ui/form-helpers';
import { DatePicker } from '@/components/shared/date-picker';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useCurrentSemester, useSaveSemester, useSemesters } from '@/hooks/queries/use-academics';
import { semesterSchema, type SemesterValues } from '@/lib/validations';
import { apiErrorMessage, fmtDate } from '@/lib/utils';
import type { Semester } from '@/lib/types';

/**
 * SemesterForm (supplement §3.7). Dates flow through two DatePickers bound
 * via setValue (hidden registered inputs keep RHF validation).
 *
 * There is no "current" switch: the backend decides the current semester from
 * the dates (backend/src/utils/currentSemester.ts), so the form only says which
 * one that is. The end date must follow the start date (validated here and by
 * the API). Dates that overlap another semester are allowed — the most
 * recently started one is then current — but the form warns about them.
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
    },
  });

  const startDate = watch('startDate');
  const endDate = watch('endDate');
  const currentSemester = useCurrentSemester();
  const { data: semesters } = useSemesters();

  /** Other semesters whose dates share at least one day with these. */
  const overlapping =
    startDate && endDate && new Date(endDate) > new Date(startDate)
      ? (semesters ?? []).filter(
          (s) =>
            s.id !== semester?.id &&
            new Date(s.startDate) <= new Date(endDate) &&
            new Date(startDate) <= new Date(s.endDate)
        )
      : [];

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
        {overlapping.length > 0 && (
          <p role="alert" className="mb-3 mt-0 rounded-[9px] bg-amber-bg px-3 py-2 text-[12.5px] text-amber-on-tint">
            Ces dates chevauchent{' '}
            {overlapping
              .map((s) => `${s.label} — ${s.academicYear} (${fmtDate(s.startDate)} → ${fmtDate(s.endDate)})`)
              .join(', ')}
            . Pendant le chevauchement, le semestre commencé le plus récemment sera le semestre en cours.
          </p>
        )}
        <div className="mt-1 border-t border-hair pt-3">
          <div className="text-[13.5px] font-semibold text-ink">
            Semestre en cours : déterminé automatiquement par les dates
          </div>
          <div className="text-[12px] text-ink2">
            {currentSemester
              ? `Actuellement : ${currentSemester.label} — ${currentSemester.academicYear}`
              : 'Aucun semestre pour le moment'}
          </div>
        </div>
      </form>
    </Modal>
  );
}
