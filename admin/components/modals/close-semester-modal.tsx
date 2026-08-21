'use client';

import { CalendarCheck } from 'lucide-react';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useToast } from '@/hooks/use-toast';
import { useSaveSemester } from '@/hooks/queries/use-academics';
import { apiErrorMessage } from '@/lib/utils';
import type { Semester } from '@/lib/types';

/**
 * CloseSemesterModal (impl spec §28, supplement §4.5).
 *
 * The endpoint behind this only clears `isCurrent` — it does not freeze grades,
 * archive attendance, or create the next semester. The copy below describes
 * exactly that. A real archival close is tracked for v1.1; until it exists this
 * modal must not promise it, and the danger styling/typed confirmation are gone
 * because the action is reversible (set another semester as current).
 */
export function CloseSemesterModal({ semester }: { semester: Semester }) {
  const { toast } = useToast();
  const saveSemester = useSaveSemester();

  return (
    <ConfirmModal
      title="Clôturer le semestre"
      sub={`${semester.label} — ${semester.academicYear}`}
      icon={<CalendarCheck size={19} />}
      iconTone="jade"
      body={
        <>
          <p className="m-0">
            «&nbsp;{semester.label} — {semester.academicYear}&nbsp;» sera marqué comme
            terminé et ne sera plus le semestre courant.
          </p>
          <ul className="mb-0 mt-2 list-disc space-y-1 ps-5">
            <li>Les notes et les présences restent modifiables</li>
            <li>Aucune donnée n’est archivée ni supprimée</li>
            <li>Le prochain semestre doit être défini manuellement</li>
          </ul>
        </>
      }
      confirmLabel="Marquer comme terminé"
      busy={saveSemester.isPending}
      onConfirm={async () => {
        try {
          await saveSemester.mutateAsync({ id: semester.id, data: { isCurrent: false } });
          toast('Semestre clôturé', 'check');
        } catch (err) {
          toast(apiErrorMessage(err), 'x');
          return { keep: true } as const;
        }
      }}
    />
  );
}
