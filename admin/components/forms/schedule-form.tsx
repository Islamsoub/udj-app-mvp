'use client';

import { useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Calendar } from 'lucide-react';
import { Modal } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { Dropdown } from '@/components/ui/select';
import { FField, FRow } from '@/components/ui/form-helpers';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import {
  useCurrentSemester,
  useProgrammes,
  useSemesters,
  useSubjects,
} from '@/hooks/queries/use-academics';
import {
  useCreateScheduleEntry,
  useDeleteScheduleEntry,
  useScheduleConflicts,
  useUpdateScheduleEntry,
} from '@/hooks/queries/use-schedule';
import { scheduleSchema, type ScheduleValues } from '@/lib/validations';
import { SCHEDULE_TYPES, WEEK_DAYS } from '@/lib/constants';
import { apiErrorMessage } from '@/lib/utils';
import type { ScheduleEntry, ScheduleEntryInput, ScheduleEntryType } from '@/lib/types';

/**
 * ScheduleForm (impl spec §27; Pass C-2 change-set §30.7) — create/edit a
 * schedule entry. A real-time room-clash check (GET /admin/schedule/conflicts)
 * shows an amber inline warning below the Salle field when the room is already
 * booked at that weekday + time in the same semester. Save is NOT blocked (soft
 * warning): amphitheatres may be intentionally shared (AD §5.2).
 */
