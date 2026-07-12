'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';
import {
  Award,
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Lock,
  Mail,
  Pencil,
  Phone,
  RotateCcw,
  UserX,
} from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { GradeCell } from '@/components/shared/grade-cell';
import { StudentForm } from '@/components/forms/student-form';
import { ResetPwModal } from '@/components/modals/reset-pw-modal';
import { StatusModal, type StatusAction } from '@/components/modals/status-modal';
import { GradeCorrectionModal } from '@/components/modals/grade-correction-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Menu } from '@/components/ui/dropdown-menu';
import { Tabs } from '@/components/ui/tabs';
import { Tooltip } from '@/components/ui/tooltip';
import { Table, THead, Th, Td, TRow } from '@/components/ui/table';
import { useModal } from '@/hooks/use-modal';
import { useAdminRole } from '@/hooks/use-admin';
import { useStudent } from '@/hooks/queries/use-students';
import { useUpdateGrade } from '@/hooks/queries/use-grades';
import { useSettings } from '@/hooks/queries/use-settings';
import { useToast } from '@/hooks/use-toast';
import {
  NF,
  fmt,
  gradeInputInvalid,
  gradeTone,
  listGradeTone,
  mention,
  presenceTone,
  weightedGpa,
} from '@/lib/grade-helpers';
import { STATUS_META } from '@/lib/constants';
import { TONE_COLORS, type Tone } from '@/lib/tokens';
import { apiErrorMessage } from '@/lib/utils';
import type { ProgrammeLevel, StudentGrade } from '@/lib/types';

/**
 * Student detail (impl spec §13; Pass C-2 change-set §30.4): profile card +
 * transcript with inline CC/CF editing (same GradeCell + lock rules as the
 * entry table, corrections via GradeCorrectionModal, compact save bar) +
 * per-subject attendance bars.
 */
const GRADE_TEXT: Record<'danger' | 'amber' | 'ink', string> = {
  danger: 'text-danger',
  amber: 'text-amber',
  ink: 'text-ink',
};

const TONE_TEXT: Record<Tone, string> = {
  jade: 'text-jade-text',
  danger: 'text-danger',
  amber: 'text-amber',
  blue: 'text-blue',
  exam: 'text-exam',
  slate: 'text-ink',
};

/** French academic-year prefix per degree level (Licence → L, Master → M…). */
const LEVEL_PREFIX: Record<ProgrammeLevel, string> = {
  DUT: 'DUT',
  LICENCE: 'L',
  MASTER: 'M',
  DOCTORAT: 'D',
};

/** e.g. LICENCE + semester 3 → "L2". */
function levelTag(level: ProgrammeLevel, currentSemester: number): string {
  return `${LEVEL_PREFIX[level]}${Math.max(1, Math.ceil(currentSemester / 2))}`;
}

/** Group a raw phone string into 2-digit pairs for display; falls back as-is. */
function fmtPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.length < 6) return raw;
  return digits.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

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

function DetailSkeleton() {
  return (
    <div className="grid grid-cols-[320px_1fr] gap-5">
      <div className="h-[420px] animate-pulse rounded-[16px] bg-sunken" />
      <div className="flex flex-col gap-5">
        <div className="h-[300px] animate-pulse rounded-[16px] bg-sunken" />
        <div className="h-[220px] animate-pulse rounded-[16px] bg-sunken" />
      </div>
    </div>
  );
}

