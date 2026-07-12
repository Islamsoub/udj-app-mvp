'use client';

import { useMemo } from 'react';
import { Calendar, Download, Plus } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionLabel } from '@/components/shared/section-label';
import { ScheduleForm } from '@/components/forms/schedule-form';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useCurrentSemester, useProgramme } from '@/hooks/queries/use-academics';
import { useSchedule } from '@/hooks/queries/use-schedule';
import { useScopeStore, type ScheduleMode } from '@/stores/scope-store';
import { COURSE_PALETTE } from '@/lib/tokens';
import {
  SCHEDULE_END_HOUR,
  SCHEDULE_PX_PER_HOUR,
  SCHEDULE_START_HOUR,
  WEEK_DAYS,
} from '@/lib/constants';
import { timeToMinutes } from '@/lib/utils';
import type { ScheduleEntry, ScheduleFilters } from '@/lib/types';

const GRID_HEIGHT = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * SCHEDULE_PX_PER_HOUR;
const HOURS = Array.from(
  { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR + 1 },
  (_, i) => SCHEDULE_START_HOUR + i
);

const MODES: { key: ScheduleMode; label: string }[] = [
  { key: 'programme', label: 'Par programme' },
  { key: 'room', label: 'Par salle' },
  { key: 'teacher', label: 'Par enseignant' },
];

