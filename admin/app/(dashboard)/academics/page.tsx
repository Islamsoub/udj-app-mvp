'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  BookOpen,
  Calendar,
  GraduationCap,
  Layers,
  Pencil,
  Plus,
} from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { SectionLabel } from '@/components/shared/section-label';
import { TableShell } from '@/components/shared/table-shell';
import { EmptyState } from '@/components/shared/empty-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, PillFilter } from '@/components/ui/tabs';
import { Menu } from '@/components/ui/dropdown-menu';
import { FacultyForm } from '@/components/forms/faculty-form';
import { ProgrammeForm } from '@/components/forms/programme-form';
import { SubjectForm } from '@/components/forms/subject-form';
import { SemesterForm } from '@/components/forms/semester-form';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import {
  useFaculties,
  useProgrammes,
  useSaveSemester,
  useSemesters,
  useSubjects,
} from '@/hooks/queries/use-academics';
import { PROGRAMME_LEVELS } from '@/lib/constants';
import { apiErrorMessage, fmtDate } from '@/lib/utils';
import type { Tone } from '@/lib/tokens';

/**
 * Academics (impl spec §21) — Facultés / Programmes / Matières / Semestres in
 * one tabbed page. "Ajouter" opens the form matching the active tab; rows and
 * cards open the matching edit form.
 */
type TabKey = 'faculties' | 'programmes' | 'subjects' | 'semesters';

function levelLabel(level: string): string {
  return PROGRAMME_LEVELS.find((l) => l.value === level)?.label ?? level;
}

function semesterTone(label: string | undefined): Tone {
  if (!label) return 'slate';
  if (label.includes('1')) return 'blue';
  if (label.includes('2')) return 'amber';
  return 'slate';
}

function AcademicsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[120px] animate-pulse rounded-[16px] bg-sunken" />
      ))}
    </div>
  );
}

