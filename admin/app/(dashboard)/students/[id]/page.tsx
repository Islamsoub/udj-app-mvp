'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  AlertTriangle,
  BookOpen,
  GraduationCap,
  Mail,
  Pencil,
  RotateCcw,
  UserX,
} from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { Avatar } from '@/components/shared/avatar';
import { EmptyState } from '@/components/shared/empty-state';
import { StudentForm } from '@/components/forms/student-form';
import { ResetPwModal } from '@/components/modals/reset-pw-modal';
import { StatusModal, type StatusAction } from '@/components/modals/status-modal';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Menu } from '@/components/ui/dropdown-menu';
import { Tabs } from '@/components/ui/tabs';
import { Table, THead, Th, Td, TRow } from '@/components/ui/table';
import { useModal } from '@/hooks/use-modal';
import { useStudent } from '@/hooks/queries/use-students';
import { useSettings } from '@/hooks/queries/use-settings';
import { NF, fmt, gradeTone, listGradeTone, mention, presenceTone, weightedGpa } from '@/lib/grade-helpers';
import { STATUS_META } from '@/lib/constants';
import { TONE_COLORS, type Tone } from '@/lib/tokens';
import type { StudentGrade } from '@/lib/types';

/**
 * Student detail (impl spec §13): profile card (avatar, stat tiles, info
 * rows) + transcript with semester toggle + per-subject attendance bars.
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
  const { open } = useModal();
  const { data: student, isLoading, isError } = useStudent(id);
  const { data: settings } = useSettings();
  const [activeSemester, setActiveSemester] = useState<string | null>(null);

  const wCc = settings?.gradeWeightCc ?? 0.4;
  const wCf = settings?.gradeWeightCf ?? 0.6;

  /** Stored NF, or recomputed from CC/CF with the live weights. */
  const nfOf = (g: StudentGrade): number | null => g.noteFinale ?? NF(g.noteCc, g.noteCf, wCc, wCf);

  const semesterLabels = useMemo(() => {
    const labels: string[] = [];
    for (const g of student?.grades ?? []) {
      if (!labels.includes(g.semester.label)) labels.push(g.semester.label);
    }
    return labels;
  }, [student]);

  const semester = activeSemester ?? semesterLabels[0] ?? null;
  const visibleGrades = (student?.grades ?? []).filter((g) => g.semester.label === semester);
  const semesterMean = weightedGpa(
    visibleGrades.map((g) => ({ noteFinale: nfOf(g), coefficient: g.subject.coefficient }))
  );

  const attendanceBySubject = useMemo(() => {
    const map = new Map<string, { name: string; total: number; present: number }>();
    for (const rec of student?.attendance ?? []) {
      const entry = map.get(rec.subjectId) ?? { name: rec.subject.nameFr, total: 0, present: 0 };
      entry.total += 1;
      if (rec.status === 'PRESENT' || rec.status === 'JUSTIFIED') entry.present += 1;
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
              {student.programme.nameFr} · S{student.currentSemester}
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
            <div className="flex items-center gap-2 text-[13px] text-ink2">
              <BookOpen size={14} className="shrink-0 text-ink3" />
              <span className="truncate">{student.faculty.nameFr}</span>
            </div>
            <div className="flex items-center gap-2 text-[13px] text-ink2">
              <GraduationCap size={14} className="shrink-0 text-ink3" />
              <span>Semestre {student.currentSemester}</span>
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
                  visibleGrades.map((g) => {
                    const nf = nfOf(g);
                    return (
                      <TRow key={g.id}>
                        <Td>
                          <div className="text-[13.5px] font-semibold text-ink">
                            {g.subject.nameFr}
                          </div>
                          <div className="font-mono text-[11px] text-ink3">{g.subject.code}</div>
                        </Td>
                        <Td className="font-mono text-[12.5px] text-ink2">{fmt(g.noteCc)}</Td>
                        <Td className="font-mono text-[12.5px] text-ink2">{fmt(g.noteCf)}</Td>
                        <Td className="font-mono text-[12.5px] text-ink2">
                          {g.subject.coefficient}
                        </Td>
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
