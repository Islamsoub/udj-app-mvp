'use client';

import { useMemo, useState } from 'react';
import { Calendar, Download, Plus } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { EmptyState } from '@/components/shared/empty-state';
import { SectionLabel } from '@/components/shared/section-label';
import { ScheduleForm } from '@/components/forms/schedule-form';
import { Button } from '@/components/ui/button';
import { PillFilter } from '@/components/ui/tabs';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useCurrentSemester, useProgrammes } from '@/hooks/queries/use-academics';
import { useSchedule } from '@/hooks/queries/use-schedule';
import { COURSE_PALETTE } from '@/lib/tokens';
import {
  SCHEDULE_END_HOUR,
  SCHEDULE_PX_PER_HOUR,
  SCHEDULE_START_HOUR,
  WEEK_DAYS,
} from '@/lib/constants';
import { timeToMinutes } from '@/lib/utils';

const GRID_HEIGHT = (SCHEDULE_END_HOUR - SCHEDULE_START_HOUR) * SCHEDULE_PX_PER_HOUR;
const HOURS = Array.from(
  { length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR + 1 },
  (_, i) => SCHEDULE_START_HOUR + i
);

/** Schedule — weekly grid (impl spec §22). */
export default function SchedulePage() {
  const { open } = useModal();
  const { toast } = useToast();
  const { data: programmes } = useProgrammes();
  const currentSemester = useCurrentSemester();

  const [programmeId, setProgrammeId] = useState('');
  const activeProgramme = programmeId || programmes?.[0]?.id || '';
  const programme = programmes?.find((p) => p.id === activeProgramme);

  const { data: entries } = useSchedule(
    activeProgramme
      ? { programme: activeProgramme, semester: currentSemester?.id }
      : {}
  );

  // Stable course-color assignment: index of subject in the unique subject list.
  const subjectOrder = useMemo(() => {
    const ids: string[] = [];
    for (const e of entries ?? []) {
      if (!ids.includes(e.subjectId)) ids.push(e.subjectId);
    }
    return ids;
  }, [entries]);

  const totalHours = useMemo(() => {
    const minutes = (entries ?? []).reduce(
      (sum, e) => sum + (timeToMinutes(e.endTime) - timeToMinutes(e.startTime)),
      0
    );
    const h = minutes / 60;
    return Number.isInteger(h) ? String(h) : h.toFixed(1);
  }, [entries]);

  const loading = !programmes || !entries;

  return (
    <div>
      <PageHead
        title="Emploi du temps"
        sub={
          programme && currentSemester
            ? `Semaine type · ${programme.nameFr} — ${currentSemester.label}`
            : 'Semaine type'
        }
        actions={
          <>
            <Button
              kind="ghost"
              icon={<Download size={17} />}
              onClick={() => toast('Export disponible prochainement')}
            >
              Exporter
            </Button>
            <Button icon={<Plus size={17} />} onClick={() => open(<ScheduleForm />)}>
              Nouvelle séance
            </Button>
          </>
        }
      />

      {loading ? (
        <>
          <div className="mb-4 h-[34px] w-[420px] animate-pulse rounded-full bg-sunken" />
          <div className="h-[560px] animate-pulse rounded-[16px] bg-sunken" />
        </>
      ) : (
        <>
          <PillFilter
            className="mb-4"
            options={(programmes ?? []).map((p) => ({ key: p.id, label: p.nameFr }))}
            active={activeProgramme}
            onChange={setProgrammeId}
          />

          {entries.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Calendar size={20} />}
                message="Aucun emploi du temps saisi pour ce programme."
                action={
                  <Button icon={<Plus size={17} />} onClick={() => open(<ScheduleForm />)}>
                    Nouvelle séance
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              <SectionLabel className="mb-3">
                {entries.length} séances · {totalHours} h hebdo
              </SectionLabel>

              <Card pad={0} className="overflow-hidden">
                {/* Day headers */}
                <div className="grid" style={{ gridTemplateColumns: '64px repeat(5, 1fr)' }}>
                  <div className="border-b border-hair" />
                  {WEEK_DAYS.map((day, i) => {
                    const count = entries.filter((e) => e.dayOfWeek === i).length;
                    return (
                      <div key={day} className="border-b border-l border-hair p-3">
                        <div className="text-[13px] font-bold text-ink">{day}</div>
                        <div className="mt-[2px] font-mono text-[11px] text-ink3">
                          {count} cours
                        </div>
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
                      {Array.from({ length: SCHEDULE_END_HOUR - SCHEDULE_START_HOUR - 1 }).map(
                        (_, i) => (
                          <div
                            key={i}
                            className="absolute inset-x-0 border-t border-hair"
                            style={{ top: (i + 1) * SCHEDULE_PX_PER_HOUR }}
                          />
                        )
                      )}
                      {entries
                        .filter((e) => e.dayOfWeek === dayIndex)
                        .map((e) => {
                          const startMin = timeToMinutes(e.startTime);
                          const endMin = timeToMinutes(e.endTime);
                          const top =
                            ((startMin - SCHEDULE_START_HOUR * 60) / 60) * SCHEDULE_PX_PER_HOUR + 3;
                          const height = ((endMin - startMin) / 60) * SCHEDULE_PX_PER_HOUR - 6;
                          const color =
                            COURSE_PALETTE[
                              Math.max(0, subjectOrder.indexOf(e.subjectId)) %
                                COURSE_PALETTE.length
                            ];
                          return (
                            <button
                              key={e.id}
                              type="button"
                              onClick={() => open(<ScheduleForm entry={e} />)}
                              className="absolute cursor-pointer overflow-hidden border-0 text-left transition-transform duration-[120ms] hover:scale-[1.02]"
                              style={{
                                top,
                                height,
                                left: 5,
                                right: 5,
                                background: `${color}14`,
                                borderLeft: `3px solid ${color}`,
                                borderRadius: 8,
                                padding: '6px 8px',
                              }}
                            >
                              <div className="truncate text-[12px] font-bold text-ink">
                                {e.subject.nameFr}
                              </div>
                              <div className="font-mono text-[10.5px]" style={{ color }}>
                                {e.startTime}–{e.endTime}
                              </div>
                              {height > 70 && (
                                <div className="truncate text-[10.5px] text-ink2">
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
        </>
      )}
    </div>
  );
}
