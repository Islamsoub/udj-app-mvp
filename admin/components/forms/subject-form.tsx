'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { GraduationCap } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { FRow, FField } from '@/components/ui/form-helpers';
import { Dropdown } from '@/components/ui/select';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useProgrammes, useSaveSubject, useSemesters } from '@/hooks/queries/use-academics';
import { subjectSchema, type SubjectValues } from '@/lib/validations';
import { apiErrorMessage } from '@/lib/utils';
import type { Subject } from '@/lib/types';

/**
 * SubjectForm (supplement §3.6). Programme + semester dropdowns, coefficient
 * (1–10), credits and CM/TD/TP hours (default 0). Numbers coerce in the
 * schema.
 */
export function SubjectForm({ subject }: { subject?: Subject }) {
  const isEdit = !!subject;
  const { close } = useModal();
  const { toast } = useToast();
  const saveSubject = useSaveSubject();
  const { data: programmes } = useProgrammes();
  const { data: semesters } = useSemesters();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SubjectValues>({
    resolver: zodResolver(subjectSchema) as Resolver<SubjectValues>,
    defaultValues: {
      nameFr: subject?.nameFr ?? '',
      nameAr: subject?.nameAr ?? '',
      code: subject?.code ?? '',
      programmeId: subject?.programmeId ?? '',
      semesterId: subject?.semesterId ?? '',
      coefficient: subject?.coefficient ?? 1,
      credits: subject?.credits ?? 4,
      hoursCm: subject?.hoursCm ?? 0,
      hoursTd: subject?.hoursTd ?? 0,
      hoursTp: subject?.hoursTp ?? 0,
    },
  });

  const programmeId = watch('programmeId');
  const semesterId = watch('semesterId');

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveSubject.mutateAsync({
        id: subject?.id,
        data: {
          nameFr: values.nameFr,
          nameAr: values.nameAr,
          code: values.code,
          programmeId: values.programmeId,
          semesterId: values.semesterId,
          coefficient: values.coefficient,
          credits: values.credits,
          hoursCm: values.hoursCm,
          hoursTd: values.hoursTd,
          hoursTp: values.hoursTp,
        },
      });
      close();
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  });

  return (
    <Modal
      title={isEdit ? 'Modifier la matière' : 'Nouvelle matière'}
      icon={<GraduationCap size={19} />}
      iconTone="jade"
      width={560}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            Annuler
          </Button>
          <Button kind="primary" type="submit" form="subject-form" disabled={isSubmitting}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="subject-form" onSubmit={onSubmit} noValidate>
        <FRow>
          <FField label="Nom (FR)" required error={errors.nameFr?.message}>
            <TextInput
              {...register('nameFr')}
              placeholder="Bases de données"
              error={!!errors.nameFr}
              autoFocus
            />
          </FField>
          <FField label="Nom (AR)" required error={errors.nameAr?.message}>
            <TextInput {...register('nameAr')} dir="rtl" placeholder="قواعد البيانات" error={!!errors.nameAr} />
          </FField>
        </FRow>
        <FRow>
          <FField label="Code" required error={errors.code?.message} hint='ex. "INF301"'>
            <TextInput {...register('code')} mono placeholder="INF301" error={!!errors.code} />
          </FField>
          <FField label="Programme" required error={errors.programmeId?.message}>
            <Dropdown
              value={programmeId}
              onChange={(v) => setValue('programmeId', v, { shouldValidate: true })}
              options={(programmes ?? []).map((p) => ({ value: p.id, label: p.nameFr }))}
              placeholder="Sélectionner…"
              error={!!errors.programmeId}
            />
          </FField>
        </FRow>
        <FRow>
          <FField label="Semestre" required error={errors.semesterId?.message}>
            <Dropdown
              value={semesterId}
              onChange={(v) => setValue('semesterId', v, { shouldValidate: true })}
              options={(semesters ?? []).map((s) => ({
                value: s.id,
                label: `${s.label} — ${s.academicYear}`,
              }))}
              placeholder="Sélectionner…"
              error={!!errors.semesterId}
            />
          </FField>
          <FField label="Coefficient" required error={errors.coefficient?.message}>
            <TextInput
              {...register('coefficient')}
              type="number"
              // Coefficients are commonly 1.5 / 2.5. Without an explicit step a
              // number input defaults to step="1" and the browser rejects
              // fractions on submit, before Zod ever sees the value.
              step={0.5}
              min={1}
              max={10}
              error={!!errors.coefficient}
            />
          </FField>
        </FRow>
        <FRow cols={1}>
          <FField label="Crédits" required error={errors.credits?.message}>
            <TextInput {...register('credits')} type="number" min={1} max={30} error={!!errors.credits} />
          </FField>
        </FRow>
        <FRow cols={3}>
          <FField label="Heures CM" error={errors.hoursCm?.message}>
            <TextInput {...register('hoursCm')} type="number" min={0} error={!!errors.hoursCm} />
          </FField>
          <FField label="Heures TD" error={errors.hoursTd?.message}>
            <TextInput {...register('hoursTd')} type="number" min={0} error={!!errors.hoursTd} />
          </FField>
          <FField label="Heures TP" error={errors.hoursTp?.message}>
            <TextInput {...register('hoursTp')} type="number" min={0} error={!!errors.hoursTp} />
          </FField>
        </FRow>
      </form>
    </Modal>
  );
}
