'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Search, Send, Upload } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { Avatar } from '@/components/shared/avatar';
import { GradeCell } from '@/components/shared/grade-cell';
import { SectionLabel } from '@/components/shared/section-label';
import { GradeImportModal } from '@/components/modals/grade-import-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { TextInput } from '@/components/ui/input';
import { Table, THead, Th, Td } from '@/components/ui/table';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useSemesters, useSubjects } from '@/hooks/queries/use-academics';
import { useBulkGrades, useGrades, usePublishGrades } from '@/hooks/queries/use-grades';
import { useStudents } from '@/hooks/queries/use-students';
import { useSettings } from '@/hooks/queries/use-settings';
import { NF, fmt, gradeInputInvalid, gradeTone, mention } from '@/lib/grade-helpers';
import { apiErrorMessage, cn } from '@/lib/utils';

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

/** Grade entry table (impl spec §16) — the centerpiece. */
export default function GradeEntryPage() {
  const { subjectId } = useParams<{ subjectId: string }>();
  const { toast } = useToast();
  const { open } = useModal();

  const { data: subjects } = useSubjects();
  const subject = subjects?.find((s) => s.id === subjectId);
  const { data: semesters } = useSemesters();
  const { data: studentsData } = useStudents({ programme: subject?.programmeId, pageSize: 200 });
  const { data: grades } = useGrades({ subject: subjectId });
  const { data: settings } = useSettings();
  const bulk = useBulkGrades();
  const publish = usePublishGrades();

  const semesterId = subject?.semesterId ?? '';
  const semesterLabel =
    subject?.semester?.label ?? semesters?.find((s) => s.id === semesterId)?.label ?? '';
  const wCc = settings?.gradeWeightCc ?? 0.4;
  const wCf = settings?.gradeWeightCf ?? 0.6;

  const roster = useMemo(() => studentsData?.data ?? [], [studentsData]);

  // ── Draft state (strings per cell) + baseline for dirty/cancel ────────────
  const [draft, setDraft] = useState<Record<string, DraftCell>>({});
  const [baseline, setBaseline] = useState<Record<string, DraftCell>>({});

  useEffect(() => {
    if (!studentsData || !grades) return;
    const byStudent = new Map(grades.map((g) => [g.studentId, g] as const));
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
  }, [studentsData, grades]);

  const cell = (id: string): DraftCell => draft[id] ?? { cc: '', cf: '' };
  const base = (id: string): DraftCell => baseline[id] ?? { cc: '', cf: '' };
  const isDirty = (id: string, col: 'cc' | 'cf') => cell(id)[col] !== base(id)[col];

  const setCell = (id: string, col: 'cc' | 'cf', value: string) =>
    setDraft((prev) => ({ ...prev, [id]: { ...(prev[id] ?? { cc: '', cf: '' }), [col]: value } }));

  // ── Derived metrics ────────────────────────────────────────────────────────
  const { dirtyCount, invalidCount, entered, classAvg } = useMemo(() => {
    let dirty = 0;
    let invalid = 0;
    let done = 0;
    let sum = 0;
    let n = 0;
    for (const st of roster) {
      const c = cell(st.id);
      if (isDirty(st.id, 'cc')) dirty += 1;
      if (isDirty(st.id, 'cf')) dirty += 1;
      if (gradeInputInvalid(c.cc)) invalid += 1;
      if (gradeInputInvalid(c.cf)) invalid += 1;
      const nf = NF(parseNote(c.cc), parseNote(c.cf), wCc, wCf);
      if (nf != null) {
        done += 1;
        sum += nf;
        n += 1;
      }
    }
    return {
      dirtyCount: dirty,
      invalidCount: invalid,
      entered: done,
      classAvg: n > 0 ? sum / n : null,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roster, draft, baseline, wCc, wCf]);

  const allEntered = roster.length > 0 && entered === roster.length;

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

  // ── Actions ────────────────────────────────────────────────────────────────
  const onSave = async () => {
    const dirtyRows = roster.filter((st) => isDirty(st.id, 'cc') || isDirty(st.id, 'cf'));
    try {
      const res = await bulk.mutateAsync({
        subjectId,
        semesterId,
        rows: dirtyRows.map((st) => ({
          studentId: st.id,
          noteCc: parseNote(cell(st.id).cc),
          noteCf: parseNote(cell(st.id).cf),
        })),
      });
      toast(`${res.saved} notes enregistrées`, 'check');
      setBaseline(draft);
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const onPublish = async () => {
    try {
      await publish.mutateAsync({ subjectId, semesterId });
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
          <>
            <Button
              kind="ghost"
              icon={<Upload size={17} />}
              disabled={loading}
              onClick={() =>
                open(
                  <GradeImportModal
                    subjectId={subjectId}
                    semesterId={semesterId}
                    students={roster.map((r) => ({
                      id: r.id,
                      name: r.name,
                      matricule: r.matricule,
                    }))}
                  />
                )
              }
            >
              Importer
            </Button>
            <Button
              kind="soft"
              icon={<Send size={17} />}
              disabled={!allEntered || publish.isPending}
              onClick={onPublish}
            >
              Publier les notes
            </Button>
          </>
        }
      />

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
                  allEntered ? 'text-jade-text' : 'text-amber'
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
                Entrée ou ↓ ligne suivante · → vers CF
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
                  const c = cell(st.id);
                  const rowDirty = isDirty(st.id, 'cc') || isDirty(st.id, 'cf');
                  const nf = NF(parseNote(c.cc), parseNote(c.cf), wCc, wCf);
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
                        <GradeCell
                          ref={refFor(`${idx}-cc`)}
                          value={c.cc}
                          dirty={isDirty(st.id, 'cc')}
                          onChange={(v) => setCell(st.id, 'cc', v)}
                          onNavigate={(dir) => navigate(idx, 'cc', dir)}
                          aria-label={`Note CC de ${st.name}`}
                        />
                      </Td>
                      <Td>
                        <GradeCell
                          ref={refFor(`${idx}-cf`)}
                          value={c.cf}
                          dirty={isDirty(st.id, 'cf')}
                          onChange={(v) => setCell(st.id, 'cf', v)}
                          onNavigate={(dir) => navigate(idx, 'cf', dir)}
                          aria-label={`Note CF de ${st.name}`}
                        />
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
          <span
            className={cn('h-2 w-2 rounded-full', invalidCount > 0 ? 'bg-danger' : 'bg-jade')}
          />
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
