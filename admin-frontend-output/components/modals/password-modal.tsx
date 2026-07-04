'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { FRow, FField } from '@/components/ui/form-helpers';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useChangePassword } from '@/hooks/use-auth';
import { passwordChangeSchema, type PasswordChangeValues } from '@/lib/validations';
import { apiErrorMessage } from '@/lib/utils';

/**
 * PasswordModal (impl spec §28, supplement §1.4) — change own password:
 * current + new + confirm. 400 → inline "Mot de passe actuel incorrect".
 */
export function PasswordModal() {
  const { close } = useModal();
  const { toast } = useToast();
  const changePassword = useChangePassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<PasswordChangeValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await changePassword.mutateAsync({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast('Mot de passe mis à jour', 'check');
      close();
    } catch (err) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 400 || status === 401) {
        setError('currentPassword', { message: 'Mot de passe actuel incorrect' });
      } else {
        toast(apiErrorMessage(err), 'x');
      }
    }
  });

  return (
    <Modal
      title="Changer le mot de passe"
      icon={<KeyRound size={19} />}
      iconTone="amber"
      width={440}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            Annuler
          </Button>
          <Button kind="primary" type="submit" form="password-form" disabled={isSubmitting}>
            Mettre à jour
          </Button>
        </>
      }
    >
      <form id="password-form" onSubmit={onSubmit} noValidate>
        <FRow cols={1}>
          <FField label="Mot de passe actuel" required error={errors.currentPassword?.message}>
            <TextInput
              {...register('currentPassword')}
              type="password"
              autoComplete="current-password"
              error={!!errors.currentPassword}
              autoFocus
            />
          </FField>
        </FRow>
        <FRow cols={1}>
          <FField
            label="Nouveau mot de passe"
            required
            error={errors.newPassword?.message}
            hint="Minimum 8 caractères"
          >
            <TextInput
              {...register('newPassword')}
              type="password"
              autoComplete="new-password"
              error={!!errors.newPassword}
            />
          </FField>
        </FRow>
        <FRow cols={1} className="mb-0">
          <FField label="Confirmer" required error={errors.confirmPassword?.message}>
            <TextInput
              {...register('confirmPassword')}
              type="password"
              autoComplete="new-password"
              error={!!errors.confirmPassword}
            />
          </FField>
        </FRow>
      </form>
    </Modal>
  );
}
