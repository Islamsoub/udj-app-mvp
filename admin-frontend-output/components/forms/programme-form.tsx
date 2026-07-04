'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { FRow, FField } from '@/components/ui/form-helpers';
import { Dropdown } from '@/components/ui/select';
import { SectionLabel } from '@/components/shared/section-label';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useFaculties, useSaveProgramme } from '@/hooks/queries/use-academics';
import { PROGRAMME_LEVELS } from '@/lib/constants';
import { programmeSchema, type ProgrammeValues } from '@/lib/validations';
import { apiErrorMessage } from '@/lib/utils';
import type { Programme, ProgrammeLevel } from '@/lib/types';

/**
 * ProgrammeForm (supplement §3.5). Edit mode shows a read-only stat strip
 * (Inscrits / Matières) above the fields. Numbers go through z.coerce in the
 * schema, so plain text inputs are fine.
 */
export function ProgrammeForm({ programme }: { programme?: Programme }) {
  const isEdit = !!programme;
  const { close } = useModal();
  const { toast } = useToast();
  const saveProgramme = useSaveProgramme();
  const { data: faculties } = useFaculties();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ProgrammeValues>({
    resolver: zodResolver(programmeSchema) as Resolver<ProgrammeValues>,
    defaultValues: {
      nameFr: programme?.nameFr ?? '',
      nameAr: programme?.nameAr ?? '',
      code: programme?.code ?? '',
      facultyId: programme?.facultyId ?? '',
      level: programme?.level,
      durationSemesters: programme?.durationSemesters ?? 6,
      totalCredits: programme?.totalCredits ?? 180,
    },
  });

  const facultyId = watch('facultyId');
  const level = watch('level');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveProgramme.mutateAsync({
        id: programme?.id,
        data: {
          nameFr: values.nameFr,
          nameAr: values.nameAr,
          code: values.code,
          facultyId: values.facultyId,
          level: values.level,
          durationSemesters: values.durationSemesters,
          totalCredits: values.totalCredits,
        },
      });
      close();
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  });

  return (
    <Modal
      title={isEdit ? 'Modifier le programme' : 'Nouveau programme'}
      icon={<BookOpen size={19} />}
      iconTone="jade"
      width={520}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            Annuler
          </Button>
          <Button kind="primary" type="submit" form="programme-form" disabled={isSubmitting}>
            Enregistrer
          </Button>
        </>
      }
    >
      {isEdit && (
        <div className="mb-[14px] grid grid-cols-2 gap-2">
          <div className="rounded-[10px] bg-surface2 p-3 text-center">
            <div className="text-[16px] font-extrabold text-ink">
              {programme?._count?.students ?? 0}
            </div>
            <SectionLabel>Inscrits</SectionLabel>
          </div>
          <div className="rounded-[10px] bg-surface2 p-3 text-center">
            <div className="text-[16px] font-extrabold text-ink">
              {programme?._count?.subjects ?? 0}
            </div>
            <SectionLabel>Matières</SectionLabel>
          </div>
        </div>
      )}
      <form id="programme-form" onSubmit={onSubmit} noValidate>
        <FRow>
          <FField label="Nom (FR)" required error={errors.nameFr?.message}>
            <TextInput
              {...register('nameFr')}
              placeholder="Génie Informatique"
              error={!!errors.nameFr}
              autoFocus
            />
          </FField>
          <FField label="Nom (AR)" required error={errors.nameAr?.message}>
            <TextInput {...register('nameAr')} dir="rtl" placeholder="هندسة المعلوماتية" error={!!errors.nameAr} />
          </FField>
        </FRow>
        <FRow>
          <FField label="Code" required error={errors.code?.message} hint='ex. "GINF"'>
            <TextInput {...register('code')} mono placeholder="GINF" error={!!errors.code} />
          </FField>
          <FField label="Faculté" required error={errors.facultyId?.message}>
            <Dropdown
              value={facultyId}
              onChange={(v) => setValue('facultyId', v, { shouldValidate: true })}
              options={(faculties ?? []).map((f) => ({ value: f.id, label: f.nameFr }))}
              placeholder="Sélectionner…"
              error={!!errors.facultyId}
            />
          </FField>
        </FRow>
        <FRow>
          <FField label="Niveau" required error={errors.level?.message}>
            <Dropdown
              value={level ?? null}
              onChange={(v) => setValue('level', v as ProgrammeLevel, { shouldValidate: true })}
              options={PROGRAMME_LEVELS}
              placeholder="Sélectionner…"
              error={!!errors.level}
            />
          </FField>
          <FField label="Durée (semestres)" required error={errors.durationSemesters?.message}>
            <TextInput
              {...register('durationSemesters')}
              type="number"
              min={2}
              max={16}
              error={!!errors.durationSemesters}
            />
          </FField>
        </FRow>
        <FRow cols={1}>
          <FField label="Crédits totaux" required error={errors.totalCredits?.message}>
            <TextInput {...register('totalCredits')} type="number" min={1} error={!!errors.totalCredits} />
          </FField>
        </FRow>
      </form>
    </Modal>
  );
}
