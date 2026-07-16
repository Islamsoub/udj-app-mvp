'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Minus, PieChart, Plus, UserCheck, UserX, Users } from 'lucide-react';
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
import { useSchedule } from '@/hooks/queries/use-schedule';
import { useStudents } from '@/hooks/queries/use-students';
import { apiErrorMessage, cn, fmtDateShort, timeToMinutes } from '@/lib/utils';
import type { AttendanceStatus } from '@/lib/types';

type MarkStatus = Extract<AttendanceStatus, 'PRESENT' | 'PARTIAL' | 'ABSENT'>;

const DEFAULT_SESSION_HOURS = 1.5;
const STEP = 0.25;

const SEGMENTS: { value: MarkStatus; label: string; selected: string }[] = [
  { value: 'PRESENT', label: 'Présent', selected: 'bg-jade-faint text-jade-text' },
  { value: 'PARTIAL', label: 'Partiel', selected: 'bg-amber-bg text-amber' },
  { value: 'ABSENT', label: 'Absent', selected: 'bg-danger-bg text-danger' },
];

/** Round to the nearest 0.25 step and clamp into [lo, hi]. */
function clampHours(value: number, lo: number, hi: number): number {
  const snapped = Math.round(value / STEP) * STEP;
  return Math.min(hi, Math.max(lo, snapped));
}

/** "1.5" / "0.75" — mono hours label (no trailing zeros). */
function hoursLabel(n: number): string {
  return String(Math.round(n * 100) / 100);
}

