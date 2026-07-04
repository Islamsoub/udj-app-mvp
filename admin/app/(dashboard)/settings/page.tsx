'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Calendar, CalendarCheck, Globe, GraduationCap, Zap } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { AccessDenied } from '@/components/shared/access-denied';
import { Button } from '@/components/ui/button';
import { Dropdown } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { Tooltip } from '@/components/ui/tooltip';
import { CloseSemesterModal } from '@/components/modals/close-semester-modal';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/use-admin';
import {
  useCurrentSemester,
  useSaveSemester,
  useSemesters,
} from '@/hooks/queries/use-academics';
import {
  useSettings,
  useUpdateAttendanceThreshold,
  useUpdateAutomations,
  useUpdateGradeFormula,
} from '@/hooks/queries/use-settings';
import { cn, apiErrorMessage } from '@/lib/utils';

/**
 * Settings (impl spec §26, supplement §12) — SUPER_ADMIN only. Local draft is
 * diffed against the server state on "Enregistrer"; only the changed PATCHes
 * fire (each hook toasts on success).
 */
interface Draft {
  cc: number; // gradeWeightCc, 0–1
  threshold: number;
  autoPublishGrades: boolean;
  notifyOnPublish: boolean;
  weeklyRecap: boolean;
  /** Local-only toggle — no server field in MVP. */
  autoAlert: boolean;
}

function SettingsCard({
  icon,
  title,
  children,
  className,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Card className={className}>
      <div className="mb-2 flex items-center gap-3">
        <span className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-[11px] bg-jade-faint text-jade-text">
          {icon}
        </span>
        <div className="text-[15.5px] font-bold text-ink">{title}</div>
      </div>
      {children}
    </Card>
  );
}

