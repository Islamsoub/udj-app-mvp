'use client';

import { useForm, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Pencil, UserPlus } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { FRow, FField } from '@/components/ui/form-helpers';
import { Dropdown } from '@/components/ui/select';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useCreateStudent, useUpdateStudent } from '@/hooks/queries/use-students';
import { useFaculties, useProgrammes } from '@/hooks/queries/use-academics';
import { studentCreateSchema, studentEditSchema, type StudentCreateValues } from '@/lib/validations';
import { apiErrorMessage, randPw } from '@/lib/utils';
import type { StudentStatus } from '@/lib/types';

/**
 * StudentForm (impl spec §27, supplement §3.1–3.2). Create + edit in one
 * modal: matricule locked on edit, initial password (with Générer) on create.
 * Faculté filters the Programme dropdown; changing it resets the programme.
 */
interface StudentLike {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  email: string;
  currentSemester: number;
  status: StudentStatus;
  programme: { id: string; faculty: { id: string } };
}

export interface StudentFormProps {
  student?: StudentLike;
}

const SEMESTER_OPTIONS = Array.from({ length: 10 }, (_, i) => ({
  value: String(i + 1),
  label: `S${i + 1}`,
}));

const STATUS_OPTIONS: { value: StudentStatus; label: string }[] = [
  { value: 'ACTIVE', label: 'Actif' },
  { value: 'SUSPENDED', label: 'Suspendu' },
  { value: 'GRADUATED', label: 'Diplômé' },
];

export function StudentForm({ student }: StudentFormProps) {
  const isEdit = !!student;
  const { close } = useModal();
  const { toast } = useToast();
  const createStudent = useCreateStudent();
  const updateStudent = useUpdateStudent();
  const { data: faculties } = useFaculties();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<StudentCreateValues>({
    // The edit schema is the create schema minus `password` — safe to widen.
    resolver: isEdit
      ? (zodResolver(studentEditSchema) as unknown as Resolver<StudentCreateValues>)
      : zodResolver(studentCreateSchema),
    defaultValues: {
      firstName: student?.firstName ?? '',
      lastName: student?.lastName ?? '',
      matricule: student?.matricule ?? '',
      email: student?.email ?? '',
      facultyId: student?.programme.faculty.id ?? '',
      programmeId: student?.programme.id ?? '',
      currentSemester: student?.currentSemester ?? 1,
      status: student?.status ?? 'ACTIVE',
      password: '',
    },
  });

  const facultyId = watch('facultyId');
  const programmeId = watch('programmeId');
  const currentSemester = watch('currentSemester');
  const status = watch('status');
  const { data: programmes } = useProgrammes(facultyId || undefined);

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && student) {
        await updateStudent.mutateAsync({
          id: student.id,
          data: {
            firstName: values.firstName,
            lastName: values.lastName,
            email: values.email,
            programmeId: values.programmeId,
            currentSemester: values.currentSemester,
            status: values.status,
          },
        });
      } else {
        await createStudent.mutateAsync({
          firstName: values.firstName,
          lastName: values.lastName,
          matricule: values.matricule,
          email: values.email,
          programmeId: values.programmeId,
          currentSemester: values.currentSemester,
          status: values.status,
          password: values.password,
        });
      }
      close();
    } catch (err) {
      const msg = apiErrorMessage(err);
      const lower = msg.toLowerCase();
      if (lower.includes('matricule')) {
        setError('matricule', { message: msg });
      } else if (lower.includes('email') || lower.includes('e-mail')) {
        setError('email', { message: msg });
      } else {
        toast(msg, 'x');
      }
    }
  });

  return (
    <Modal
      title={isEdit ? "Modifier l'étudiant" : 'Nouvel étudiant'}
      icon={isEdit ? <Pencil size={19} /> : <UserPlus size={19} />}
      iconTone="jade"
      width={560}
      footer={
        <>
          <Button kind="quiet" onClick={close}>
            Annuler
          </Button>
          <Button kind="primary" type="submit" form="student-form" disabled={isSubmitting}>
            {isEdit ? 'Enregistrer les modifications' : "Créer l'étudiant"}
          </Button>
        </>
      }
    >
      <form id="student-form" onSubmit={onSubmit} noValidate>
        <FRow>
          <FField label="Prénom" required error={errors.firstName?.message}>
            <TextInput
              {...register('firstName')}
              placeholder="Ahmed"
              error={!!errors.firstName}
              autoFocus
            />
          </FField>
          <FField label="Nom" required error={errors.lastName?.message}>
            <TextInput {...register('lastName')} placeholder="Omar" error={!!errors.lastName} />
          </FField>
        </FRow>
        <FRow>
          <FField
            label="Matricule"
            required
            error={errors.matricule?.message}
            hint={isEdit ? "Le matricule n'est pas modifiable" : undefined}
          >
            <TextInput
              {...register('matricule')}
              mono
              placeholder="UDJ-2024-0001"
              readOnly={isEdit}
              error={!!errors.matricule}
            />
          </FField>
          <FField label="Email" required error={errors.email?.message}>
            <TextInput
              {...register('email')}
              type="email"
              placeholder="ahmed.omar@univ.dj"
              error={!!errors.email}
            />
          </FField>
        </FRow>
        <FRow>
          <FField label="Faculté" required error={errors.facultyId?.message}>
            <Dropdown
              value={facultyId}
              onChange={(v) => {
                setValue('facultyId', v, { shouldValidate: true });
                setValue('programmeId', '', { shouldValidate: false });
              }}
              options={(faculties ?? []).map((f) => ({ value: f.id, label: f.nameFr }))}
              placeholder="Sélectionner…"
              error={!!errors.facultyId}
            />
          </FField>
          <FField label="Programme" required error={errors.programmeId?.message}>
            <Dropdown
              value={programmeId}
              onChange={(v) => setValue('programmeId', v, { shouldValidate: true })}
              options={(programmes ?? []).map((p) => ({ value: p.id, label: p.nameFr }))}
              placeholder="Sélectionner…"
              disabled={!facultyId}
              error={!!errors.programmeId}
            />
          </FField>
        </FRow>
        <FRow>
          <FField label="Semestre actuel" required error={errors.currentSemester?.message}>
            <Dropdown
              value={String(currentSemester)}
              onChange={(v) => setValue('currentSemester', Number(v), { shouldValidate: true })}
              options={SEMESTER_OPTIONS}
            />
          </FField>
          <FField label="Statut" error={errors.status?.message}>
            <Dropdown
              value={status}
              onChange={(v) => setValue('status', v as StudentStatus, { shouldValidate: true })}
              options={STATUS_OPTIONS}
            />
          </FField>
        </FRow>
        {!isEdit && (
          <FRow cols={1}>
            <FField
              label="Mot de passe initial"
              required
              error={errors.password?.message}
              hint="Minimum 8 caractères — communiquez-le à l'étudiant"
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
