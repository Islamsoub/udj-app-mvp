'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Search, Upload } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { Avatar } from '@/components/shared/avatar';
import { GradeCell } from '@/components/shared/grade-cell';
import { LockedValue } from '@/components/shared/locked-value';
import { LockReason } from '@/components/shared/lock-reason';
import { SectionLabel } from '@/components/shared/section-label';
import { GradeImportModal } from '@/components/modals/grade-import-modal';
import { GradeCorrectionModal } from '@/components/modals/grade-correction-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TextInput } from '@/components/ui/input';
import { Table, THead, Th, Td } from '@/components/ui/table';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/use-admin';
import { useSemesters, useSubjects } from '@/hooks/queries/use-academics';
import { useBulkGrades, useGrades } from '@/hooks/queries/use-grades';
import { useStudents } from '@/hooks/queries/use-students';
import { useSettings } from '@/hooks/queries/use-settings';
import { computeSubjectStage } from '@/hooks/use-subject-stages';
import { NF, fmt, gradeInputInvalid, gradeTone, mention } from '@/lib/grade-helpers';
import { apiErrorMessage, cn } from '@/lib/utils';
import type { GradeRow } from '@/lib/types';

interface DraftCell {
  cc: string;
  cf: string;
}

/** Parse a cell value: empty or invalid → null. */
function parseNote(v: string): number | null {
  const t = v.trim();
  if (t === '' || gradeInputInvalid(t)) return null;
  return Number(t);
}

/**
 * Grade entry table (Pass C-2, change-set §30.3). Cells lock by subject stage:
 * CC published (stage ≥ 4) → CC cells read-only (sunken, lock glyph); NF
 * published (stage 7) → all cells read-only. Publication moved to the picker;
 * a locked cell opens the GradeCorrectionModal (SUPER_ADMIN / REGISTRAR).
 */
