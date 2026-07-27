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
import { Tooltip } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useCurrentSemester, useSemesters } from '@/hooks/queries/use-academics';
import { usePublishGrades } from '@/hooks/queries/use-grades';
import { useSubjectStages } from '@/hooks/use-subject-stages';
import { useScopeStore } from '@/stores/scope-store';
import { fmt } from '@/lib/grade-helpers';
import { TONE_COLORS, type Tone } from '@/lib/tokens';
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

  // Roll-up of the per-subject stages, purely for presentation (items #26–29).
  const stages = useMemo(() => Array.from(stageBySubject.values()), [stageBySubject]);
  const ccCompleteCount = stages.filter((s) => s >= 3).length; // stage ≥ CC complet
  const anyGrades = stages.some((s) => s > 1);
  const ccMissing = stages.filter((s) => s < 3).length; // not yet CC complet
  const nfMissing = stages.filter((s) => s < 6).length; // no final computed yet
  // The rail's "current" dot = the least-advanced subject (the floor every
  // subject has cleared), which is exactly what gates the next publication.
  const currentStage = stages.length > 0 ? Math.min(...stages) : 1;

  // Publish-state helper strip phase (item #29) — derived from the summary flags.
  const phase = useMemo<{ text: string; tone: Tone; muted?: boolean }>(() => {
    const { total, everyNfPublished, canPublishNf, everyCcPublished, canPublishCc } = summary;
    if (everyNfPublished) return { text: 'Résultats publiés', tone: 'jade' };
    if (canPublishNf) return { text: 'Publication des résultats finaux possible', tone: 'blue' };
    if (everyCcPublished)
      return {
        text: 'Notes CC publiées — saisie des examens finaux en cours',
        tone: 'jade',
        muted: true,
      };
    if (canPublishCc)
      return { text: 'Publication CC possible — toutes les notes CC sont saisies', tone: 'blue' };
    if (anyGrades)
      return {
        text: `Saisie en cours — ${ccCompleteCount} matière${
          ccCompleteCount !== 1 ? 's' : ''
        } sur ${total} en CC complet`,
        tone: 'amber',
      };
    return { text: 'Saisie non commencée', tone: 'slate' };
  }, [summary, anyGrades, ccCompleteCount]);

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
      const nfButton = (
        <Button
          kind="primary"
          icon={<Send size={17} />}
          disabled={!summary.canPublishNf || publish.isPending}
          onClick={() => onPublish('nf')}
        >
          Publier les résultats finaux
        </Button>
      );
      return summary.canPublishNf ? (
        nfButton
      ) : (
        <Tooltip
          label={`Publication impossible — ${nfMissing} matière${
            nfMissing !== 1 ? 's' : ''
          } n'${nfMissing !== 1 ? 'ont' : 'a'} pas de résultat final calculé`}
        >
          {nfButton}
        </Tooltip>
      );
    }
    const ccButton = (
      <Button
        kind="primary"
        icon={<Send size={17} />}
        disabled={!summary.canPublishCc || publish.isPending}
        onClick={() => onPublish('cc')}
      >
        Publier les notes CC
      </Button>
    );
    return summary.canPublishCc ? (
      ccButton
    ) : (
      <Tooltip
        label={`Publication CC impossible — ${ccMissing} matière${
          ccMissing !== 1 ? 's' : ''
        } n'${ccMissing !== 1 ? 'ont' : 'a'} pas toutes les notes CC saisies`}
      >
        {ccButton}
      </Tooltip>
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
            <>
              {/* Publish-state helper strip + 7-stage rail (items #29, #26) */}
              <div
                className="mb-5 flex items-center gap-3 rounded-[12px] px-4 py-[10px] text-[13px] font-semibold"
                style={{
                  background: TONE_COLORS[phase.tone][1],
                  color: phase.muted ? 'var(--ink2)' : TONE_COLORS[phase.tone][0],
                }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ background: TONE_COLORS[phase.tone][0] }}
                />
                <span className="flex-1">{phase.text}</span>
                <div className="flex shrink-0 items-center gap-[5px]" aria-hidden>
                  {Array.from({ length: 7 }, (_, idx) => {
                    const s = idx + 1;
                    const isCurrent = s === currentStage;
                    const isPast = s < currentStage;
                    return (
                      <span
                        key={s}
                        className="h-[6px] w-[6px] rounded-full"
                        style={
                          isCurrent
                            ? { background: TONE_COLORS[phase.tone][0] }
                            : isPast
                              ? { background: TONE_COLORS[phase.tone][0], opacity: 0.4 }
                              : { border: '1.5px solid var(--hair2)' }
                        }
                      />
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              {subjects.map((subject) => {
                const stage = stageBySubject.get(subject.id) ?? 1;
                const avg = classAverage(subject.id);
                const subjectRows = gradesBySubject.get(subject.id) ?? [];
                const n = subjectRows.length;
                const ccEntered = subjectRows.filter((r) => r.noteCc != null).length;
                const ccPct = n > 0 ? Math.round((ccEntered / n) * 100) : 0;
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
                      <div className="min-w-0 flex-1">
                        <div className="font-mono text-[11px] text-ink3">
                          CC {ccEntered}/{n}
                        </div>
                        <span className="mt-[5px] block h-[4px] w-full max-w-[120px] overflow-hidden rounded-full bg-sunken">
                          <span
                            className="block h-full rounded-full"
                            style={{ width: `${ccPct}%`, background: 'var(--jade)' }}
                          />
                        </span>
                      </div>
                      <span className="h-6 w-px bg-hair2" />
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
            </>
          )}
        </>
      )}
    </div>
  );
}
