'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
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
import { useModal } from '@/hooks/use-modal';
import { useStudents } from '@/hooks/queries/use-students';
import { useSettings } from '@/hooks/queries/use-settings';
import { useScopeStore } from '@/stores/scope-store';
import { fmt, listGradeTone, presenceTone } from '@/lib/grade-helpers';
import { STATUS_META } from '@/lib/constants';
import { TONE_COLORS } from '@/lib/tokens';
import type { StudentRow, StudentStatus } from '@/lib/types';

/**
 * Students list (impl spec §12, supplement §8). Server-side search / status /
 * scope (Faculté→Programme from the Context Bar) / GPA filtering + pagination —
 * TanStack Query re-fetches on any filter change via the query key. `?filter=risk`
 * preselects the risk segment. The computed "À risque" cut isn't expressible as a
 * backend filter, so it refines the current ACTIVE page client-side.
 */
type Segment = 'all' | 'active' | 'risk' | 'suspended';

const PAGE_SIZE = 20;

const SEGMENT_STATUS: Record<Segment, StudentStatus | undefined> = {
  all: undefined,
  active: 'ACTIVE',
  risk: 'ACTIVE',
  suspended: 'SUSPENDED',
};

// On-tint figure colors so GPA text matches the on-tint presence bars in the
// same row — one red / one amber per screen (see TONE_COLORS in lib/tokens).
const GRADE_TEXT: Record<'danger' | 'amber' | 'ink', string> = {
  danger: 'text-danger-on-tint',
  amber: 'text-amber-on-tint',
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
  const { data: settings } = useSettings();

  // Faculté → Programme scope comes from the Context Bar (shared scope store).
  const facultyId = useScopeStore((s) => s.facultyId);
  const programmeId = useScopeStore((s) => s.programmeId);

  const [search, setSearch] = useState('');
  const [segment, setSegment] = useState<Segment>(
    searchParams.get('filter') === 'risk' ? 'risk' : 'all'
  );
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [gpaMin, setGpaMin] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);

  const threshold = settings?.attendanceThreshold ?? 75;

  // All filtering happens server-side; changing any filter resets to page 1 and
  // TanStack Query re-fetches (the filters are part of the query key).
  const { data: page, isLoading } = useStudents({
    search: search.trim() || undefined,
    status: SEGMENT_STATUS[segment],
    faculty: facultyId ?? undefined,
    programme: programmeId ?? undefined,
    gpaMin: gpaMin > 0 ? gpaMin : undefined,
    page: pageIndex + 1,
    pageSize: PAGE_SIZE,
  });

  useEffect(() => {
    setPageIndex(0);
  }, [search, segment, facultyId, programmeId, gpaMin]);

  const isRisk = useMemo(
    () => (s: StudentRow) =>
      (s.gpa != null && s.gpa < 10) || (s.presence != null && s.presence < threshold),
    [threshold]
  );

  const serverRows = useMemo(() => page?.data ?? [], [page]);

  // "À risque" is a computed cut the backend can't express — refine the ACTIVE
  // page client-side. (A backend `atRisk` filter would make this fully paginable.)
  const rows = useMemo(
    () => (segment === 'risk' ? serverRows.filter((s) => s.status === 'ACTIVE' && isRisk(s)) : serverRows),
    [serverRows, segment, isRisk]
  );

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

  const total = page?.pagination.total ?? 0;
  const pageCount = page?.pagination.totalPages ?? 1;

  return (
    <>
      <PageHead
        title="Étudiants"
        sub={
          segment === 'risk'
            ? `${page ? rows.length : '—'} à risque · page actuelle`
            : `${page ? total : '—'} inscrits`
        }
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
                { key: 'all', label: 'Tous' },
                { key: 'active', label: 'Actifs' },
                { key: 'risk', label: 'À risque', tone: 'danger' },
                { key: 'suspended', label: 'Suspendus', tone: 'slate' },
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
            <div className="grid grid-cols-2 items-end gap-4 border-b border-hair bg-surface2 p-4">
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
                <Button kind="quiet" onClick={() => setGpaMin(0)}>
                  Réinitialiser
                </Button>
              </div>
            </div>
          )}

          <DataTable<StudentRow>
            columns={columns}
            data={rows}
            pageSize={PAGE_SIZE}
            onRowClick={(row) => router.push(`/students/${row.id}`)}
            // "À risque" is filtered client-side from a single server page, so
            // server pagination totals would lie. Fall back to client pagination
            // (one page → prev/next inert) and label the honest filtered count.
            serverPagination={
              segment === 'risk'
                ? undefined
                : { pageIndex, pageCount, total, onPageChange: setPageIndex }
            }
            totalLabel={
              segment === 'risk'
                ? () =>
                    `Affichage de la page actuelle · ${rows.length} étudiant${
                      rows.length !== 1 ? 's' : ''
                    } à risque`
                : (_shown, t) => `${t} étudiants`
            }
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