export default function AcademicsPage() {
  const { open } = useModal();
  const { toast } = useToast();
  const [tab, setTab] = useState<TabKey>('faculties');
  const [facultyFilter, setFacultyFilter] = useState('');

  const { data: faculties, isLoading: facultiesLoading } = useFaculties();
  const { data: allProgrammes } = useProgrammes();
  const { data: programmes, isLoading: programmesLoading } = useProgrammes(
    facultyFilter || undefined
  );
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: semesters, isLoading: semestersLoading } = useSemesters();
  const saveSemester = useSaveSemester();

  // Faculty student totals — summed from each faculty's programmes, since the
  // faculties endpoint only returns a programme count.
  const studentsByFaculty = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of allProgrammes ?? []) {
      if (!p.facultyId) continue;
      map.set(p.facultyId, (map.get(p.facultyId) ?? 0) + (p._count?.students ?? 0));
    }
    return map;
  }, [allProgrammes]);

  const addForms: Record<TabKey, ReactNode> = {
    faculties: <FacultyForm />,
    programmes: <ProgrammeForm />,
    subjects: <SubjectForm />,
    semesters: <SemesterForm />,
  };

  const setCurrent = async (id: string) => {
    try {
      await saveSemester.mutateAsync({ id, data: { isCurrent: true } });
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  return (
    <>
      <PageHead
        title="Structure académique"
        sub="Facultés, programmes, matières et semestres"
        actions={
          <Button kind="primary" icon={<Plus size={17} />} onClick={() => open(addForms[tab])}>
            Ajouter
          </Button>
        }
      />

      <Tabs<TabKey>
        className="mb-5"
        tabs={[
          { key: 'faculties', label: 'Facultés', count: faculties?.length },
          { key: 'programmes', label: 'Programmes', count: allProgrammes?.length },
          { key: 'subjects', label: 'Matières', count: subjects?.length },
          { key: 'semesters', label: 'Semestres', count: semesters?.length },
        ]}
        active={tab}
        onChange={setTab}
      />

      {/* ─── Facultés ────────────────────────────────────────────────────── */}
      {tab === 'faculties' &&
        (facultiesLoading ? (
          <AcademicsSkeleton />
        ) : (faculties ?? []).length === 0 ? (
          <Card pad={0}>
            <EmptyState icon={<BookOpen size={20} />} message="Aucune faculté enregistrée." />
          </Card>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {(faculties ?? []).map((f) => (
              <Card key={f.id} hover onClick={() => open(<FacultyForm faculty={f} />)}>
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-jade-faint font-mono text-[13px] font-bold text-jade-text">
                    {f.code}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold text-ink">{f.nameFr}</div>
                    <div className="truncate text-[12.5px] text-ink3">Contact · {f.email}</div>
                  </div>
                  <Menu
                    items={[
                      {
                        icon: <Pencil size={15} />,
                        label: 'Modifier',
                        onClick: () => open(<FacultyForm faculty={f} />),
                      },
                      {
                        icon: <Layers size={15} />,
                        label: 'Voir les programmes',
                        onClick: () => {
                          setFacultyFilter(f.id);
                          setTab('programmes');
                        },
                      },
                    ]}
                  />
                </div>
                <div className="mt-3 flex gap-6 border-t border-hair pt-3">
                  <div>
                    <SectionLabel>Programmes</SectionLabel>
                    <div className="text-[15px] font-extrabold text-ink">
                      {f._count?.programmes ?? 0}
                    </div>
                  </div>
                  <div>
                    <SectionLabel>Étudiants</SectionLabel>
                    <div className="text-[15px] font-extrabold text-ink">
                      {studentsByFaculty.get(f.id) ?? 0}
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ))}

      {/* ─── Programmes ──────────────────────────────────────────────────── */}
      {tab === 'programmes' && (
        <>
          <PillFilter
            className="mb-4"
            options={[
              { key: '', label: 'Toutes facultés' },
              ...(faculties ?? []).map((f) => ({ key: f.id, label: f.code })),
            ]}
            active={facultyFilter}
            onChange={setFacultyFilter}
          />
          {programmesLoading ? (
            <AcademicsSkeleton />
          ) : (
            <TableShell
              columns={[
                { label: 'Programme' },
                { label: 'Faculté' },
                { label: 'Niveau' },
                { label: 'Étudiants', align: 'end' },
                { label: '', width: 40 },
              ]}
            >
              {(programmes ?? []).length === 0 ? (
                <EmptyState
                  icon={<Layers size={20} />}
                  message="Aucun programme pour cette faculté."
                />
              ) : (
                (programmes ?? []).map((p) => (
                  <div
                    key={p.id}
                    className="flex h-[56px] cursor-pointer items-center border-t border-hair px-4 transition-colors first:border-0 hover:bg-surface2"
                    onClick={() => open(<ProgrammeForm programme={p} />)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-semibold text-ink">{p.nameFr}</div>
                      <div className="font-mono text-[11px] text-ink3">{p.code}</div>
                    </div>
                    <div className="flex-1">
                      <Badge tone="blue">{p.faculty?.code ?? '—'}</Badge>
                    </div>
                    <div className="flex-1 text-[13px] text-ink2">{levelLabel(p.level)}</div>
                    <div className="flex-1 text-end font-mono text-[12.5px] text-ink">
                      {p._count?.students ?? 0}
                    </div>
                    <div className="flex w-10 shrink-0 justify-end">
                      <Pencil size={14} className="text-ink3" />
                    </div>
                  </div>
                ))
              )}
            </TableShell>
          )}
        </>
      )}

      {/* ─── Matières ────────────────────────────────────────────────────── */}
      {tab === 'subjects' &&
        (subjectsLoading ? (
          <AcademicsSkeleton />
        ) : (
          <TableShell
            columns={[
              { label: 'Matière' },
              { label: 'Code' },
              { label: 'Professeur' },
              { label: 'Semestre' },
              { label: 'Coef', align: 'end' },
              { label: '', width: 40 },
            ]}
          >
            {(subjects ?? []).length === 0 ? (
              <EmptyState icon={<GraduationCap size={20} />} message="Aucune matière enregistrée." />
            ) : (
              (subjects ?? []).map((s) => (
                <div
                  key={s.id}
                  className="flex h-[56px] cursor-pointer items-center border-t border-hair px-4 transition-colors first:border-0 hover:bg-surface2"
                  onClick={() => open(<SubjectForm subject={s} />)}
                >
                  <div className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
                    {s.nameFr}
                  </div>
                  <div className="flex-1 font-mono text-[12px] text-ink2">{s.code}</div>
                  <div className="min-w-0 flex-1 truncate text-[13px] text-ink2">
                    {s.professorName || '—'}
                  </div>
                  <div className="flex-1">
                    <Badge tone={semesterTone(s.semester?.label)}>{s.semester?.label ?? '—'}</Badge>
                  </div>
                  <div className="flex-1 text-end font-mono text-[12.5px] text-ink">
                    {s.coefficient}
                  </div>
                  <div className="flex w-10 shrink-0 justify-end">
                    <Pencil size={14} className="text-ink3" />
                  </div>
                </div>
              ))
            )}
          </TableShell>
        ))}

      {/* ─── Semestres ───────────────────────────────────────────────────── */}
      {tab === 'semesters' &&
        (semestersLoading ? (
          <AcademicsSkeleton />
        ) : (semesters ?? []).length === 0 ? (
          <Card pad={0}>
            <EmptyState icon={<Calendar size={20} />} message="Aucun semestre enregistré." />
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {(semesters ?? []).map((s) => (
              <Card key={s.id} className="flex items-center gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-blue-bg text-blue">
                  <Calendar size={19} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[15px] font-bold text-ink">
                    {s.label} · {s.academicYear}
                  </div>
                  <div className="font-mono text-[12px] text-ink3">
                    {fmtDate(s.startDate)} → {fmtDate(s.endDate)}
                  </div>
                </div>
                {s.isCurrent ? (
                  <Badge tone="jade" dot>
                    En cours
                  </Badge>
                ) : (
                  <Badge tone="slate">Clôturé</Badge>
                )}
                {s.isCurrent ? (
                  <Button kind="ghost" size="sm" onClick={() => open(<SemesterForm semester={s} />)}>
                    Gérer
                  </Button>
                ) : (
                  <Button
                    kind="ghost"
                    size="sm"
                    disabled={saveSemester.isPending}
                    onClick={() => setCurrent(s.id)}
                  >
                    Définir comme courant
                  </Button>
                )}
              </Card>
            ))}
          </div>
        ))}
    </>
  );
}
