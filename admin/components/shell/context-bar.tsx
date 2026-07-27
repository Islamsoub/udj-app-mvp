'use client';

import { useEffect, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { BookOpen, GraduationCap, Lock, Shield, X } from 'lucide-react';
import { Dropdown } from '@/components/ui/select';
import { useAdmin } from '@/hooks/use-admin';
import { useFaculties, useProgrammes } from '@/hooks/queries/use-academics';
import { useSchedule } from '@/hooks/queries/use-schedule';
import { useScopeStore } from '@/stores/scope-store';
import { fmtNumber } from '@/lib/utils';

/**
 * Context Bar (Pass C-2, change-set §30.1 / AD §1) — a compact (~46px) sticky
 * strip below the TopBar carrying the Faculté → Programme scope across pages.
 *
 *  • Default   — muted "Toutes les facultés · Tous les programmes", white bg.
 *  • Active    — jade-tinted gradient + jade hairline + "Vue filtrée · N
 *                étudiants" + a Réinitialiser chip.
 *  • FACULTY_ADMIN — faculty locked (shield + lock, not clickable).
 *  • NEWS_EDITOR   — bar hidden entirely.
 *  • Schedule par-salle / par-enseignant — the faculty/programme pair is
 *    swapped for a single room / enseignant dropdown (§30.7).
 */

/** Pages that carry the scope (change-set §30.1). */
export const SCOPED_PATHS = [
  '/students',
  '/grades',
  '/attendance',
  '/schedule',
  '/academics',
  '/notifications',
] as const;

export function isScopedPath(pathname: string): boolean {
  return SCOPED_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

const BAR_BASE =
  'sticky top-16 z-30 flex h-[46px] items-center gap-3 border-b px-8 transition-colors';

// Compact override for the Dropdown trigger so the ~40px control fits the 46px
// strip (~32px → 7px breathing room). Dropdown's `className` prop lands on its
// root wrapper, not the button, so target the trigger via a direct-child
// variant (`root > trigger button`) — the popover option buttons sit one level
// deeper and are left untouched.
const COMPACT_DD = '[&>div>button]:py-[6px] [&>div>button]:text-[13px]';
// Same compaction plus left room for a 14px leading icon overlaid on the trigger.
const ICON_DD = `${COMPACT_DD} [&>div>button]:pl-[34px]`;
const DD_ICON =
  'pointer-events-none absolute left-[11px] top-1/2 z-10 -translate-y-1/2 text-ink3';

function barStyle(active: boolean): React.CSSProperties {
  return active
    ? {
        background: 'linear-gradient(90deg, var(--jade-faint) 0%, rgba(29,158,117,0.035) 60%)',
        borderColor: 'var(--jade)',
      }
    : { background: 'var(--surface)', borderColor: 'var(--hair)' };
}

function CtxLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="shrink-0 font-mono text-[10px] uppercase tracking-[0.08em] text-ink3">
      {children}
    </span>
  );
}

function ResetChip({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex shrink-0 cursor-pointer items-center gap-[6px] rounded-full border-0 bg-jade-faint px-[11px] py-[5px] text-[12px] font-semibold text-jade-text transition-colors hover:bg-jade-faint2"
    >
      <X size={13} />
      Réinitialiser
    </button>
  );
}

// ─── Faculté → Programme variant ─────────────────────────────────────────────