function SettingsRow({
  title,
  desc,
  children,
}: {
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-hair py-3 first:border-0">
      <div className="min-w-0">
        <div className="text-[13.5px] font-semibold text-ink">{title}</div>
        {desc && <div className="mt-[2px] text-[12px] text-ink2">{desc}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

const MENTIONS = [
  'Très Bien ≥ 16',
  'Bien 14 – 15.99',
  'Assez Bien 12 – 13.99',
  'Passable 10 – 11.99',
  'Insuffisant < 10',
];

function SettingsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4">
      {[0, 1, 2, 3].map((i) => (
        <div key={i} className="h-[220px] animate-pulse rounded-[16px] bg-sunken" />
      ))}
    </div>
  );
}

export default function SettingsPage() {
  const role = useAdminRole();
  const { open } = useModal();
  const { toast } = useToast();
  const { data: settings } = useSettings();
  const { data: semesters } = useSemesters();
  const currentSemester = useCurrentSemester();
  const saveSemester = useSaveSemester();
  const updateGradeFormula = useUpdateGradeFormula();
  const updateAttendanceThreshold = useUpdateAttendanceThreshold();
  const updateAutomations = useUpdateAutomations();

  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (settings && !draft) {
      setDraft({
        cc: settings.gradeWeightCc,
        threshold: settings.attendanceThreshold,
        autoPublishGrades: settings.autoPublishGrades,
        notifyOnPublish: settings.notifyOnPublish,
        weeklyRecap: settings.weeklyRecap,
        autoAlert: true,
      });
    }
  }, [settings, draft]);

  if (role && role !== 'SUPER_ADMIN') return <AccessDenied />;

  const saving =
    updateGradeFormula.isPending ||
    updateAttendanceThreshold.isPending ||
    updateAutomations.isPending;

  const onSave = async () => {
    if (!draft || !settings) return;
    try {
      if (draft.cc !== settings.gradeWeightCc) {
        await updateGradeFormula.mutateAsync({
          gradeWeightCc: Number(draft.cc.toFixed(2)),
          gradeWeightCf: Number((1 - draft.cc).toFixed(2)),
        });
      }
      if (draft.threshold !== settings.attendanceThreshold) {
        await updateAttendanceThreshold.mutateAsync(draft.threshold);
      }
      if (
        draft.autoPublishGrades !== settings.autoPublishGrades ||
        draft.notifyOnPublish !== settings.notifyOnPublish ||
        draft.weeklyRecap !== settings.weeklyRecap
      ) {
        await updateAutomations.mutateAsync({
          autoPublishGrades: draft.autoPublishGrades,
          notifyOnPublish: draft.notifyOnPublish,
          weeklyRecap: draft.weeklyRecap,
        });
      }
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const onSelectSemester = async (id: string) => {
    if (id === currentSemester?.id) return;
    try {
      await saveSemester.mutateAsync({ id, data: { isCurrent: true } });
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  if (!settings || !draft) {
    return (
      <>
        <PageHead title="Paramètres" sub="Configuration du système · réservé au Super Admin" />
        <SettingsSkeleton />
      </>
    );
  }

  const cc = draft.cc;
  const cf = 1 - cc;

  return (
    <>
      <PageHead
        title="Paramètres"
        sub="Configuration du système · réservé au Super Admin"
        actions={
          <Button kind="primary" disabled={saving} onClick={onSave}>
            Enregistrer
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-4">
        {/* ─── Période académique ────────────────────────────────────────── */}
        <SettingsCard icon={<Calendar size={18} />} title="Période académique">
          <SettingsRow title="Semestre courant" desc="Détermine les données affichées par défaut">
            <div className="w-[240px]">
              <Dropdown
                value={currentSemester?.id ?? null}
                onChange={onSelectSemester}
                options={(semesters ?? []).map((s) => ({
                  value: s.id,
                  label: `${s.label} — ${s.academicYear}${s.isCurrent ? ' (en cours)' : ''}`,
                }))}
                placeholder="Sélectionner…"
                disabled={saveSemester.isPending}
              />
            </div>
          </SettingsRow>
          <SettingsRow title="Année universitaire">
            <span className="font-mono text-[12.5px] text-ink">
              {currentSemester?.academicYear ?? '—'}
            </span>
          </SettingsRow>
          <SettingsRow title="Semaine de cours">
            <span className="font-mono text-[12.5px] text-ink">Dimanche → Jeudi</span>
          </SettingsRow>
        </SettingsCard>

        {/* ─── Barème de notation ────────────────────────────────────────── */}
        <SettingsCard icon={<GraduationCap size={18} />} title="Barème de notation">
          <div className="rounded-[10px] bg-surface2 p-3 font-mono text-[13px] text-ink">
            NF = {cc.toFixed(2)}·CC + {cf.toFixed(2)}·CF
          </div>
          <div className="mt-3 flex h-[10px] overflow-hidden rounded-full">
            <div className="bg-jade-faint" style={{ width: `${cc * 100}%` }} />
            <div className="flex-1 bg-blue-bg" />
          </div>
          <input
            type="range"
            min={20}
            max={60}
            step={5}
            value={Math.round(cc * 100)}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, cc: Number(e.target.value) / 100 } : d))
            }
            className="mt-2 w-full"
          />
          <div className="flex justify-between font-mono text-[11.5px] text-ink2">
            <span>CC {Math.round(cc * 100)}%</span>
            <span>CF {Math.round(cf * 100)}%</span>
          </div>
          <div className="mt-3 border-t border-hair pt-3">
            {MENTIONS.map((m) => (
              <div key={m} className="py-[2px] font-mono text-[11.5px] text-ink2">
                {m}
              </div>
            ))}
          </div>
        </SettingsCard>

        {/* ─── Assiduité ─────────────────────────────────────────────────── */}
        <SettingsCard icon={<CalendarCheck size={18} />} title="Assiduité">
          <div
            className={cn(
              'text-[26px] font-extrabold',
              draft.threshold < 70 ? 'text-amber' : 'text-ink'
            )}
          >
            {draft.threshold}%
          </div>
          <input
            type="range"
            min={50}
            max={90}
            step={5}
            value={draft.threshold}
            onChange={(e) =>
              setDraft((d) => (d ? { ...d, threshold: Number(e.target.value) } : d))
            }
            className="mt-2 w-full"
          />
          <div className="mt-2">
            <SettingsRow title="Alerte automatique" desc="Notifier les étudiants sous le seuil">
              <Toggle
                checked={draft.autoAlert}
                onChange={(b) => setDraft((d) => (d ? { ...d, autoAlert: b } : d))}
                aria-label="Alerte automatique"
              />
            </SettingsRow>
          </div>
        </SettingsCard>

        {/* ─── Automatisations ───────────────────────────────────────────── */}
        <SettingsCard icon={<Zap size={18} />} title="Automatisations">
          <SettingsRow
            title="Publication auto des notes"
            desc="Publier les notes dès leur validation"
          >
            <Toggle
              checked={draft.autoPublishGrades}
              onChange={(b) => setDraft((d) => (d ? { ...d, autoPublishGrades: b } : d))}
              aria-label="Publication auto des notes"
            />
          </SettingsRow>
          <SettingsRow
            title="Notification à la publication"
            desc="Push aux étudiants concernés"
          >
            <Toggle
              checked={draft.notifyOnPublish}
              onChange={(b) => setDraft((d) => (d ? { ...d, notifyOnPublish: b } : d))}
              aria-label="Notification à la publication"
            />
          </SettingsRow>
          <SettingsRow
            title="Récapitulatif hebdomadaire"
            desc="Résumé d'activité envoyé chaque semaine"
          >
            <Toggle
              checked={draft.weeklyRecap}
              onChange={(b) => setDraft((d) => (d ? { ...d, weeklyRecap: b } : d))}
              aria-label="Récapitulatif hebdomadaire"
            />
          </SettingsRow>
        </SettingsCard>

        {/* ─── Préférences régionales ────────────────────────────────────── */}
        <SettingsCard icon={<Globe size={18} />} title="Préférences régionales">
          <SettingsRow title="Langue par défaut">
            <div className="flex gap-[6px]">
              <button
                type="button"
                className="cursor-default rounded-[9px] border-0 bg-jade px-[13px] py-[7px] text-[13px] font-bold text-white"
              >
                Français
              </button>
              <Tooltip label="Prochainement">
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-[9px] border border-hair2 bg-transparent px-[13px] py-[7px] text-[13px] font-medium text-ink2 opacity-50"
                >
                  العربية
                </button>
              </Tooltip>
            </div>
          </SettingsRow>
          <SettingsRow title="Fuseau horaire">
            <span className="font-mono text-[12.5px] text-ink">GMT+3 · Africa/Djibouti</span>
          </SettingsRow>
        </SettingsCard>

        {/* ─── Danger zone ───────────────────────────────────────────────── */}
        <Card
          className="col-span-2 flex items-center justify-between gap-4"
          style={{ borderColor: 'rgba(225,72,61,0.25)', background: 'var(--danger-bg)' }}
        >
          <div>
            <div className="text-[15px] font-bold text-danger">Clôturer le semestre</div>
            <div className="mt-[2px] text-[12.5px] text-ink2">
              Fige les notes, archive les relevés de présence et prépare le semestre suivant.
            </div>
          </div>
          <Button
            kind="dangerSolid"
            onClick={() => {
              if (currentSemester) open(<CloseSemesterModal semester={currentSemester} />);
              else toast('Aucun semestre en cours', 'x');
            }}
          >
            Clôturer le semestre
          </Button>
        </Card>
      </div>
    </>
  );
}
