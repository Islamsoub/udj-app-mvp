'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, UserCheck, UserX, Users } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { Avatar } from '@/components/shared/avatar';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { DatePicker } from '@/components/shared/date-picker';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useSubjects } from '@/hooks/queries/use-academics';
import { useRecordSession } from '@/hooks/queries/use-attendance';
import { useStudents } from '@/hooks/queries/use-students';
import { apiErrorMessage, cn, fmtDateShort } from '@/lib/utils';
import type { AttendanceStatus } from '@/lib/types';

type MarkStatus = Extract<AttendanceStatus, 'PRESENT' | 'LATE' | 'ABSENT'>;

const SEGMENTS: { value: MarkStatus; label: string; selected: string }[] = [
  { value: 'PRESENT', label: 'Présent', selected: 'bg-jade-faint text-jade-text' },
  { value: 'LATE', label: 'Retard', selected: 'bg-amber-bg text-amber' },
  { value: 'ABSENT', label: 'Absent', selected: 'bg-danger-bg text-danger' },
];

/** Session marking — faire l'appel (impl spec §18). */
export default function SessionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: subjects } = useSubjects();
  const record = useRecordSession();

  const [subjectId, setSubjectId] = useState('');
  const activeSubjectId = subjectId || subjects?.[0]?.id || '';
  const subject = subjects?.find((s) => s.id === activeSubjectId);

  const [date, setDate] = useState<Date>(() => new Date());
  const { data: studentsData } = useStudents({ programme: subject?.programmeId, pageSize: 200 });
  const roster = useMemo(() => studentsData?.data ?? [], [studentsData]);

  // Default everyone to PRESENT; reset when the roster changes.
  const [statuses, setStatuses] = useState<Record<string, MarkStatus>>({});
  useEffect(() => {
    setStatuses(Object.fromEntries(roster.map((r) => [r.id, 'PRESENT' as MarkStatus])));
  }, [roster]);

  const statusOf = (id: string): MarkStatus => statuses[id] ?? 'PRESENT';
  const present = roster.filter((r) => statusOf(r.id) === 'PRESENT').length;
  const late = roster.filter((r) => statusOf(r.id) === 'LATE').length;
  const absent = roster.filter((r) => statusOf(r.id) === 'ABSENT').length;

  const onSave = async () => {
    if (!subject) return;
    try {
      await record.mutateAsync({
        subjectId: subject.id,
        sessionDate: date.toISOString(),
        records: roster.map((r) => ({ studentId: r.id, status: statusOf(r.id) })),
      });
      router.push('/attendance');
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const loading = !subjects || !studentsData;

  return (
    <div className="pb-[76px]">
      <PageHead
        back="/attendance"
        title="Faire l'appel"
        sub={subject ? `${subject.nameFr} · Séance du ${fmtDateShort(date)}` : undefined}
      />

      <div className="mb-5 flex items-center gap-3">
        <Dropdown
          className="w-[280px]"
          value={activeSubjectId}
          onChange={setSubjectId}
          options={(subjects ?? []).map((s) => ({ value: s.id, label: `${s.nameFr} (${s.code})` }))}
          placeholder="Choisir une matière"
        />
        <DatePicker value={date} onChange={setDate} />
      </div>

      <div className="mb-5 grid grid-cols-4 gap-4">
        <StatCard icon={<UserCheck size={18} />} tone="jade" label="Présents" value={present} />
        <StatCard icon={<Clock size={18} />} tone="amber" label="Retards" value={late} />
        <StatCard icon={<UserX size={18} />} tone="danger" label="Absents" value={absent} />
        <StatCard icon={<Users size={18} />} tone="slate" label="Total" value={roster.length} />
      </div>

      {loading ? (
        <div className="h-[420px] animate-pulse rounded-[16px] bg-sunken" />
      ) : (
        <Card pad={0} className="overflow-hidden">
          <div className="flex items-center justify-between p-4">
            <div className="text-[14px] font-bold text-ink">{roster.length} étudiants</div>
            <Button
              kind="quiet"
              size="sm"
              onClick={() =>
                setStatuses(Object.fromEntries(roster.map((r) => [r.id, 'PRESENT' as MarkStatus])))
              }
            >
              Tout présent
            </Button>
          </div>
          {roster.length === 0 ? (
            <EmptyState
              icon={<Users size={20} />}
              message="Aucun étudiant inscrit dans ce programme."
            />
          ) : (
            <div className="divide-y divide-hair border-t border-hair">
              {roster.map((st, idx) => (
                <div key={st.id} className="flex items-center gap-3 px-4 py-[10px]">
                  <span className="w-6 font-mono text-[11px] text-ink3">{idx + 1}</span>
                  <Avatar name={st.name} size={30} />
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
                    {st.name}
                  </span>
                  <span className="font-mono text-[11px] text-ink3">{st.matricule}</span>
                  <div className="flex gap-[2px] rounded-[10px] bg-surface2 p-[3px]">
                    {SEGMENTS.map((seg) => {
                      const isSel = statusOf(st.id) === seg.value;
                      return (
                        <button
                          key={seg.value}
                          type="button"
                          onClick={() =>
                            setStatuses((prev) => ({ ...prev, [st.id]: seg.value }))
                          }
                          className={cn(
                            'cursor-pointer rounded-[8px] border-0 px-3 py-[6px] text-[12px] font-semibold transition-colors',
                            isSel ? seg.selected : 'bg-transparent text-ink3 hover:bg-sunken'
                          )}
                        >
                          {seg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {/* Sticky action bar (always visible) */}
      <div
        className="fixed bottom-0 right-0 z-50 flex items-center gap-3 border-t border-hair bg-surface px-8 py-3"
        style={{ left: 248, boxShadow: '0 -6px 22px rgba(10,30,22,0.08)' }}
      >
        <div className="flex-1 text-[13px] text-ink3">
          <b className="text-ink">{present}</b> présents · <b className="text-ink">{late}</b>{' '}
          retards · <b className="text-ink">{absent}</b> absents
        </div>
        <Button kind="quiet" onClick={() => router.push('/attendance')}>
          Annuler
        </Button>
        <Button disabled={!subject || roster.length === 0 || record.isPending} onClick={onSave}>
          Enregistrer l&apos;appel
        </Button>
      </div>
    </div>
  );
}
