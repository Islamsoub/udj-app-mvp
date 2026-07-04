'use client';

import { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ColumnDef } from '@tanstack/react-table';
import {
  ChevronRight,
  Plus,
  Search,
  SlidersHorizontal,
  Upload,
  Users,
} from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { Avatar } from '@/components/shared/avatar';
import { DataTable } from '@/components/shared/data-table';
import { EmptyState } from '@/components/shared/empty-state';
import { StudentForm } from '@/components/forms/student-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Dropdown } from '@/components/ui/select';
import { useModal } from '@/hooks/use-modal';
import { useStudents } from '@/hooks/queries/use-students';
import { useProgrammes } from '@/hooks/queries/use-academics';
import { useSettings } from '@/hooks/queries/use-settings';
import { fmt, listGradeTone, presenceTone } from '@/lib/grade-helpers';
import { STATUS_META } from '@/lib/constants';
import { TONE_COLORS } from '@/lib/tokens';
import type { StudentRow } from '@/lib/types';

/**
 * Students list (impl spec §12, supplement §8). Client-side search, segmented
 * status filter (with computed "À risque"), advanced filters panel, sortable
 * DataTable. `?filter=risk` preselects the risk segment.
 */
type Segment = 'all' | 'active' | 'risk' | 'suspended';

const GRADE_TEXT: Record<'danger' | 'amber' | 'ink', string> = {
  danger: 'text-danger',
  amber: 'text-amber',
  ink: 'text-ink',
};

function StudentsSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <div className="h-[64px] animate-pulse rounded-[16px] bg-sunken" />
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-[54px] animate-pulse rounded-[12px] bg-sunken" />
      ))}
    </div>
  );
}

function StudentsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { open } = useModal();
  const { data: page, isLoading } = useStudents({ pageSize: 100 });
  const { data: programmes } = useProgrammes();
  const { data: settings } = useSettings();

  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<Segment>(
    searchParams.get('filter') === 'risk' ? 'risk' : 'all'
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [programmeId, setProgrammeId] = useState<string | null>(null);
  const [gpaMin, setGpaMin] = useState(0);

  const threshold = settings?.attendanceThreshold ?? 75;
  const all = useMemo(() => page?.data ?? [], [page]);

  const isRisk = useMemo(
    () => (s: StudentRow) =>
      (s.gpa != null && s.gpa < 10) || (s.presence != null && s.presence < threshold),
    [threshold]
  );

  const counts = useMemo(
    () => ({
      all: all.length,
      risk: all.filter((s) => s.status === 'ACTIVE' && isRisk(s)).length,
      active: all.filter((s) => s.status === 'ACTIVE' && !isRisk(s)).length,
      suspended: all.filter((s) => s.status === 'SUSPENDED').length,
    }),
    [all, isRisk]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all.filter((s) => {
      if (q && !s.name.toLowerCase().includes(q) && !s.matricule.toLowerCase().includes(q))
        return false;
      if (segment === 'risk' && !(s.status === 'ACTIVE' && isRisk(s))) return false;
      if (segment === 'active' && !(s.status === 'ACTIVE' && !isRisk(s))) return false;
      if (segment === 'suspended' && s.status !== 'SUSPENDED') return false;
      if (programmeId && s.programme.id !== programmeId) return false;
      if (gpaMin > 0 && (s.gpa == null || s.gpa < gpaMin)) return false;
      return true;
    });
  }, [all, search, segment, programmeId, gpaMin, isRisk]);

  const columns = useMemo<ColumnDef<StudentRow, unknown>[]>(
    () => [
      {
        accessorKey: 'name',
        header: 'Étudiant',
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <Avatar name={row.original.name} size={32} />
            <div className="min-w-0">
              <div className="truncate text-[13.5px] font-semibold text-ink">
                {row.original.name}
              </div>
              <div className="truncate text-[12px] text-ink3">{row.original.email}</div>
            </div>
          </div>
        ),
      },
      {
        accessorKey: 'matricule',
        header: 'Matricule',
        cell: ({ row }) => (
          <span className="font-mono text-[12px] text-ink2">{row.original.matricule}</span>
        ),
      },
      {
        accessorKey: 'gpa',
        header: 'Moyenne',
        cell: ({ row }) => {
          const gpa = row.original.gpa;
          return (
            <div className="flex items-baseline justify-end gap-[3px]">
              {gpa == null ? (
                <span className="text-[13.5px] text-ink3">—</span>
              ) : (
                <>
                  <span className={`text-[13.5px] font-bold ${GRADE_TEXT[listGradeTone(gpa)]}`}>
                    {fmt(gpa, 2)}
                  </span>
                  <span className="text-[11.5px] text-ink3">/20</span>
                </>
              )}
            </div>
          );
        },
      },
      {
        accessorKey: 'presence',
        header: 'Présence',
        cell: ({ row }) => {
          const p = row.original.presence;
          const barColor = TONE_COLORS[presenceTone(p)][0];
          return (
            <div className="flex items-center justify-end gap-2">
              <span className="h-[5px] w-11 overflow-hidden rounded-full bg-sunken">
                {p != null && (
                  <span
                    className="block h-full rounded-full"
                    style={{ width: `${p}%`, background: barColor }}
                  />
                )}
              </span>
              <span className="font-mono text-[12px] text-ink2">
                {p != null ? `${p}%` : '—'}
              </span>
            </div>
          );
        },
      },
      {
        accessorKey: 'status',
        header: 'Statut',
        enableSorting: false,
        cell: ({ row }) => {
          const s = row.original;
          const meta =
            s.status === 'ACTIVE' && isRisk(s) ? STATUS_META.risk : STATUS_META[s.status];
          return (
            <Badge tone={meta.tone} dot>
              {meta.label}
            </Badge>
          );
        },
      },
      {
        id: 'chevron',
        header: '',
        enableSorting: false,
        size: 36,
        cell: () => <ChevronRight size={15} className="text-ink3" />,
      },
    ],
    [isRisk]
  );

  const total = page?.pagination.total ?? all.length;

  return (
    <>
      <PageHead
        title="Étudiants"
        sub={`${total} inscrits`}
        actions={
          <>
            <Button
              kind="ghost"
              icon={<Upload size={17} />}
              onClick={() => router.push('/students/import')}
            >
              Importer CSV
            </Button>
            <Button kind="primary" icon={<Plus size={17} />} onClick={() => open(<StudentForm />)}>
              Nouvel étudiant
            </Button>
          </>
        }
      />

      {isLoading ? (
        <StudentsSkeleton />
      ) : (
        <Card pad={0}>
          <div className="flex items-center gap-3 border-b border-hair p-4">
            <div className="w-[300px]">
              <TextInput
                icon={<Search size={15} />}
                placeholder="Rechercher par nom ou matricule…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tabs<Segment>
              tabs={[
                { key: 'all', label: 'Tous', count: counts.all },
                { key: 'active', label: 'Actifs', count: counts.active },
                { key: 'risk', label: 'À risque', count: counts.risk, tone: 'danger' },
                { key: 'suspended', label: 'Suspendus', count: counts.suspended, tone: 'slate' },
              ]}
              active={segment}
              onChange={setSegment}
            />
            <Button
              kind={filtersOpen ? 'soft' : 'ghost'}
              icon={<SlidersHorizontal size={15} />}
              size="sm"
              className="ml-auto"
              onClick={() => setFiltersOpen((v) => !v)}
            >
              Filtres
            </Button>
          </div>

          {filtersOpen && (
            <div className="grid grid-cols-3 items-end gap-4 border-b border-hair bg-surface2 p-4">
              <div>
                <div className="mb-[7px] text-[12.5px] font-semibold text-ink2">Programme</div>
                <Dropdown
                  value={programmeId}
                  onChange={setProgrammeId}
                  options={(programmes ?? []).map((p) => ({ value: p.id, label: p.nameFr }))}
                  placeholder="Tous"
                />
              </div>
              <div>
                <div className="mb-[7px] flex items-center justify-between text-[12.5px] font-semibold text-ink2">
                  <span>Moyenne minimale</span>
                  <span className="font-mono text-[12px] text-jade-text">
                    {gpaMin.toFixed(1)}
                  </span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={20}
                  step={0.5}
                  value={gpaMin}
                  onChange={(e) => setGpaMin(Number(e.target.value))}
                  className="w-full"
                />
              </div>
              <div>
                <Button
                  kind="quiet"
                  onClick={() => {
                    setProgrammeId(null);
                    setGpaMin(0);
                  }}
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
          )}

          <DataTable<StudentRow>
            columns={columns}
            data={filtered}
            pageSize={20}
            onRowClick={(row) => router.push(`/students/${row.id}`)}
            totalLabel={(_shown, totalFiltered) => `${totalFiltered} sur ${total} étudiants`}
            emptyState={<EmptyState icon={<Users size={20} />} message="Aucun étudiant trouvé." />}
          />
        </Card>
      )}
    </>
  );
}

export default function StudentsPage() {
  return (
    <Suspense fallback={<StudentsSkeleton />}>
      <StudentsInner />
    </Suspense>
  );
}