function FacultyProgrammeBar() {
  const admin = useAdmin();
  const facultyId = useScopeStore((s) => s.facultyId);
  const programmeId = useScopeStore((s) => s.programmeId);
  const setFaculty = useScopeStore((s) => s.setFaculty);
  const setProgramme = useScopeStore((s) => s.setProgramme);
  const reset = useScopeStore((s) => s.reset);

  const { data: faculties } = useFaculties();
  const { data: programmes } = useProgrammes();

  const locked = admin?.role === 'FACULTY_ADMIN';

  // Lock a FACULTY_ADMIN to their own faculty on mount / role resolution.
  useEffect(() => {
    if (locked && admin?.facultyId && facultyId !== admin.facultyId) {
      setFaculty(admin.facultyId);
    }
  }, [locked, admin?.facultyId, facultyId, setFaculty]);

  const facultyOptions = useMemo(
    () => (faculties ?? []).map((f) => ({ value: f.id, label: f.nameFr })),
    [faculties]
  );

  const programmeOptions = useMemo(
    () =>
      (programmes ?? [])
        .filter((p) => !facultyId || p.facultyId === facultyId)
        .map((p) => ({ value: p.id, label: p.nameFr })),
    [programmes, facultyId]
  );

  const lockedFacultyName =
    (faculties ?? []).find((f) => f.id === admin?.facultyId)?.nameFr ?? 'Ma faculté';

  const studentCount = useMemo(() => {
    const list = programmes ?? [];
    if (programmeId) return list.find((p) => p.id === programmeId)?._count?.students ?? null;
    if (facultyId)
      return list
        .filter((p) => p.facultyId === facultyId)
        .reduce((sum, p) => sum + (p._count?.students ?? 0), 0);
    return null;
  }, [programmes, facultyId, programmeId]);

  // Unscoped total across all programmes — so the default view still shows scale.
  const totalStudents = useMemo(
    () => (programmes ?? []).reduce((sum, p) => sum + (p._count?.students ?? 0), 0),
    [programmes]
  );

  const active = !!facultyId || !!programmeId;

  return (
    <div className={BAR_BASE} style={barStyle(active)}>
      <div className="flex items-center gap-[8px]">
        <CtxLabel>Faculté</CtxLabel>
        {locked ? (
          <span className="flex items-center gap-[7px] rounded-[10px] border border-hair2 bg-surface2 px-[12px] py-[6px] text-[13px] font-semibold text-ink2">
            <Shield size={14} className="text-blue" />
            <span className="max-w-[160px] truncate">{lockedFacultyName}</span>
            <Lock size={12} className="text-ink3" />
          </span>
        ) : (
          <div className={`relative w-[210px] ${ICON_DD}`}>
            <BookOpen size={14} className={DD_ICON} />
            <Dropdown
              value={facultyId}
              onChange={(v) => setFaculty(v)}
              options={facultyOptions}
              placeholder="Toutes les facultés"
            />
          </div>
        )}
      </div>

      <span className="text-ink3">·</span>

      <div className="flex items-center gap-[8px]">
        <CtxLabel>Programme</CtxLabel>
        <div className={`relative w-[230px] ${ICON_DD}`}>
          <GraduationCap size={14} className={DD_ICON} />
          <Dropdown
            value={programmeId}
            onChange={(v) => setProgramme(v)}
            options={programmeOptions}
            placeholder="Tous les programmes"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {active ? (
          <>
            <span className="text-[12.5px] font-semibold text-jade-text">
              Vue filtrée
              {studentCount != null ? ` · ${fmtNumber(studentCount)} étudiants` : ''}
            </span>
            <ResetChip onClick={reset} />
          </>
        ) : (
          <span className="text-[12.5px] text-ink3">
            {programmes ? `${fmtNumber(totalStudents)} étudiants` : 'Tous les étudiants'}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Par salle / Par enseignant variant (schedule only) ──────────────────────

function RoomTeacherBar({ mode }: { mode: 'room' | 'teacher' }) {
  const room = useScopeStore((s) => s.room);
  const professorName = useScopeStore((s) => s.professorName);
  const setRoom = useScopeStore((s) => s.setRoom);
  const setProfessor = useScopeStore((s) => s.setProfessor);
  const reset = useScopeStore((s) => s.reset);

  // All entries in the admin's faculty scope, for the distinct room / teacher lists.
  const { data: entries } = useSchedule({});

  const options = useMemo(() => {
    const set = new Set<string>();
    for (const e of entries ?? []) set.add(mode === 'room' ? e.room : e.professorName);
    return Array.from(set)
      .sort((a, b) => a.localeCompare(b, 'fr'))
      .map((v) => ({ value: v, label: v }));
  }, [entries, mode]);

  const value = mode === 'room' ? room : professorName;
  const active = !!value;

  return (
    <div className={BAR_BASE} style={barStyle(active)}>
      <div className="flex items-center gap-[8px]">
        <CtxLabel>{mode === 'room' ? 'Salle' : 'Enseignant'}</CtxLabel>
        <div className={`w-[260px] ${COMPACT_DD}`}>
          <Dropdown
            value={value}
            onChange={(v) => (mode === 'room' ? setRoom(v) : setProfessor(v))}
            options={options}
            placeholder={mode === 'room' ? 'Choisir une salle' : 'Choisir un enseignant'}
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {active ? (
          <>
            <span className="text-[12.5px] font-semibold text-jade-text">
              {mode === 'room' ? 'Salle' : 'Enseignant'} · lecture seule
            </span>
            <ResetChip onClick={reset} />
          </>
        ) : (
          <span className="text-[12.5px] text-ink3">
            Toutes les {mode === 'room' ? 'salles' : 'séances'} · lecture seule
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Entry point ─────────────────────────────────────────────────────────────

export function ContextBar() {
  const pathname = usePathname();
  const admin = useAdmin();
  const scheduleMode = useScopeStore((s) => s.scheduleMode);

  // Guarded here too (belt-and-braces with the layout check).
  if (!isScopedPath(pathname)) return null;
  if (admin?.role === 'NEWS_EDITOR') return null;

  const onSchedule = pathname === '/schedule' || pathname.startsWith('/schedule/');
  if (onSchedule && (scheduleMode === 'room' || scheduleMode === 'teacher')) {
    return <RoomTeacherBar mode={scheduleMode} />;
  }
  return <FacultyProgrammeBar />;
}