export function ScheduleForm({ entry }: { entry?: ScheduleEntry }) {
  const { close } = useModal();
  const { toast } = useToast();
  const { data: programmes } = useProgrammes();
  const { data: semesters } = useSemesters();
  const currentSemester = useCurrentSemester();
  const create = useCreateScheduleEntry();
  const update = useUpdateScheduleEntry();
  const remove = useDeleteScheduleEntry();
  const [editSemester, setEditSemester] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ScheduleValues>({
    resolver: zodResolver(scheduleSchema),
    defaultValues: {
      programmeId: entry?.subject.programme.id ?? '',
      subjectId: entry?.subjectId ?? '',
      semesterId: entry?.semesterId ?? '',
      professorName: entry?.professorName ?? '',
      room: entry?.room ?? '',
      dayOfWeek: entry?.dayOfWeek ?? 0,
      startTime: entry?.startTime ?? '',
      endTime: entry?.endTime ?? '',
      type: entry?.type ?? 'CM',
    },
  });

  const programmeId = watch('programmeId');
  const { data: subjects } = useSubjects(programmeId ? { programme: programmeId } : {});

  // Default the semester to the current one on create.
  useEffect(() => {
    if (!entry && currentSemester && !getValues('semesterId')) {
      setValue('semesterId', currentSemester.id);
    }
  }, [entry, currentSemester, getValues, setValue]);

  // ── Soft room-conflict check (§30.7) ───────────────────────────────────────
  const room = watch('room');
  const dayOfWeek = watch('dayOfWeek');
  const startTime = watch('startTime');
  const endTime = watch('endTime');
  const semesterId = watch('semesterId');
  const { data: conflictData } = useScheduleConflicts({
    room,
    dayOfWeek,
    startTime,
    endTime,
    excludeId: entry?.id,
  });
  const roomConflict = useMemo(
    () => conflictData?.conflicts.find((c) => c.semesterId === semesterId) ?? null,
    [conflictData, semesterId]
  );

  const programmeOptions = useMemo(
    () => (programmes ?? []).map((p) => ({ value: p.id, label: p.nameFr })),
    [programmes]
  );
  const subjectOptions = useMemo(
    () =>
      (subjects ?? [])
        .filter((s) => !programmeId || s.programmeId === programmeId)
        .map((s) => ({ value: s.id, label: `${s.nameFr} (${s.code})` })),
    [subjects, programmeId]
  );
  const semesterOptions = useMemo(
    () =>
      (semesters ?? []).map((s) => ({
        value: s.id,
        label: `${s.label} — ${s.academicYear}${s.isCurrent ? ' (en cours)' : ''}`,
      })),
    [semesters]
  );
  const dayOptions = WEEK_DAYS.map((d, i) => ({ value: String(i), label: d }));
  const selectedSemester = useMemo(
    () => (semesters ?? []).find((s) => s.id === semesterId) ?? null,
    [semesters, semesterId]
  );

  const onSubmit = async (values: ScheduleValues) => {
    const data: ScheduleEntryInput = {
      subjectId: values.subjectId,
      semesterId: values.semesterId,
      professorName: values.professorName,
      room: values.room,
      dayOfWeek: values.dayOfWeek,
      startTime: values.startTime,
      endTime: values.endTime,
      type: values.type,
    };
    try {
      if (entry) await update.mutateAsync({ id: entry.id, data });
      else await create.mutateAsync(data);
      close();
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const onDelete = async () => {
    if (!entry) return;
    try {
      await remove.mutateAsync(entry.id);
      close();
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  return (
    <Modal
      title={entry ? 'Modifier la séance' : 'Nouvelle séance'}
      sub={entry ? `${entry.subject.nameFr} · ${WEEK_DAYS[entry.dayOfWeek]} ${entry.startTime}–${entry.endTime}` : undefined}
      icon={<Calendar size={19} />}
      iconTone="jade"
      width={560}
      footer={
        <>
          {entry && (
            <>
              <Button kind="danger" onClick={onDelete} disabled={remove.isPending}>
                Supprimer
              </Button>
              <span className="flex-1" />
            </>
          )}
          <Button kind="quiet" onClick={close}>
            Annuler
          </Button>
          <Button type="submit" form="schedule-form" disabled={isSubmitting}>
            {entry ? 'Enregistrer' : 'Créer la séance'}
          </Button>
        </>
      }
    >
      <form id="schedule-form" onSubmit={handleSubmit(onSubmit)}>
        {/* Semester: auto-filled to the current term and rarely changed, so it
            shows as a compact read-only chip. "changer" reveals the dropdown;
            it also auto-reveals if the value is missing or invalid. */}
        {selectedSemester && !editSemester && !errors.semesterId ? (
          <div className="mb-[14px] flex items-center gap-2">
            <span className="inline-flex items-center gap-[6px] rounded-full bg-surface2 px-[11px] py-[5px] text-[12px] font-semibold text-ink2">
              <Calendar size={13} className="text-ink3" />
              {`${selectedSemester.label} · ${selectedSemester.academicYear}`}
            </span>
            <button
              type="button"
              onClick={() => setEditSemester(true)}
              className="text-[12px] font-semibold text-jade-text transition-colors hover:underline"
            >
              changer
            </button>
          </div>
        ) : (
          <FRow cols={1}>
            <FField label="Semestre" required error={errors.semesterId?.message}>
              <Controller
                control={control}
                name="semesterId"
                render={({ field }) => (
                  <Dropdown
                    value={field.value}
                    onChange={field.onChange}
                    options={semesterOptions}
                    placeholder="Sélectionner"
                    error={!!errors.semesterId}
                  />
                )}
              />
            </FField>
          </FRow>
        )}

        <FRow>
          <FField label="Matière" required error={errors.subjectId?.message}>
            <Controller
              control={control}
              name="subjectId"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={field.onChange}
                  options={subjectOptions}
                  placeholder="Sélectionner"
                  disabled={!programmeId}
                  error={!!errors.subjectId}
                />
              )}
            />
          </FField>
          <FField label="Programme" required error={errors.programmeId?.message}>
            <Controller
              control={control}
              name="programmeId"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(v) => {
                    field.onChange(v);
                    setValue('subjectId', '');
                  }}
                  options={programmeOptions}
                  placeholder="Sélectionner"
                  error={!!errors.programmeId}
                />
              )}
            />
          </FField>
        </FRow>
        <FRow>
          <FField label="Enseignant" required error={errors.professorName?.message}>
            <TextInput
              placeholder="Dr. Ahmed Waberi"
              error={!!errors.professorName}
              {...register('professorName')}
            />
          </FField>
          <FField label="Salle" required error={errors.room?.message}>
            <TextInput placeholder="A201" error={!!errors.room} {...register('room')} />
          </FField>
        </FRow>

        {/* Soft room-conflict warning (§30.7) — does not block saving. */}
        {roomConflict && (
          <div className="mb-[14px] -mt-[4px] flex items-start gap-2 rounded-[10px] bg-amber-bg px-3 py-2 text-[12px] text-amber">
            <AlertTriangle size={14} className="mt-[1px] shrink-0" />
            <span>
              Salle {roomConflict.room} est déjà réservée par {roomConflict.subjectCode} (
              {roomConflict.programmeName}) à ce créneau.
            </span>
          </div>
        )}

        <FRow cols={4}>
          <FField label="Jour" required error={errors.dayOfWeek?.message}>
            <Controller
              control={control}
              name="dayOfWeek"
              render={({ field }) => (
                <Dropdown
                  value={String(field.value)}
                  onChange={(v) => field.onChange(Number(v))}
                  options={dayOptions}
                  error={!!errors.dayOfWeek}
                />
              )}
            />
          </FField>
          <FField label="Début" required error={errors.startTime?.message}>
            <TextInput type="time" error={!!errors.startTime} {...register('startTime')} />
          </FField>
          <FField label="Fin" required error={errors.endTime?.message}>
            <TextInput type="time" error={!!errors.endTime} {...register('endTime')} />
          </FField>
          <FField label="Type" required error={errors.type?.message}>
            <Controller
              control={control}
              name="type"
              render={({ field }) => (
                <Dropdown
                  value={field.value}
                  onChange={(v) => field.onChange(v as ScheduleEntryType)}
                  options={SCHEDULE_TYPES}
                  error={!!errors.type}
                />
              )}
            />
          </FField>
        </FRow>
      </form>
    </Modal>
  );
}
