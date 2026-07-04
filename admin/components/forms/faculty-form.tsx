'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookOpen } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { FRow, FField } from '@/components/ui/form-helpers';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useSaveFaculty } from '@/hooks/queries/use-academics';
import { facultySchema, type FacultyValues } from '@/lib/validations';
import { apiErrorMessage } from '@/lib/utils';
import type { Faculty } from '@/lib/types';

/**
 * FacultyForm (supplement §3.4) — create + edit in one compact modal.
 * Nom FR/AR (AR input is RTL), code + phone mono, email, optional
 * address/hours. Saves through useSaveFaculty (toasts on success).
 */
export function FacultyForm({ faculty }: { faculty?: Faculty }) {
  const isEdit = !!faculty;
  const { close } = useModal();
  const { toast } = useToast();
  const saveFaculty = useSaveFaculty();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FacultyValues>({
    resolver: zodResolver(facultySchema),
    defaultValues: {
      nameFr: faculty?.nameFr ?? '',
      nameAr: faculty?.nameAr ?? '',
      code: faculty?.code ?? '',
      phone: faculty?.phone ?? '',
      email: faculty?.email ?? '',
      address: faculty?.address ?? '',
      hours: faculty?.hours ?? '',
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await saveFaculty.mutateAsync({ id: faculty?.id, data: values });
      close();
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  });

  return (
    <Modal
      title={isEdit ? 'Modifier la faculté' : 'Nouvelle faculté'}
      icon={<BookOpen size={19} />}
      iconTone="jade"
      width={520}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            Annuler
          </Button>
          <Button kind="primary" type="submit" form="faculty-form" disabled={isSubmitting}>
            Enregistrer
          </Button>
        </>
      }
    >
      <form id="faculty-form" onSubmit={onSubmit} noValidate>
        <FRow>
          <FField label="Nom (FR)" required error={errors.nameFr?.message}>
            <TextInput
              {...register('nameFr')}
              placeholder="Faculté des Sciences"
              error={!!errors.nameFr}
              autoFocus
            />
          </FField>
          <FField label="Nom (AR)" required error={errors.nameAr?.message}>
            <TextInput {...register('nameAr')} dir="rtl" placeholder="كلية العلوم" error={!!errors.nameAr} />
          </FField>
        </FRow>
        <FRow>
          <FField label="Code" required error={errors.code?.message} hint='ex. "FST"'>
            <TextInput {...register('code')} mono placeholder="FST" error={!!errors.code} />
          </FField>
          <FField label="Téléphone" required error={errors.phone?.message}>
            <TextInput {...register('phone')} mono placeholder="+253 21 35 00 00" error={!!errors.phone} />
          </FField>
        </FRow>
        <FRow cols={1}>
          <FField label="Email" required error={errors.email?.message}>
            <TextInput
              {...register('email')}
              type="email"
              placeholder="fst@univ.dj"
              error={!!errors.email}
            />
          </FField>
        </FRow>
        <FRow>
          <FField label="Adresse" error={errors.address?.message}>
            <TextInput {...register('address')} placeholder="Campus Balbala" error={!!errors.address} />
          </FField>
          <FField label="Horaires" error={errors.hours?.message}>
            <TextInput {...register('hours')} placeholder="Dim–Jeu · 8h–17h" error={!!errors.hours} />
          </FField>
        </FRow>
      </form>
    </Modal>
  );
}