/** Session marking — faire l'appel (Pass C-2, change-set §30.5). */
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

  // Scheduled slot for this subject on the selected weekday (0 = Dimanche) →
  // the session length (Y) that partial marks are measured against.
  const { data: schedule } = useSchedule({
    programme: subject?.programmeId,
    semester: subject?.semesterId,
  });
  const sessionSlot = useMemo(
    () =>
      schedule?.find((e) => e.subjectId === subject?.id && e.dayOfWeek === date.getDay()) ?? null,
    [schedule, subject, date]
  );
  const sessionHours = sessionSlot
    ? (timeToMinutes(sessionSlot.endTime) - timeToMinutes(sessionSlot.startTime)) / 60
    : DEFAULT_SESSION_HOURS;
  const maxPartial = Math.max(STEP, sessionHours - STEP);
  const defaultPartial = clampHours(sessionHours / 2, STEP, maxPartial);

  // Default everyone to PRESENT; reset when the roster changes.
  const [statuses, setStatuses] = useState<Record<string, MarkStatus>>({});
  const [partialHours, setPartialHours] = useState<Record<string, number>>({});
  useEffect(() => {
    setStatuses(Object.fromEntries(roster.map((r) => [r.id, 'PRESENT' as MarkStatus])));
    setPartialHours({});
  }, [roster]);

  const statusOf = (id: string): MarkStatus => statuses[id] ?? 'PRESENT';
  const hoursOf = (id: string): number =>
    clampHours(partialHours[id] ?? defaultPartial, STEP, maxPartial);

  const setStatus = (id: string, value: MarkStatus) =>
    setStatuses((prev) => ({ ...prev, [id]: value }));

  const stepHours = (id: string, delta: number) =>
    setPartialHours((prev) => ({
      ...prev,
      [id]: clampHours((prev[id] ?? defaultPartial) + delta, STEP, maxPartial),
    }));

  const present = roster.filter((r) => statusOf(r.id) === 'PRESENT').length;
  const partial = roster.filter((r) => statusOf(r.id) === 'PARTIAL').length;
  const absent = roster.filter((r) => statusOf(r.id) === 'ABSENT').length;

  const attendedHours = roster.reduce((sum, r) => {
    const s = statusOf(r.id);
    if (s === 'PRESENT') return sum + sessionHours;
    if (s === 'PARTIAL') return sum + hoursOf(r.id);
    return sum;
  }, 0);
  const possibleHours = roster.length * sessionHours;

  const onSave = async () => {
    if (!subject) return;
    // Normalize to UTC midnight so re-saving the same day hits the same upsert
    // key (studentId+subjectId+sessionDate) instead of creating a duplicate.
    const normalizedDate = new Date(
      Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
    );
    try {
      await record.mutateAsync({
        subjectId: subject.id,
        sessionDate: normalizedDate.toISOString(),
        records: roster.map((r) => {
          const s = statusOf(r.id);
          return s === 'PARTIAL'
            ? { studentId: r.id, status: s, hoursAttended: hoursOf(r.id) }
            : { studentId: r.id, status: s };
        }),
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
        sub={
          subject
            ? `${subject.nameFr} · Séance du ${fmtDateShort(date)}${
                sessionSlot
                  ? ` · ${sessionSlot.startTime}–${sessionSlot.endTime} (${hoursLabel(sessionHours)} h)`
                  : ` · ${hoursLabel(sessionHours)} h`
              }`
            : undefined
        }
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
        <StatCard icon={<PieChart size={18} />} tone="amber" label="Partiels" value={partial} />
        <StatCard icon={<UserX size={18} />} tone="danger" label="Absents" value={absent} />
        <StatCard
          icon={<Clock size={18} />}
          tone="blue"
          label="Heures suivies"
          value={hoursLabel(attendedHours)}
          unit="h"
        />
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
              onClick={() => {
                setStatuses(Object.fromEntries(roster.map((r) => [r.id, 'PRESENT' as MarkStatus])));
                setPartialHours({});
              }}
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
              {roster.map((st, idx) => {
                const isPartial = statusOf(st.id) === 'PARTIAL';
                return (
                  <div key={st.id} className="flex items-center gap-3 px-4 py-[10px]">
                    <span className="w-6 font-mono text-[11px] text-ink3">{idx + 1}</span>
                    <Avatar name={st.name} size={30} />
                    <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
                      {st.name}
                    </span>
                    <span className="hidden font-mono text-[11px] text-ink3 sm:inline">
                      {st.matricule}
                    </span>

                    {/* Inline hours stepper (revealed only for Partiel, §30.5) */}
                    {isPartial && (
                      <div className="flex items-center gap-[2px] rounded-[9px] border border-hair2 bg-surface px-1 py-[2px]">
                        <button
                          type="button"
                          onClick={() => stepHours(st.id, -STEP)}
                          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-[7px] border-0 bg-transparent text-ink2 hover:bg-sunken disabled:opacity-40"
                          disabled={hoursOf(st.id) <= STEP}
                          aria-label="Diminuer les heures"
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-[64px] text-center font-mono text-[11.5px] font-semibold text-amber">
                          {hoursLabel(hoursOf(st.id))}h / {hoursLabel(sessionHours)}h
                        </span>
                        <button
                          type="button"
                          onClick={() => stepHours(st.id, STEP)}
                          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-[7px] border-0 bg-transparent text-ink2 hover:bg-sunken disabled:opacity-40"
                          disabled={hoursOf(st.id) >= maxPartial}
                          aria-label="Augmenter les heures"
                        >
                          <Plus size={13} />
                        </button>
                      </div>
                    )}

                    <div className="flex gap-[2px] rounded-[10px] bg-surface2 p-[3px]">
                      {SEGMENTS.map((seg) => {
                        const isSel = statusOf(st.id) === seg.value;
                        return (
                          <button
                            key={seg.value}
                            type="button"
                            onClick={() => setStatus(st.id, seg.value)}
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
                );
              })}
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
          <b className="text-ink">{present}</b> présents · <b className="text-ink">{partial}</b>{' '}
          partiels · <b className="text-ink">{absent}</b> absents ·{' '}
          <b className="text-ink">{hoursLabel(attendedHours)}</b> h suivies sur{' '}
          {hoursLabel(possibleHours)} h
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