/** Schedule — weekly grid with three view modes (Pass C-2, change-set §30.7). */
export default function SchedulePage() {
  const { open } = useModal();
  const { toast } = useToast();
  const currentSemester = useCurrentSemester();

  const mode = useScopeStore((s) => s.scheduleMode);
  const programmeId = useScopeStore((s) => s.programmeId);
  const room = useScopeStore((s) => s.room);
  const professorName = useScopeStore((s) => s.professorName);
  const setScheduleMode = useScopeStore((s) => s.setScheduleMode);
  const setProgramme = useScopeStore((s) => s.setProgramme);

  const programme = useProgramme(programmeId);
  const readOnly = mode !== 'programme';

  // Selection per mode → the value the Context Bar controls upstream.
  const selection =
    mode === 'programme' ? programmeId : mode === 'room' ? room : professorName;

  const filters: ScheduleFilters = useMemo(() => {
    if (mode === 'programme') {
      return programmeId ? { programme: programmeId, semester: currentSemester?.id } : {};
    }
    if (mode === 'room') return room ? { room } : {};
    return professorName ? { professorName } : {};
  }, [mode, programmeId, room, professorName, currentSemester?.id]);

  const { data: entries } = useSchedule(filters);
  const list = useMemo(() => (selection ? (entries ?? []) : []), [selection, entries]);

  // Stable course-color assignment: index of subject in the unique subject list.
  const subjectOrder = useMemo(() => {
    const ids: string[] = [];
    for (const e of list) if (!ids.includes(e.subjectId)) ids.push(e.subjectId);
    return ids;
  }, [list]);

  // Conflict detection (read-only modes): overlapping blocks on the same day.
  const conflictIds = useMemo(() => {
    const ids = new Set<string>();
    if (!readOnly) return ids;
    for (let i = 0; i < list.length; i += 1) {
      for (let j = i + 1; j < list.length; j += 1) {
        const a = list[i];
        const b = list[j];
        if (a.dayOfWeek === b.dayOfWeek && a.startTime < b.endTime && b.startTime < a.endTime) {
          ids.add(a.id);
          ids.add(b.id);
        }
      }
    }
    return ids;
  }, [list, readOnly]);

  const totalHours = useMemo(() => {
    const minutes = list.reduce(
      (sum, e) => sum + (timeToMinutes(e.endTime) - timeToMinutes(e.startTime)),
      0
    );
    const h = minutes / 60;
    return Number.isInteger(h) ? String(h) : h.toFixed(1);
  }, [list]);

  const loading = !currentSemester && mode === 'programme';

  const onBlockClick = (e: ScheduleEntry) => {
    if (readOnly) {
      // Jump to the entry's programme in par-programme mode, pre-selected to edit.
      setScheduleMode('programme');
      setProgramme(e.subject.programme.id);
    }
    open(<ScheduleForm entry={e} />);
  };

  const promptByMode: Record<ScheduleMode, string> = {
    programme: 'Sélectionnez un programme dans la barre de contexte pour afficher son emploi du temps.',
    room: 'Sélectionnez une salle dans la barre de contexte pour voir toutes ses réservations.',
    teacher: 'Sélectionnez un enseignant dans la barre de contexte pour voir ses séances.',
  };

  const headline =
    mode === 'programme'
      ? programme
        ? `${programme.nameFr}${currentSemester ? ` — ${currentSemester.label}` : ''}`
        : 'Semaine type'
      : mode === 'room'
        ? room
          ? `Salle ${room} · toutes réservations`
          : 'Par salle'
        : professorName
          ? `${professorName} · toutes séances`
          : 'Par enseignant';

  return (
    <div>
      <PageHead
        title="Emploi du temps"
        sub={headline}
        actions={
          <>
            <Button
              kind="ghost"
              icon={<Download size={17} />}
              onClick={() => toast('Export disponible prochainement')}
            >
              Exporter
            </Button>
            {mode === 'programme' && (
              <Button icon={<Plus size={17} />} onClick={() => open(<ScheduleForm />)}>
                Nouvelle séance
              </Button>
            )}
          </>
        }
      />

      {/* Segmented control (§30.7) */}
      <div className="mb-5 inline-flex gap-[2px] rounded-[10px] bg-surface2 p-[3px]">
        {MODES.map((m) => {
          const active = m.key === mode;
          return (
            <button
              key={m.key}
              type="button"
              onClick={() => setScheduleMode(m.key)}
              className={
                active
                  ? 'cursor-pointer rounded-[8px] border-0 bg-surface px-[14px] py-[7px] text-[13px] font-bold text-ink shadow'
                  : 'cursor-pointer rounded-[8px] border-0 bg-transparent px-[14px] py-[7px] text-[13px] font-semibold text-ink2 hover:bg-sunken'
              }
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {!selection ? (
        <Card>
          <EmptyState icon={<Calendar size={20} />} message={promptByMode[mode]} />
        </Card>
      ) : loading ? (
        <div className="h-[560px] animate-pulse rounded-[16px] bg-sunken" />
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Calendar size={20} />}
            message="Aucune séance pour cette sélection."
            action={
              mode === 'programme' ? (
                <Button icon={<Plus size={17} />} onClick={() => open(<ScheduleForm />)}>
                  Nouvelle séance
                </Button>
              ) : undefined
            }
          />
        </Card>
      ) : (
        <>
          <div className="mb-3 flex items-center gap-3">
            <SectionLabel>
              {list.length} séances · {totalHours} h hebdo
              {readOnly && conflictIds.size > 0 ? ` · ${conflictIds.size} en conflit` : ''}
            </SectionLabel>
            {readOnly && <Badge tone="slate">Lecture seule</Badge>}
          </div>

          <Card pad={0} className="overflow-hidden">
            {/* Day headers */}
            <div className="grid" style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}>
              <div className="border-b border-hair" />
              {WEEK_DAYS.map((day, i) => {
                const count = list.filter((e) => e.dayOfWeek === i).length;
                return (
                  <div key={day} className="border-b border-l border-hair p-3">
                    <div className="text-[13px] font-bold text-ink">{day}</div>
                    <div className="mt-[2px] font-mono text-[11px] text-ink3">{count} cours</div>
                  </div>
                );
              })}
            </div>

            {/* Body */}
            <div className="grid" style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}>
              {/* Time axis */}
              <div className="relative" style={{ height: GRID_HEIGHT }}>
                {HOURS.map((h) => (
                  <div
                    key={h}
                    className="absolute right-0 -translate-y-1/2 pr-2 font-mono text-[10.5px] text-ink3"
                    style={{ top: (h - SCHEDULE_START_HOUR) * SCHEDULE_PX_PER_HOUR }}
                  >
                    {String(h).padStart(2, '0')}:00
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {WEEK_DAYS.map((day, dayIndex) => (
                <div
                  key={day}
                  className="relative border-l border-hair"
                  style={{ height: GRID_HEIGHT }}
                >
                  {Array.from({ length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR - 1 }).map((_, i) => (
                    <div
                      key={i}
                      className="absolute inset-x-0 border-t border-hair"
                      style={{ top: (i + 1) * SCHEDULE_PX_PER_HOUR }}
                    />
                  ))}
                  {list
                    .filter((e) => e.dayOfWeek === dayIndex)
                    .map((e) => {
                      const startMin = timeToMinutes(e.startTime);
                      const endMin = timeToMinutes(e.endTime);
                      const top =
                        ((startMin - SCHEDULE_START_HOUR * 60) / 60) * SCHEDULE_PX_PER_HOUR + 3;
                      const height = ((endMin - startMin) / 60) * SCHEDULE_PX_PER_HOUR - 6;
                      const color =
                        COURSE_PALETTE[
                          Math.max(0, subjectOrder.indexOf(e.subjectId)) % COURSE_PALETTE.length
                        ];
                      const conflict = conflictIds.has(e.id);
                      return (
                        <button
                          key={e.id}
                          type="button"
                          onClick={() => onBlockClick(e)}
                          className="absolute cursor-pointer overflow-hidden text-left transition-transform duration-[120ms] hover:scale-[1.02]"
                          style={{
                            top,
                            height,
                            left: 5,
                            right: 5,
                            background: `${color}14`,
                            border: conflict ? '1.5px dashed var(--danger)' : `0`,
                            borderLeft: conflict ? '3px solid var(--danger)' : `3px solid ${color}`,
                            borderRadius: 8,
                            padding: '6px 8px',
                          }}
                        >
                          <div className="flex items-center gap-1">
                            <span className="truncate text-[12px] font-bold text-ink">
                              {e.subject.nameFr}
                            </span>
                            {conflict && (
                              <span className="shrink-0 rounded-full bg-danger-bg px-[5px] py-[1px] text-[9px] font-bold text-danger">
                                ⚠ Conflit
                              </span>
                            )}
                          </div>
                          <div className="font-mono text-[10.5px]" style={{ color }}>
                            {e.startTime}–{e.endTime}
                          </div>
                          {height > 70 && (
                            <div className="truncate text-[10.5px] text-ink2">
                              {readOnly ? `${e.subject.programme.code} · ` : ''}
                              {e.room} · {e.professorName}
                            </div>
                          )}
                        </button>
                      );
                    })}
                </div>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
