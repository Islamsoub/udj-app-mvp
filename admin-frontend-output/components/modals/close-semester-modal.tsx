'use client';

import { AlertTriangle } from 'lucide-react';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { useToast } from '@/hooks/use-toast';
import { useSaveSemester } from '@/hooks/queries/use-academics';
import { apiErrorMessage } from '@/lib/utils';
import type { Semester } from '@/lib/types';

/**
 * CloseSemesterModal (impl spec §28, supplement §4.5) — requireText gates the
 * button until the semester label is typed exactly. Freezes grades, archives
 * attendance and prepares the next semester.
 */
export function CloseSemesterModal({ semester }: { semester: Semester }) {
  const { toast } = useToast();
  const saveSemester = useSaveSemester();

  return (
    <ConfirmModal
      title="Clôturer le semestre"
      sub={`${semester.label} — ${semester.academicYear}`}
      icon={<AlertTriangle size={19} />}
      iconTone="danger"
      requireText={semester.label}
      body={
        <>
          <p className="m-0">
            «&nbsp;{semester.label} — {semester.academicYear}&nbsp;» sera clôturé. Cette
            action&nbsp;:
          </p>
          <ul className="mb-0 mt-2 list-disc space-y-1 ps-5">
            <li>Fige les notes du semestre</li>
            <li>Archive les relevés de présence</li>
            <li>Prépare le prochain semestre</li>
          </ul>
        </>
      }
      confirmLabel="Clôturer"
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
