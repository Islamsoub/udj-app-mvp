'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Calendar,
  CalendarCheck,
  Check,
  GripVertical,
  Globe,
  GraduationCap,
  Megaphone,
  Plus,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { AccessDenied } from '@/components/shared/access-denied';
import { ConfirmModal } from '@/components/shared/confirm-modal';
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
  useCreateCategory,
  useDeleteCategory,
  useNewsCategories,
  useReorderCategories,
} from '@/hooks/queries/use-news';
import {
  useSettings,
  useUpdateAttendanceThreshold,
  useUpdateGradeFormula,
  useUpdateJustificationDeadline,
} from '@/hooks/queries/use-settings';
import { cn, apiErrorMessage } from '@/lib/utils';
import type { NewsCategory } from '@/lib/types';

/**
 * Settings (impl spec §26; Pass C-2 change-set §30.9) — SUPER_ADMIN only. Adds
 * a news-category manager (drag-to-reorder), a justification-deadline field, and
 * greys out the deprecated automation toggles (publication is two-phase manual
 * and system notifications are always-on).
 */
interface Draft {
  cc: number; // gradeWeightCc, 0–1
  threshold: number;
  justificationDeadlineDays: number;
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

// ─── News categories manager (§30.9 / AD §7.2) ───────────────────────────────

function CategoriesCard() {
  const { data } = useNewsCategories();
  const createCat = useCreateCategory();
  const deleteCat = useDeleteCategory();
  const reorder = useReorderCategories();
  const { open } = useModal();
  const { toast } = useToast();

  const [items, setItems] = useState<NewsCategory[]>([]);
  useEffect(() => {
    if (data) setItems(data);
  }, [data]);

  const dragIndex = useRef<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState('');

  const commitOrder = (next: NewsCategory[]) => {
    setItems(next);
    reorder.mutate(next.map((c, i) => ({ id: c.id, displayOrder: i })));
  };

  const onDrop = (dropIndex: number) => {
    const from = dragIndex.current;
    dragIndex.current = null;
    setOverIndex(null);
    if (from == null || from === dropIndex) return;
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(dropIndex, 0, moved);
    commitOrder(next);
  };

  const onAdd = async () => {
    const name = newName.trim();
    if (!name) return;
    try {
      await createCat.mutateAsync({ nameFr: name });
      setNewName('');
      setAdding(false);
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const confirmDelete = (c: NewsCategory) =>
    open(
      <ConfirmModal
        title="Supprimer la catégorie"
        sub={c.nameFr}
        body={
          <>
            Cette catégorie sera définitivement supprimée. La suppression est refusée si des articles
            l&apos;utilisent encore.
          </>
        }
        confirmLabel="Supprimer"
        onConfirm={async () => {
          try {
            await deleteCat.mutateAsync(c.id);
          } catch (err) {
            toast(apiErrorMessage(err), 'x');
            return { keep: true };
          }
        }}
      />
    );

  return (
    <SettingsCard icon={<Megaphone size={18} />} title="Catégories d'actualités" className="col-span-2">
      <div className="mt-1 flex flex-col gap-[6px]">
        {items.map((c, i) => (
          <div
            key={c.id}
            draggable
            onDragStart={() => {
              dragIndex.current = i;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setOverIndex(i);
            }}
            onDragEnd={() => setOverIndex(null)}
            onDrop={() => onDrop(i)}
            className={cn(
              'flex items-center gap-3 rounded-[10px] border bg-surface2 px-3 py-[9px] transition-colors',
              overIndex === i ? 'border-jade' : 'border-transparent'
            )}
          >
            <GripVertical size={16} className="shrink-0 cursor-grab text-ink3" />
            <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-ink">
              {c.nameFr}
            </span>
            <span className="font-mono text-[11px] text-ink3">{c.slug}</span>
            <button
              type="button"
              onClick={() => confirmDelete(c)}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-[8px] border-0 bg-transparent text-ink3 transition-colors hover:bg-danger-bg hover:text-danger"
              aria-label={`Supprimer ${c.nameFr}`}
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <div className="py-3 text-center text-[13px] text-ink3">Aucune catégorie.</div>
        )}
      </div>

      {adding ? (
        <div className="mt-3 flex items-center gap-2">
          <input
            autoFocus
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') void onAdd();
              if (e.key === 'Escape') {
                setAdding(false);
                setNewName('');
              }
            }}
            placeholder="Nom de la catégorie"
            className="flex-1 rounded-[10px] border border-hair2 bg-surface px-[13px] py-[9px] text-[14px] text-ink outline-none focus:border-jade focus:shadow-[0_0_0_3px_var(--jade-faint)]"
          />
          <Button size="sm" icon={<Check size={15} />} disabled={createCat.isPending} onClick={onAdd}>
            Ajouter
          </Button>
          <Button
            kind="quiet"
            size="sm"
            icon={<X size={15} />}
            onClick={() => {
              setAdding(false);
              setNewName('');
            }}
          >
            Annuler
          </Button>
        </div>
      ) : (
        <div className="mt-3">
          <Button kind="soft" size="sm" icon={<Plus size={15} />} onClick={() => setAdding(true)}>
            Ajouter une catégorie
          </Button>
        </div>
      )}
    </SettingsCard>
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
  const updateJustificationDeadline = useUpdateJustificationDeadline();

  const [draft, setDraft] = useState<Draft | null>(null);

  useEffect(() => {
    if (settings && !draft) {
      setDraft({
        cc: settings.gradeWeightCc,
        threshold: settings.attendanceThreshold,
        justificationDeadlineDays: settings.justificationDeadlineDays,
        autoAlert: true,
      });
    }
  }, [settings, draft]);

  if (role && role !== 'SUPER_ADMIN') return <AccessDenied />;

  const saving =
    updateGradeFormula.isPending ||
    updateAttendanceThreshold.isPending ||
    updateJustificationDeadline.isPending;

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
      if (draft.justificationDeadlineDays !== settings.justificationDeadlineDays) {
        await updateJustificationDeadline.mutateAsync(draft.justificationDeadlineDays);
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
            onChange={(e) => setDraft((d) => (d ? { ...d, cc: Number(e.target.value) / 100 } : d))}
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
            onChange={(e) => setDraft((d) => (d ? { ...d, threshold: Number(e.target.value) } : d))}
            className="mt-2 w-full"
          />
          <div className="mt-2">
            <SettingsRow
              title="Délai de justification"
              desc="Les étudiants ne pourront plus soumettre de justificatif après ce délai."
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={draft.justificationDeadlineDays}
                  onChange={(e) =>
                    setDraft((d) =>
                      d
                        ? {
                            ...d,
                            justificationDeadlineDays: Math.max(
                              1,
                              Math.min(30, Number(e.target.value) || 1)
                            ),
                          }
                        : d
                    )
                  }
                  className="w-[68px] rounded-[10px] border border-hair2 bg-surface px-[10px] py-[7px] text-center font-mono text-[14px] text-ink outline-none focus:border-jade focus:shadow-[0_0_0_3px_var(--jade-faint)]"
                />
                <span className="text-[12.5px] text-ink2">jours</span>
              </div>
            </SettingsRow>
            <SettingsRow title="Alerte automatique" desc="Notifier les étudiants sous le seuil">
              <Toggle
                checked={draft.autoAlert}
                onChange={(b) => setDraft((d) => (d ? { ...d, autoAlert: b } : d))}
                aria-label="Alerte automatique"
              />
            </SettingsRow>
          </div>
        </SettingsCard>

        {/* ─── Automatisations (deprecated — display only) ───────────────── */}
        <SettingsCard icon={<Zap size={18} />} title="Automatisations">
          <SettingsRow title="Publication auto des notes" desc="Publication désormais manuelle en deux temps">
            <Toggle checked={settings.autoPublishGrades} onChange={() => {}} disabled aria-label="Publication auto des notes" />
          </SettingsRow>
          <SettingsRow title="Notification à la publication" desc="Notifications système toujours envoyées">
            <Toggle checked={settings.notifyOnPublish} onChange={() => {}} disabled aria-label="Notification à la publication" />
          </SettingsRow>
          <SettingsRow title="Récapitulatif hebdomadaire" desc="Réservé à un usage futur">
            <Toggle checked={settings.weeklyRecap} onChange={() => {}} disabled aria-label="Récapitulatif hebdomadaire" />
          </SettingsRow>
          <div className="mt-2 rounded-[10px] bg-surface2 px-3 py-2 text-[12px] text-ink3">
            Notifications automatiques toujours actives.
          </div>
        </SettingsCard>

        {/* ─── Catégories d'actualités (§30.9) ───────────────────────────── */}
        <CategoriesCard />

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
