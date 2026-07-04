'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Download, GraduationCap } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCurrentSemester, useSemesters, useSubjects } from '@/hooks/queries/use-academics';
import { useGrades } from '@/hooks/queries/use-grades';
import { useStudents } from '@/hooks/queries/use-students';
import { fmt } from '@/lib/grade-helpers';
import { cn } from '@/lib/utils';
import type { GradeRow } from '@/lib/types';

/** Grades picker (impl spec §15) — pick a subject to open the entry table. */
export default function GradesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { data: subjects } = useSubjects();
  const { data: semesters } = useSemesters();
  const currentSemester = useCurrentSemester();
  const { data: grades } = useGrades({});
  const { data: studentsData } = useStudents({ pageSize: 100 });
  const [semesterId, setSemesterId] = useState<string | null>(null);

  const sortedSemesters = useMemo(
    () => (semesters ? [...semesters].sort((a, b) => a.startDate.localeCompare(b.startDate)) : []),
    [semesters]
  );
  const activeSemester = semesterId ?? currentSemester?.id ?? sortedSemesters[0]?.id ?? '';

  const gradesBySubject = useMemo(() => {
    const map = new Map<string, GradeRow[]>();
    for (const g of grades ?? []) {
      const list = map.get(g.subjectId);
      if (list) list.push(g);
      else map.set(g.subjectId, [g]);
    }
    return map;
  }, [grades]);

  const studentsByProgramme = useMemo(() => {
    const map = new Map<string, number>();
    for (const s of studentsData?.data ?? []) {
      map.set(s.programme.id, (map.get(s.programme.id) ?? 0) + 1);
    }
    return map;
  }, [studentsData]);

  const filtered = (subjects ?? []).filter((s) => s.semesterId === activeSemester);
  const loading = !subjects || !semesters || !grades;

  return (
    <div>
      <PageHead
        title="Notes"
        sub="Sélectionnez une matière pour saisir ou modifier les notes"
        actions={
          <Button
            kind="ghost"
            icon={<Download size={17} />}
            onClick={() => toast('Export disponible prochainement')}
          >
            Exporter le relevé
          </Button>
        }
      />

      {loading ? (
        <div className="grid grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[130px] animate-pulse rounded-[16px] bg-sunken" />
          ))}
        </div>
      ) : (
        <>
          <Tabs
            className="mb-5"
            tabs={sortedSemesters.map((s) => ({ key: s.id, label: s.label }))}
            active={activeSemester}
            onChange={setSemesterId}
          />

          {filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={<GraduationCap size={20} />}
                message="Aucune matière pour ce semestre."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map((subject) => {
                const subjectGrades = gradesBySubject.get(subject.id) ?? [];
                const entered = subjectGrades.filter((g) => g.noteFinale != null).length;
                const total = studentsByProgramme.get(subject.programmeId) ?? 0;
                const published =
                  subjectGrades.length > 0 && subjectGrades.every((g) => g.publishedAt != null);
                const complete = total > 0 && entered >= total;
                const finals = subjectGrades
                  .map((g) => g.noteFinale)
                  .filter((n): n is number => n != null);
                const avg =
                  finals.length > 0
                    ? finals.reduce((sum, n) => sum + n, 0) / finals.length
                    : null;

                return (
                  <Card key={subject.id} hover onClick={() => router.push(`/grades/${subject.id}`)}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-jade-faint text-jade-text">
                        <GraduationCap size={20} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15.5px] font-bold text-ink">
                          {subject.nameFr}
                        </div>
                        <div className="mt-[2px] font-mono text-[12px] text-ink3">
                          {subject.code} · Coef. {subject.coefficient}
                        </div>
                      </div>
                      <Badge tone={published ? 'jade' : 'amber'}>
                        {published ? 'Publié' : 'Brouillon'}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center gap-4 border-t border-hair pt-3">
                      <span className="font-mono text-[11px] text-ink3">Saisie</span>
                      <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-sunken">
                        <div
                          className={cn(
                            'h-full rounded-full transition-[width] duration-300',
                            complete ? 'bg-jade' : 'bg-amber'
                          )}
                          style={{
                            width: total > 0 ? `${Math.min(100, (entered / total) * 100)}%` : 0,
                          }}
                        />
                      </div>
                      <span className="font-mono text-[11px] text-ink2">
                        {entered}/{total}
                      </span>
                      <span className="h-6 w-px bg-hair2" />
                      <div className="text-right">
                        <div className="text-[19px] font-extrabold leading-none text-ink">
                          {fmt(avg)}
                        </div>
                        <div className="mt-[3px] font-mono text-[10.5px] text-ink3">
                          Moy. classe
                        </div>
                      </div>
                      <ChevronRight size={16} className="shrink-0 text-ink3" />
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