export default function GradeEntryPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { toast } = useToast();
  const { open } = useModal();
  const role = useAdminRole();
  const canCorrect = role === 'SUPER_ADMIN' || role === 'REGISTRAR';

  const { data: subjects } = useSubjects();
  const subject = subjects?.find((s) => s.id === subjectId);
  const { data: semesters } = useSemesters();
  const { data: studentsData } = useStudents({ programme: subject?.programmeId, pageSize: 200 });
  const { data: grades } = useGrades({ subject: subjectId });
  const { data: settings } = useSettings();
  const bulk = useBulkGrades();

  const semesterId = subject?.semesterId ?? '';
  const semesterLabel =
    subject?.semester?.label ?? semesters?.find((s) => s.id === semesterId)?.label ?? '';
  const wCc = settings?.gradeWeightCc ?? 0.4;
  const wCf = settings?.gradeWeightCf ?? 0.6;

  const roster = useMemo(() => studentsData?.data ?? [], [studentsData]);
  const byStudent = useMemo(
    () => new Map((grades ?? []).map((g) => [g.studentId, g] as const)),
    [grades]
  );

  // ── Lifecycle stage → lock rules ───────────────────────────────────────────
  const stage = useMemo(() => computeSubjectStage(grades ?? []), [grades]);
  const ccLocked = stage >= 4; // CC published
  const nfLocked = stage >= 7; // NF published
  const ccEditable = !ccLocked;
  const cfEditable = !nfLocked;

  // ── Draft state (strings per cell) + baseline for dirty/cancel ────────────
  const [draft, setDraft] = useState<Record<string, DraftCell>>({});
  const [baseline, setBaseline] = useState<Record<string, DraftCell>>({});

  useEffect(() => {
    if (!studentsData || !grades) return;
    const fill = (prev: Record<string, DraftCell>) => {
      let changed = false;
      const next = { ...prev };
      for (const st of studentsData.data) {
        if (next[st.id]) continue;
        const g = byStudent.get(st.id);
        next[st.id] = {
          cc: g?.noteCc != null ? String(g.noteCc) : '',
          cf: g?.noteCf != null ? String(g.noteCf) : '',
        };
        changed = true;
      }
      return changed ? next : prev;
    };
    setDraft(fill);
    setBaseline(fill);
  }, [studentsData, grades, byStudent]);

  const cell = (id: string): DraftCell => draft[id] ?? { cc: '', cf: '' };
  const base = (id: string): DraftCell => baseline[id] ?? { cc: '', cf: '' };
  const isDirty = (id: string, col: 'cc' | 'cf') => cell(id)[col] !== base(id)[col];

  const setCell = (id: string, col: 'cc' | 'cf', value: string) =>
    setDraft((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { cc: '', cf: '' }), [col]: value } }));

  // Effective CC/CF — draft when editable, otherwise the published stored value.
  const effectiveCc = (id: string): number | null =>
    ccEditable ? parseNote(cell(id).cc) : (byStudent.get(id)?.noteCc ?? null);
  const effectiveCf = (id: string): number | null =>
    cfEditable ? parseNote(cell(id).cf) : (byStudent.get(id)?.noteCf ?? null);

  // ── Derived metrics ────────────────────────────────────────────────────────
  const { dirtyCount, invalidCount, entered, classAvg } = useMemo(() => {
    let dirty = 0;
    let invalid = 0;
    let done = 0;
    let sum = 0;
    let n = 0;
    for (const st of roster) {
      const c = cell(st.id);
      if (ccEditable && isDirty(st.id, 'cc')) dirty += 1;
      if (cfEditable && isDirty(st.id, 'cf')) dirty += 1;
      if (ccEditable && gradeInputInvalid(c.cc)) invalid += 1;
      if (cfEditable && gradeInputInvalid(c.cf)) invalid += 1;
      const nf = NF(effectiveCc(st.id), effectiveCf(st.id), wCc, wCf);
      if (nf != null) {
        done += 1;
        sum += nf;
        n += 1;
      }
    }
    return { dirtyCount: dirty, invalidCount: invalid, entered: done, classAvg: n > 0 ? sum / n : null };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, draft, baseline, byStudent, ccEditable, cfEditable, wCc, wCf]);

  // ── Filter + keyboard navigation ───────────────────────────────────────────
  const [query, setQuery] = useState('');
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return roster;
    return roster.filter(
      (st) => st.name.toLowerCase().includes(q) || st.matricule.toLowerCase().includes(q)
    );
  }, [roster, query]);

  const cellRefs = useRef(new Map<string, HTMLInputElement>());
  const refFor = (key: string) => (el: HTMLInputElement | null) => {
    if (el) cellRefs.current.set(key, el);
    else cellRefs.current.delete(key);
  };
  const navigate = (row: number, col: 'cc' | 'cf', dir: 'up' | 'down' | 'left' | 'right') => {
    let r = row;
    let c = col;
    if (dir === 'down') r = Math.min(filtered.length - 1, row + 1);
    else if (dir === 'up') r = Math.max(0, row - 1);
    else if (dir === 'right') c = 'cf';
    else c = 'cc';
    cellRefs.current.get(`${r}-${c}`)?.focus();
  };

  // ── Correction modal for a locked cell ─────────────────────────────────────
  const openCorrection = (studentId: string, field: 'cc' | 'cf') => {
    const g = byStudent.get(studentId);
    if (!g || !canCorrect) return;
    const st = roster.find((s) => s.id === studentId);
    open(
      <GradeCorrectionModal
        gradeId={g.id}
        field={field}
        currentValue={field === 'cc' ? g.noteCc : g.noteCf}
        studentName={st?.name}
        subjectLabel={subject ? subject.code : undefined}
      />
    );
  };

  // ── Save (editable cells only; locked fields keep their stored value) ──────
  const onSave = async () => {
    const dirtyRows = roster.filter(
      (st) => (ccEditable && isDirty(st.id, 'cc')) || (cfEditable && isDirty(st.id, 'cf'))
    );
    try {
      const res = await bulk.mutateAsync({
        subjectId,
        semesterId,
        rows: dirtyRows.map((st) => ({
          studentId: st.id,
          noteCc: ccEditable ? parseNote(cell(st.id).cc) : (byStudent.get(st.id)?.noteCc ?? null),
          noteCf: cfEditable ? parseNote(cell(st.id).cf) : (byStudent.get(st.id)?.noteCf ?? null),
        })),
      });
      toast(`${res.saved} notes enregistrées`, 'check');
      setBaseline(draft);
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const loading = !subject || !studentsData || !grades;

  return (
    <div className={cn(dirtyCount > 0 && 'pb-[76px]')}>
      <PageHead
        back="/grades"
        title={subject?.nameFr ?? 'Saisie des notes'}
        sub={
          subject
            ? `${subject.code}${
                subject.professorName ? ` · Prof. ${subject.professorName}` : ''
              } · Coef. ${subject.coefficient} · ${semesterLabel}`
            : undefined
        }
        actions={
          ccLocked ? undefined : (
            <Button
              kind="ghost"
              icon={<Upload size={17} />}
              disabled={loading}
              onClick={() =>
                open(
                  <GradeImportModal
                    subjectId={subjectId}
                    semesterId={semesterId}
                    students={roster.map((r) => ({ id: r.id, name: r.name, matricule: r.matricule }))}
                  />
                )
              }
            >
              Importer
            </Button>
          )
        }
      />

      {/* Publication status line (§30.3) */}
      {(ccLocked || nfLocked) && (
        <div className="mb-5 -mt-2">
          <LockReason
            tone={nfLocked ? 'jade' : 'amber'}
            text={
              nfLocked
                ? 'Résultats publiés · toutes les notes sont verrouillées. Une correction passe par le journal d’audit.'
                : 'Notes CC publiées · la saisie du contrôle final reste ouverte.'
            }
          />
        </div>
      )}

      {loading ? (
        <>
          <div className="mb-5 grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[86px] animate-pulse rounded-[16px] bg-sunken" />
            ))}
          </div>
          <div className="h-[420px] animate-pulse rounded-[16px] bg-sunken" />
        </>
      ) : (
        <>
          {/* Metric strip */}
          <div className="mb-5 grid grid-cols-4 gap-4">
            <Card pad={14}>
              <SectionLabel>Étudiants</SectionLabel>
              <div className="mt-1 text-[22px] font-extrabold text-ink">{roster.length}</div>
            </Card>
            <Card pad={14}>
              <SectionLabel>Notes saisies</SectionLabel>
              <div
                className={cn(
                  'mt-1 text-[22px] font-extrabold',
                  roster.length > 0 && entered === roster.length ? 'text-jade-text' : 'text-amber'
                )}
              >
                {entered}/{roster.length}
              </div>
            </Card>
            <Card pad={14}>
              <SectionLabel>Moyenne classe</SectionLabel>
              <div className="mt-1 text-[22px] font-extrabold text-ink">{fmt(classAvg)}</div>
            </Card>
            <Card pad={14}>
              <SectionLabel>Modifications</SectionLabel>
              <div
                className={cn(
                  'mt-1 text-[22px] font-extrabold',
                  dirtyCount > 0 ? 'text-jade-text' : 'text-ink'
                )}
              >
                {dirtyCount}
              </div>
            </Card>
          </div>

          {/* Editable table */}
          <Card pad={0} className="overflow-hidden">
            <div className="flex items-center justify-between gap-3 border-b border-hair p-3">
              <div className="w-[280px]">
                <TextInput
                  icon={<Search size={15} />}
                  placeholder="Filtrer les étudiants…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="font-mono text-[11px] text-ink3">
                {nfLocked
                  ? 'Notes verrouillées'
                  : ccLocked
                    ? 'CC verrouillé · saisie CF ouverte'
                    : 'Entrée ou ↓ ligne suivante · → vers CF'}
              </div>
            </div>
            <Table>
              <THead>
                <tr>
                  <Th className="w-10">#</Th>
                  <Th>Étudiant</Th>
                  <Th>CC /20</Th>
                  <Th>CF /20</Th>
                  <Th>NF</Th>
                  <Th>Mention</Th>
                </tr>
              </THead>
              <tbody>
                {filtered.map((st, idx) => {
                  const g = byStudent.get(st.id);
                  const rowDirty =
                    (ccEditable && isDirty(st.id, 'cc')) || (cfEditable && isDirty(st.id, 'cf'));
                  const nf = NF(effectiveCc(st.id), effectiveCf(st.id), wCc, wCf);
                  return (
                    <tr
                      key={st.id}
                      className="transition-colors hover:bg-surface2"
                      style={rowDirty ? { background: 'rgba(29,158,117,0.03)' } : undefined}
                    >
                      <Td className="font-mono text-[11px] text-ink3">{idx + 1}</Td>
                      <Td>
                        <div className="flex items-center gap-[10px]">
                          <Avatar name={st.name} size={30} />
                          <div className="min-w-0">
                            <div className="truncate text-[13.5px] font-semibold text-ink">
                              {st.name}
                            </div>
                            <div className="font-mono text-[11px] text-ink3">{st.matricule}</div>
                          </div>
                        </div>
                      </Td>
                      <Td>
                        {ccEditable ? (
                          <GradeCell
                            ref={refFor(`${idx}-cc`)}
                            value={cell(st.id).cc}
                            dirty={isDirty(st.id, 'cc')}
                            onChange={(v) => setCell(st.id, 'cc', v)}
                            onNavigate={(dir) => navigate(idx, 'cc', dir)}
                            aria-label={`Note CC de ${st.name}`}
                          />
                        ) : (
                          <LockedValue
                            tooltip={
                              canCorrect && g ? 'Notes publiées — cliquer pour modifier' : undefined
                            }
                            onClickOverride={
                              canCorrect && g ? () => openCorrection(st.id, 'cc') : undefined
                            }
                            className="h-[38px] w-16 px-0 font-mono text-[14px]"
                          >
                            {g?.noteCc != null ? fmt(g.noteCc) : '—'}
                          </LockedValue>
                        )}
                      </Td>
                      <Td>
                        {cfEditable ? (
                          <GradeCell
                            ref={refFor(`${idx}-cf`)}
                            value={cell(st.id).cf}
                            dirty={isDirty(st.id, 'cf')}
                            onChange={(v) => setCell(st.id, 'cf', v)}
                            onNavigate={(dir) => navigate(idx, 'cf', dir)}
                            aria-label={`Note CF de ${st.name}`}
                          />
                        ) : (
                          <LockedValue
                            tooltip={
                              canCorrect && g ? 'Notes publiées — cliquer pour modifier' : undefined
                            }
                            onClickOverride={
                              canCorrect && g ? () => openCorrection(st.id, 'cf') : undefined
                            }
                            className="h-[38px] w-16 px-0 font-mono text-[14px]"
                          >
                            {g?.noteCf != null ? fmt(g.noteCf) : '—'}
                          </LockedValue>
                        )}
                      </Td>
                      <Td>
                        <span
                          className={cn(
                            'font-mono text-[14px] font-bold',
                            nf != null && nf < 10 ? 'text-danger' : 'text-ink'
                          )}
                        >
                          {nf != null ? fmt(nf) : '—'}
                        </span>
                      </Td>
                      <Td>
                        {nf != null ? (
                          <Badge tone={gradeTone(nf)}>{mention(nf)}</Badge>
                        ) : (
                          <Badge tone="slate">En attente</Badge>
                        )}
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </Table>
          </Card>
        </>
      )}

      {/* Sticky save bar */}
      {dirtyCount > 0 && (
        <div
          className="fixed bottom-0 right-0 z-50 flex items-center gap-3 border-t border-hair bg-surface px-8 py-3"
          style={{ left: 248, boxShadow: '0 -6px 22px rgba(10,30,22,0.08)' }}
        >
          <span className={cn('h-2 w-2 rounded-full', invalidCount > 0 ? 'bg-danger' : 'bg-jade')} />
          <span
            className={cn(
              'flex-1 text-[13px] font-semibold',
              invalidCount > 0 ? 'text-danger' : 'text-ink2'
            )}
          >
            {invalidCount > 0
              ? `${invalidCount} notes hors barème (0–20)`
              : `${dirtyCount} modifications non enregistrées`}
          </span>
          <Button kind="quiet" onClick={() => setDraft(baseline)}>
            Annuler
          </Button>
          <Button disabled={invalidCount > 0 || bulk.isPending} onClick={onSave}>
            Tout enregistrer
          </Button>
        </div>
      )}
    </div>
  );
}
