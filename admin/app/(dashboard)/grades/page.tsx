'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronRight, Download, GraduationCap, Send } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { EmptyState } from '@/components/shared/empty-state';
import { LifecycleBadge } from '@/components/shared/lifecycle-badge';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { useCurrentSemester, useSemesters } from '@/hooks/queries/use-academics';
import { usePublishGrades } from '@/hooks/queries/use-grades';
import { useSubjectStages } from '@/hooks/use-subject-stages';
import { useScopeStore } from '@/stores/scope-store';
import { fmt } from '@/lib/grade-helpers';
import { apiErrorMessage } from '@/lib/utils';
import type { PublishType } from '@/lib/types';

/**
 * Grades picker (Pass C-2, change-set §30.2) — requires a scoped programme,
 * shows subject cards with 7-stage lifecycle badges, and exposes the two
 * semester-level publication actions (CC → NF) in the PageHead.
 */
export default function GradesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const programmeId = useScopeStore((s) => s.programmeId);

  const { data: semesters } = useSemesters();
  const currentSemester = useCurrentSemester();
  const [semesterId, setSemesterId] = useState<string | null>(null);

  const sortedSemesters = useMemo(
    () => (semesters ? [...semesters].sort((a, b) => a.startDate.localeCompare(b.startDate)) : []),
    [semesters]
  );
  const activeSemester = semesterId ?? currentSemester?.id ?? sortedSemesters[0]?.id ?? '';

  const { subjects, stageBySubject, gradesBySubject, summary, isLoading } = useSubjectStages(
    programmeId,
    activeSemester || null
  );
  const publish = usePublishGrades();

  const classAverage = (subjectId: string): number | null => {
    const finals = (gradesBySubject.get(subjectId) ?? [])
      .map((g) => g.noteFinale)
      .filter((n): n is number => n != null);
    return finals.length > 0 ? finals.reduce((sum, n) => sum + n, 0) / finals.length : null;
  };

  const onPublish = async (type: PublishType) => {
    if (!programmeId || !activeSemester) return;
    try {
      await publish.mutateAsync({ type, semesterId: activeSemester, programmeId });
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  // One publication action visible at a time, by semester state (§30.2).
  const publishAction = () => {
    if (summary.total === 0) return null;
    if (summary.everyNfPublished) {
      return (
        <Badge tone="jade" dot>
          Résultats publiés
        </Badge>
      );
    }
    if (summary.everyCcPublished) {
      return (
        <Button
          kind="primary"
          icon={<Send size={17} />}
          disabled={!summary.canPublishNf || publish.isPending}
          onClick={() => onPublish('nf')}
        >
          Publier les résultats finaux
        </Button>
      );
    }
    return (
      <Button
        kind="primary"
        icon={<Send size={17} />}
        disabled={!summary.canPublishCc || publish.isPending}
        onClick={() => onPublish('cc')}
      >
        Publier les notes CC
      </Button>
    );
  };

  return (
    <div>
      <PageHead
        title="Notes"
        sub="Sélectionnez une matière pour saisir ou modifier les notes"
        actions={
          <>
            <Button
              kind="ghost"
              icon={<Download size={17} />}
              onClick={() => toast('Export disponible prochainement')}
            >
              Exporter le relevé
            </Button>
            {programmeId ? publishAction() : null}
          </>
        }
      />

      {!programmeId ? (
        <Card>
          <EmptyState
            icon={<GraduationCap size={20} />}
            message="Sélectionnez un programme pour voir les matières. Utilisez la barre de contexte ci-dessus (Faculté → Programme)."
          />
        </Card>
      ) : (
        <>
          <Tabs
            className="mb-5"
            tabs={sortedSemesters.map((s) => ({ key: s.id, label: s.label }))}
            active={activeSemester}
            onChange={setSemesterId}
          />

          {isLoading ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-[120px] animate-pulse rounded-[16px] bg-sunken" />
              ))}
            </div>
          ) : subjects.length === 0 ? (
            <Card>
              <EmptyState
                icon={<GraduationCap size={20} />}
                message="Aucune matière pour ce programme et ce semestre."
              />
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {subjects.map((subject) => {
                const stage = stageBySubject.get(subject.id) ?? 1;
                const avg = classAverage(subject.id);
                const count = gradesBySubject.get(subject.id)?.length ?? 0;
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
                          {subject.code}
                          {subject.professorName ? ` · Prof. ${subject.professorName}` : ''} · Coef.{' '}
                          {subject.coefficient}
                        </div>
                      </div>
                      <LifecycleBadge stage={stage} />
                    </div>
                    <div className="mt-3 flex items-center gap-4 border-t border-hair pt-3">
                      <span className="font-mono text-[11px] text-ink3">{count} inscrits</span>
                      <span className="ml-auto h-6 w-px bg-hair2" />
                      <div className="text-right">
                        <div className="text-[19px] font-extrabold leading-none text-ink">
                          {fmt(avg)}
                        </div>
                        <div className="mt-[3px] font-mono text-[10.5px] text-ink3">Moy. classe</div>
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