export default function StudentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { open } = useModal();
  const { toast } = useToast();
  const role = useAdminRole();
  const canWrite = role === 'SUPER_ADMIN' || role === 'REGISTRAR';

  const { data: student, isLoading, isError } = useStudent(id);
  const { data: settings } = useSettings();
  const updateGrade = useUpdateGrade();
  const [activeSemester, setActiveSemester] = useState<string | null>(null);

  const wCc = settings?.gradeWeightCc ?? 0.4;
  const wCf = settings?.gradeWeightCf ?? 0.6;

  // ── Inline transcript editing (change-set §30.4) ───────────────────────────
  const [draft, setDraft] = useState<Record<string, DraftCell>>({});
  const [baseline, setBaseline] = useState<Record<string, DraftCell>>({});

  useEffect(() => {
    if (!student) return;
    const fill = (prev: Record<string, DraftCell>) => {
      let changed = false;
      const next = { ...prev };
      for (const g of student.grades) {
        if (next[g.id]) continue;
        next[g.id] = {
          cc: g.noteCc != null ? String(g.noteCc) : '',
          cf: g.noteCf != null ? String(g.noteCf) : '',
        };
        changed = true;
      }
      return changed ? next : prev;
    };
    setDraft(fill);
    setBaseline(fill);
  }, [student]);

  const cellOf = (gid: string): DraftCell => draft[gid] ?? { cc: '', cf: '' };
  const baseOf = (gid: string): DraftCell => baseline[gid] ?? { cc: '', cf: '' };
  const isDirty = (gid: string, col: 'cc' | 'cf') => cellOf(gid)[col] !== baseOf(gid)[col];
  const setCell = (gid: string, col: 'cc' | 'cf', value: string) =>
    setDraft((prev) => ({ ...prev, [gid]: { ...(prev[gid] ?? { cc: '', cf: '' }), [col]: value } }));

  // Lock rules per grade: CC published → CC locked; NF published → both locked.
  const ccEditable = (g: StudentGrade) => canWrite && g.publishedCcAt == null;
  const cfEditable = (g: StudentGrade) => canWrite && g.publishedNfAt == null;
  const effCc = (g: StudentGrade): number | null =>
    ccEditable(g) ? parseNote(cellOf(g.id).cc) : g.noteCc;
  const effCf = (g: StudentGrade): number | null =>
    cfEditable(g) ? parseNote(cellOf(g.id).cf) : g.noteCf;
  const nfOf = (g: StudentGrade): number | null => NF(effCc(g), effCf(g), wCc, wCf);

  const { dirtyCount, invalidCount } = useMemo(() => {
    let dirty = 0;
    let invalid = 0;
    for (const g of student?.grades ?? []) {
      if (ccEditable(g) && isDirty(g.id, 'cc')) dirty += 1;
      if (cfEditable(g) && isDirty(g.id, 'cf')) dirty += 1;
      if (ccEditable(g) && gradeInputInvalid(cellOf(g.id).cc)) invalid += 1;
      if (cfEditable(g) && gradeInputInvalid(cellOf(g.id).cf)) invalid += 1;
    }
    return { dirtyCount: dirty, invalidCount: invalid };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student, draft, baseline, canWrite]);

  const semesterLabels = useMemo(() => {
    const labels: string[] = [];
    for (const g of student?.grades ?? []) {
      if (!labels.includes(g.semester.label)) labels.push(g.semester.label);
    }
    return labels;
  }, [student]);

  const semester = activeSemester ?? semesterLabels[0] ?? null;
  const visibleGrades = useMemo(
    () => (student?.grades ?? []).filter((g) => g.semester.label === semester),
    [student, semester]
  );
  const semesterMean = weightedGpa(
    visibleGrades.map((g) => ({ noteFinale: nfOf(g), coefficient: g.subject.coefficient }))
  );

  const cellRefs = useRef(new Map<string, HTMLInputElement>());
  const refFor = (key: string) => (el: HTMLInputElement | null) => {
    if (el) cellRefs.current.set(key, el);
    else cellRefs.current.delete(key);
  };
  const navigate = (row: number, col: 'cc' | 'cf', dir: 'up' | 'down' | 'left' | 'right') => {
    let r = row;
    let c = col;
    if (dir === 'down') r = Math.min(visibleGrades.length - 1, row + 1);
    else if (dir === 'up') r = Math.max(0, row - 1);
    else if (dir === 'right') c = 'cf';
    else c = 'cc';
    cellRefs.current.get(`${r}-${c}`)?.focus();
  };

  const openCorrection = (g: StudentGrade, field: 'cc' | 'cf') => {
    if (!canWrite) return;
    open(
      <GradeCorrectionModal
        gradeId={g.id}
        field={field}
        currentValue={field === 'cc' ? g.noteCc : g.noteCf}
        studentName={student?.name}
        subjectLabel={g.subject.code}
      />
    );
  };

  const onSave = async () => {
    const rows = (student?.grades ?? []).filter(
      (g) => (ccEditable(g) && isDirty(g.id, 'cc')) || (cfEditable(g) && isDirty(g.id, 'cf'))
    );
    try {
      await Promise.all(
        rows.map((g) =>
          updateGrade.mutateAsync({
            id: g.id,
            ...(ccEditable(g) ? { noteCc: parseNote(cellOf(g.id).cc) } : {}),
            ...(cfEditable(g) ? { noteCf: parseNote(cellOf(g.id).cf) } : {}),
          })
        )
      );
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast(`${rows.length} note${rows.length > 1 ? 's' : ''} enregistrée${rows.length > 1 ? 's' : ''}`, 'check');
      setBaseline(draft);
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const attendanceBySubject = useMemo(() => {
    const map = new Map<string, { name: string; total: number; present: number }>();
    for (const rec of student?.attendance ?? []) {
      const entry = map.get(rec.subjectId) ?? { name: rec.subject.nameFr, total: 0, present: 0 };
      entry.total += 1;
      if (rec.status === 'PRESENT' || rec.status === 'JUSTIFIED') entry.present += 1;
      else if (rec.status === 'PARTIAL' && rec.hoursAttended != null) entry.present += 0.5;
      map.set(rec.subjectId, entry);
    }
    return Array.from(map.values()).map((e) => ({
      name: e.name,
      pct: e.total === 0 ? 0 : Math.round((e.present / e.total) * 100),
    }));
  }, [student]);

  if (isLoading) {
    return (
      <>
        <PageHead back="/students" title="Fiche étudiant" />
        <DetailSkeleton />
      </>
    );
  }

  if (isError || !student) {
    return (
      <>
        <PageHead back="/students" title="Fiche étudiant" />
        <Card>
          <EmptyState icon={<UserX size={20} />} message="Étudiant introuvable." />
        </Card>
      </>
    );
  }

  const statusMeta = STATUS_META[student.status];
  const openStatus = (action: StatusAction) =>
    open(
      <StatusModal
        student={{ id: student.id, name: student.name, matricule: student.matricule }}
        action={action}
      />
    );

  const renderGradeCell = (g: StudentGrade, col: 'cc' | 'cf', idx: number) => {
    const editable = col === 'cc' ? ccEditable(g) : cfEditable(g);
    const stored = col === 'cc' ? g.noteCc : g.noteCf;
    const locked = col === 'cc' ? g.publishedCcAt != null : g.publishedNfAt != null;

    if (editable) {
      return (
        <GradeCell
          ref={refFor(`${idx}-${col}`)}
          value={cellOf(g.id)[col]}
          dirty={isDirty(g.id, col)}
          onChange={(v) => setCell(g.id, col, v)}
          onNavigate={(dir) => navigate(idx, col, dir)}
          aria-label={`Note ${col.toUpperCase()} — ${g.subject.nameFr}`}
        />
      );
    }
    if (locked && canWrite) {
      return (
        <Tooltip label="Notes publiées — cliquer pour modifier">
          <button
            type="button"
            onClick={() => openCorrection(g, col)}
            className="flex h-[38px] w-16 cursor-pointer items-center justify-center gap-[5px] rounded-[9px] border border-transparent bg-sunken font-mono text-[14px] text-ink2 hover:bg-hair2"
          >
            {fmt(stored)}
            <Lock size={11} strokeWidth={2} className="text-ink3" />
          </button>
        </Tooltip>
      );
    }
    // Read-only (no write permission) — plain value.
    return <span className="font-mono text-[12.5px] text-ink2">{fmt(stored)}</span>;
  };

  return (
    <>
      <PageHead
        back="/students"
        title={student.name}
        sub={<span className="font-mono text-[13px]">{student.matricule}</span>}
        actions={
          <>
            <Button
              kind="ghost"
              icon={<RotateCcw size={17} />}
              onClick={() =>
                open(
                  <ResetPwModal
                    student={{ id: student.id, name: student.name, matricule: student.matricule }}
                  />
                )
              }
            >
              Réinitialiser mot de passe
            </Button>
            <Button
              kind="ghost"
              icon={<Pencil size={17} />}
              onClick={() => open(<StudentForm student={student} />)}
            >
              Modifier
            </Button>
            <Menu
              items={[
                {
                  icon: <AlertTriangle size={15} />,
                  label: 'Suspendre',
                  onClick: () => openStatus('suspend'),
                },
                {
                  icon: <GraduationCap size={15} />,
                  label: 'Marquer diplômé',
                  onClick: () => openStatus('graduate'),
                },
                { divider: true },
                {
                  icon: <RotateCcw size={15} />,
                  label: 'Réactiver',
                  onClick: () => openStatus('reactivate'),
                },
              ]}
            />
          </>
        }
      />

      <div className="grid grid-cols-[320px_1fr] gap-5">
        {/* ── Left: profile card ── */}
        <Card className="self-start">
          <div className="flex flex-col items-center text-center">
            <Avatar name={student.name} size={76} ring />
            <div className="mt-3 text-[19px] font-extrabold text-ink">{student.name}</div>
            <div className="mt-[2px] text-[13px] text-ink2">
              {student.programme.nameFr} ·{' '}
              {levelTag(student.programme.level, student.currentSemester)}
            </div>
            <div className="mt-2">
              <Badge tone={statusMeta.tone} dot>
                {statusMeta.label}
              </Badge>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="rounded-[12px] bg-surface2 p-3 text-center">
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink3">
                Moyenne
              </div>
              <div className="mt-1 flex items-baseline justify-center gap-[2px]">
                <span
                  className={`text-[20px] font-extrabold ${GRADE_TEXT[listGradeTone(student.gpa)]}`}
                >
                  {fmt(student.gpa)}
                </span>
                <span className="text-[11.5px] text-ink3">/20</span>
              </div>
            </div>
            <div className="rounded-[12px] bg-surface2 p-3 text-center">
              <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-ink3">
                Présence
              </div>
              <div
                className={`mt-1 text-[20px] font-extrabold ${TONE_TEXT[presenceTone(student.presence)]}`}
              >
                {student.presence != null ? `${student.presence}%` : '—'}
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-[10px] border-t border-hair pt-3">
            <div className="flex items-center gap-2 text-[13px] text-ink2">
              <Mail size={14} className="shrink-0 text-ink3" />
              <span className="truncate">{student.email}</span>
            </div>
            {student.phone && (
              <div className="flex items-center gap-2 text-[13px] text-ink2">
                <Phone size={14} className="shrink-0 text-ink3" />
                <span className="truncate font-mono">{fmtPhone(student.phone)}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-[13px] text-ink2">
              <BookOpen size={14} className="shrink-0 text-ink3" />
              <span className="truncate">{student.faculty.nameFr}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-ink2">
              <GraduationCap size={14} className="shrink-0 text-ink3" />
              <span>Semestre {student.currentSemester}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-ink2">
              <Award size={14} className="shrink-0 text-ink3" />
              <span>
                {student.creditsEarned != null
                  ? `${student.creditsEarned} crédits acquis`
                  : `${student.programme.totalCredits} crédits requis`}
              </span>
            </div>
          </div>
        </Card>

        {/* ── Right column ── */}
        <div className="flex min-w-0 flex-col gap-5">
          <Card pad={0}>
            <div className="flex items-center justify-between gap-3 p-4">
              <div className="text-[15.5px] font-bold text-ink">Relevé de notes</div>
              <div className="flex items-center gap-3">
                {semesterMean != null && (
                  <span
                    className={`font-mono text-[13.5px] font-bold ${GRADE_TEXT[listGradeTone(semesterMean)]}`}
                  >
                    {fmt(semesterMean)}/20
                  </span>
                )}
                {semesterLabels.length > 0 && semester && (
                  <Tabs
                    tabs={semesterLabels.map((l) => ({ key: l, label: l }))}
                    active={semester}
                    onChange={setActiveSemester}
                  />
                )}
              </div>
            </div>
            <Table>
              <THead>
                <tr>
                  <Th>Matière</Th>
                  <Th>CC</Th>
                  <Th>CF</Th>
                  <Th>Coef</Th>
                  <Th>NF</Th>
                  <Th>Mention</Th>
                </tr>
              </THead>
              <tbody>
                {visibleGrades.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <div className="px-6 py-8 text-center text-[13px] text-ink3">
                        Aucune note pour ce semestre.
                      </div>
                    </td>
                  </tr>
                ) : (
                  visibleGrades.map((g, idx) => {
                    const nf = nfOf(g);
                    return (
                      <TRow key={g.id}>
                        <Td>
                          <div className="text-[13.5px] font-semibold text-ink">
                            {g.subject.nameFr}
                          </div>
                          <div className="font-mono text-[11px] text-ink3">{g.subject.code}</div>
                        </Td>
                        <Td>{renderGradeCell(g, 'cc', idx)}</Td>
                        <Td>{renderGradeCell(g, 'cf', idx)}</Td>
                        <Td className="font-mono text-[12.5px] text-ink2">{g.subject.coefficient}</Td>
                        <Td
                          className={`font-mono text-[13px] font-bold ${
                            nf != null && nf < 10 ? 'text-danger' : 'text-ink'
                          }`}
                        >
                          {fmt(nf)}
                        </Td>
                        <Td>
                          {nf != null ? (
                            <Badge tone={gradeTone(nf)}>{mention(nf)}</Badge>
                          ) : (
                            <Badge tone="slate">En attente</Badge>
                          )}
                        </Td>
                      </TRow>
                    );
                  })
                )}
              </tbody>
            </Table>

            {/* Compact save bar (§30.4) — appears when any cell is dirty */}
            {dirtyCount > 0 && (
              <div className="flex items-center gap-3 border-t border-hair p-3">
                <span
                  className={`h-2 w-2 rounded-full ${invalidCount > 0 ? 'bg-danger' : 'bg-jade'}`}
                />
                <span
                  className={`flex-1 text-[13px] font-semibold ${
                    invalidCount > 0 ? 'text-danger' : 'text-ink2'
                  }`}
                >
                  {invalidCount > 0
                    ? `${invalidCount} note(s) hors barème (0–20)`
                    : `${dirtyCount} modification${dirtyCount > 1 ? 's' : ''}`}
                </span>
                <Button kind="quiet" onClick={() => setDraft(baseline)}>
                  Annuler
                </Button>
                <Button disabled={invalidCount > 0 || updateGrade.isPending} onClick={onSave}>
                  Enregistrer
                </Button>
              </div>
            )}
          </Card>

          <Card>
            <div className="text-[15.5px] font-bold text-ink">Assiduité par matière</div>
            <div className="mt-3 flex flex-col gap-[10px]">
              {attendanceBySubject.length === 0 && (
                <div className="py-4 text-center text-[13px] text-ink3">
                  Aucun relevé de présence.
                </div>
              )}
              {attendanceBySubject.map((row) => {
                const barColor = TONE_COLORS[presenceTone(row.pct)][0];
                return (
                  <div key={row.name} className="flex items-center gap-3">
                    <span className="min-w-0 flex-1 truncate text-[13.5px] text-ink">
                      {row.name}
                    </span>
                    <span className="h-[6px] w-[160px] shrink-0 overflow-hidden rounded-full bg-sunken">
                      <span
                        className="block h-full rounded-full"
                        style={{ width: `${row.pct}%`, background: barColor }}
                      />
                    </span>
                    <span className="w-10 shrink-0 text-right font-mono text-[12px] text-ink2">
                      {row.pct}%
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 border-t border-hair pt-3">
              <button
                type="button"
                onClick={() => router.push('/attendance')}
                className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-jade-text hover:underline"
              >
                Présence →
              </button>
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
