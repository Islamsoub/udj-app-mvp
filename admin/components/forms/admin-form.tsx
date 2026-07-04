'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Shield } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { FRow, FField } from '@/components/ui/form-helpers';
import { Dropdown } from '@/components/ui/select';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useCreateAdmin, useUpdateAdmin } from '@/hooks/queries/use-admins';
import { useFaculties } from '@/hooks/queries/use-academics';
import { ROLE_META } from '@/lib/constants';
import { adminCreateSchema, adminEditSchema, type AdminCreateValues } from '@/lib/validations';
import { apiErrorMessage, randPw } from '@/lib/utils';
import type { AdminRole, AdminUser } from '@/lib/types';

/**
 * AdminForm (impl spec §27, supplement §3.3). Create + edit in one modal —
 * the Périmètre (faculté) dropdown only appears for FACULTY_ADMIN, and the
 * initial password (with Générer) only on create. 409 email conflicts land
 * on the email field.
 */
const ROLE_OPTIONS = (Object.keys(ROLE_META) as AdminRole[]).map((role) => ({
  value: role,
  label: ROLE_META[role].label,
}));

export function AdminForm({ admin }: { admin?: AdminUser }) {
  const isEdit = !!admin;
  const { close } = useModal();
  const { toast } = useToast();
  const createAdmin = useCreateAdmin();
  const updateAdmin = useUpdateAdmin();
  const { data: faculties } = useFaculties();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AdminCreateValues>({
    resolver: zodResolver(
      isEdit ? adminEditSchema : adminCreateSchema
    ) as unknown as Resolver<AdminCreateValues>,
    defaultValues: {
      firstName: admin?.firstName ?? '',
      lastName: admin?.lastName ?? '',
      email: admin?.email ?? '',
      role: admin?.role,
      facultyId: admin?.facultyId ?? '',
      password: '',
    },
  });

  const role = watch('role');
  const facultyId = watch('facultyId');

  const onSubmit = handleSubmit(async (values) => {
    const scopedFacultyId = values.role === 'FACULTY_ADMIN' ? values.facultyId : null;
    try {
      if (isEdit && admin) {
        await updateAdmin.mutateAsync({
          id: admin.id,
          data: {
            firstName: values.firstName,
            lastName: values.lastName,
            role: values.role,
            facultyId: scopedFacultyId,
          },
        });
      } else {
        await createAdmin.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          role: values.role,
          facultyId: scopedFacultyId,
          password: values.password,
        });
      }
      close();
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      const msg = apiErrorMessage(err);
      if (status === 409 || msg.toLowerCase().includes('email')) {
        setError('email', { message: msg });
      } else {
        toast(msg, 'x');
      }
    }
  });

  return (
    <Modal
      title={isEdit ? "Modifier l'administrateur" : 'Nouvel administrateur'}
      icon={<Shield size={19} />}
      iconTone="exam"
      width={520}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            Annuler
          </Button>
          <Button kind="primary" type="submit" form="admin-form" disabled={isSubmitting}>
            {isEdit ? 'Enregistrer' : 'Créer le compte'}
          </Button>
        </>
      }
    >
      <form id="admin-form" onSubmit={onSubmit} noValidate>
        <FRow>
          <FField label="Prénom" required error={errors.firstName?.message}>
            <TextInput {...register('firstName')} placeholder="Fatima" error={!!errors.firstName} autoFocus />
          </FField>
          <FField label="Nom" required error={errors.lastName?.message}>
            <TextInput {...register('lastName')} placeholder="Hassan" error={!!errors.lastName} />
          </FField>
        </FRow>
        <FRow cols={1}>
          <FField
            label="Email"
            required
            error={errors.email?.message}
            hint={isEdit ? "L'email n'est pas modifiable" : undefined}
          >
            <TextInput
              {...register('email')}
              type="email"
              placeholder="fatima.hassan@univ.dj"
              readOnly={isEdit}
              error={!!errors.email}
            />
          </FField>
        </FRow>
        <FRow cols={1}>
          <FField label="Rôle" required error={errors.role?.message}>
            <Dropdown
              value={role ?? null}
              onChange={(v) => setValue('role', v as AdminRole, { shouldValidate: true })}
              options={ROLE_OPTIONS}
              placeholder="Sélectionner…"
              error={!!errors.role}
            />
          </FField>
        </FRow>
        {role === 'FACULTY_ADMIN' && (
          <FRow cols={1}>
            <FField label="Périmètre (faculté)" required error={errors.facultyId?.message}>
              <Dropdown
                value={facultyId}
                onChange={(v) => setValue('facultyId', v, { shouldValidate: true })}
                options={(faculties ?? []).map((f) => ({ value: f.id, label: f.nameFr }))}
                placeholder="Sélectionner une faculté…"
                error={!!errors.facultyId}
              />
            </FField>
          </FRow>
        )}
        {!isEdit && (
          <FRow cols={1}>
            <FField
              label="Mot de passe initial"
              required
              error={errors.password?.message}
              hint="Minimum 8 caractères — communiquez-le à l'administrateur"
            >
              <div className="flex items-center gap-2">
                <TextInput {...register('password')} mono error={!!errors.password} />
                <Button
                  kind="soft"
                  size="sm"
                  className="shrink-0"
                  onClick={() => setValue('password', randPw(12), { shouldValidate: true })}
                >
                  Générer
                </Button>
              </div>
            </FField>
          </FRow>
        )}
      </form>
    </Modal>
  );
}
