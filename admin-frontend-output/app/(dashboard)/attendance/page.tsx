'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  AlertTriangle,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  Eye,
  FileText,
  Image as ImageIcon,
  Inbox,
  Users,
} from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { Avatar } from '@/components/shared/avatar';
import { StatCard } from '@/components/shared/stat-card';
import { EmptyState } from '@/components/shared/empty-state';
import { DocViewer } from '@/components/modals/doc-viewer';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/tabs';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useAttendance, useDecideJustification } from '@/hooks/queries/use-attendance';
import { useSettings } from '@/hooks/queries/use-settings';
import { apiErrorMessage, cn, fmtDate } from '@/lib/utils';
import type { AttendanceRecordRow, JustificationStatus } from '@/lib/types';

const STRIPES = {
  background: 'repeating-linear-gradient(45deg, var(--surface2) 0 12px, var(--sunken) 12px 24px)',
} as const;

type QueueTab = 'PENDING' | 'APPROVED' | 'REJECTED';

const STATUS_BADGE: Record<QueueTab, { tone: 'amber' | 'jade' | 'danger'; label: string }> = {
  PENDING: { tone: 'amber', label: 'En attente' },
  APPROVED: { tone: 'jade', label: 'Validé' },
  REJECTED: { tone: 'danger', label: 'Rejeté' },
};

function studentName(r: AttendanceRecordRow): string {
  return `${r.student.firstName} ${r.student.lastName}`;
}

function docType(r: AttendanceRecordRow): string {
  return (r.justificationDocUrl ?? '').toLowerCase().endsWith('.pdf') ? 'PDF' : 'Photo';
}

/** Attendance queue (impl spec §17) — justification triage. */
export default function AttendancePage() {
  const router = useRouter();
  const { open } = useModal();
  const { toast } = useToast();
  const { data } = useAttendance();
  const { data: settings } = useSettings();
  const decide = useDecideJustification();

  const [tab, setTab] = useState<QueueTab>('PENDING');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const records = useMemo(() => data?.records ?? [], [data]);
  const threshold = settings?.attendanceThreshold ?? 75;

  const byStatus = (status: JustificationStatus) =>
    records.filter((r) => r.justificationStatus === status);
  const pending = useMemo(() => byStatus('PENDING'), [records]); // eslint-disable-line react-hooks/exhaustive-deps
  const approved = useMemo(() => byStatus('APPROVED'), [records]); // eslint-disable-line react-hooks/exhaustive-deps
  const rejected = useMemo(() => byStatus('REJECTED'), [records]); // eslint-disable-line react-hooks/exhaustive-deps

  // Average presence: (PRESENT + JUSTIFIED) / total, from statusCounts.
  const presencePct = useMemo(() => {
    const counts = data?.statusCounts ?? [];
    const total = counts.reduce((s, c) => s + c.count, 0);
    const present = counts
      .filter((c) => c.status === 'PRESENT' || c.status === 'JUSTIFIED')
      .reduce((s, c) => s + c.count, 0);
    return total > 0 ? Math.round((present / total) * 100) : 0;
  }, [data]);

  // Distinct students under the threshold, from per-student record ratios.
  const underThreshold = useMemo(() => {
    const perStudent = new Map<string, { present: number; total: number }>();
    for (const r of records) {
      const agg = perStudent.get(r.studentId) ?? { present: 0, total: 0 };
      agg.total += 1;
      if (r.status === 'PRESENT' || r.status === 'JUSTIFIED') agg.present += 1;
      perStudent.set(r.studentId, agg);
    }
    let n = 0;
    for (const agg of perStudent.values()) {
      if (agg.total > 0 && (agg.present / agg.total) * 100 < threshold) n += 1;
    }
    return n;
  }, [records, threshold]);

  const list = tab === 'PENDING' ? pending : tab === 'APPROVED' ? approved : rejected;
  const selected = list.find((r) => r.id === selectedId) ?? list[0] ?? null;

  const act = async (decision: 'approve' | 'reject') => {
    if (!selected) return;
    try {
      await decide.mutateAsync({ id: selected.id, decision });
      // Auto-advance to the next pending item.
      const next = pending.filter((p) => p.id !== selected.id);
      setSelectedId(next[0]?.id ?? null);
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  const loading = !data;
  const isPdf = selected ? (selected.justificationDocUrl ?? '').toLowerCase().endsWith('.pdf') : false;

  return (
    <div>
      <PageHead
        title="Présence"
        sub="File des justificatifs d'absence à traiter"
        actions={
          <Button
            kind="ghost"
            icon={<CalendarCheck size={17} />}
            onClick={() => router.push('/attendance/session')}
          >
            Marquer une séance
          </Button>
        }
      />

      {loading ? (
        <>
          <div className="mb-5 grid grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[120px] animate-pulse rounded-[16px] bg-sunken" />
            ))}
          </div>
          <div className="h-[420px] animate-pulse rounded-[16px] bg-sunken" />
        </>
      ) : (
        <>
          <div className="mb-5 grid grid-cols-4 gap-4">
            <StatCard icon={<Clock size={18} />} tone="amber" label="En attente" value={pending.length} />
            <StatCard icon={<Check size={18} />} tone="jade" label="Validés" value={approved.length} />
            <StatCard
              icon={<Users size={18} />}
              tone="blue"
              label="Présence moyenne"
              value={presencePct}
              unit="%"
            />
            <StatCard
              icon={<AlertTriangle size={18} />}
              tone="danger"
              label={`Sous le seuil ${threshold}%`}
              value={underThreshold}
            />
          </div>

          <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 400px' }}>
            {/* Queue list */}
            <Card pad={0} className="overflow-hidden">
              <div className="border-b border-hair p-3">
                <Tabs<QueueTab>
                  tabs={[
                    { key: 'PENDING', label: 'En attente', count: pending.length, tone: 'amber' },
                    { key: 'APPROVED', label: 'Validés', count: approved.length },
                    { key: 'REJECTED', label: 'Rejetés', count: rejected.length },
                  ]}
                  active={tab}
                  onChange={(k) => {
                    setTab(k);
                    setSelectedId(null);
                  }}
                />
              </div>
              {list.length === 0 ? (
                <EmptyState icon={<CheckCircle2 size={20} />} message="Rien à traiter." />
              ) : (
                <div>
                  {list.map((r) => {
                    const isSel = selected?.id === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedId(r.id)}
                        className={cn(
                          'flex w-full cursor-pointer items-start gap-3 border-b border-hair px-4 py-3 text-left transition-colors',
                          isSel ? 'bg-jade-faint' : 'bg-transparent hover:bg-surface2'
                        )}
                        style={{
                          borderInlineStart: isSel
                            ? '3px solid var(--jade)'
                            : '3px solid transparent',
                        }}
                      >
                        <Avatar name={studentName(r)} size={36} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[13.5px] font-semibold text-ink">
                              {studentName(r)}
                            </span>
                            <Badge tone="slate">{docType(r)}</Badge>
                          </div>
                          <div className="mt-[2px] truncate text-[12.5px] text-ink2">
                            {r.justificationReason ?? 'Justificatif'} · {r.subject.nameFr}
                          </div>
                          <div className="mt-[2px] font-mono text-[11px] text-ink3">
                            Absent le {fmtDate(r.sessionDate)}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* Review pane */}
            <div className="sticky top-[84px] self-start">
              {selected ? (
                <Card>
                  <div className="flex items-center gap-3">
                    <Avatar name={studentName(selected)} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] font-bold text-ink">
                        {studentName(selected)}
                      </div>
                      <div className="font-mono text-[11.5px] text-ink3">
                        {selected.student.studentIdDisplay}
                      </div>
                    </div>
                    <Badge tone={STATUS_BADGE[(selected.justificationStatus ?? 'PENDING') as QueueTab].tone}>
                      {STATUS_BADGE[(selected.justificationStatus ?? 'PENDING') as QueueTab].label}
                    </Badge>
                  </div>

                  {/* Document preview */}
                  <div
                    className="mt-4 flex h-[280px] flex-col items-center justify-center gap-3 rounded-[12px]"
                    style={STRIPES}
                  >
                    <span className="flex h-[60px] w-[60px] items-center justify-center rounded-[12px] bg-surface text-ink3 shadow">
                      {isPdf ? <FileText size={24} /> : <ImageIcon size={24} />}
                    </span>
                    <span className="font-mono text-[11px] text-ink3">
                      justificatif_{selected.id}.{isPdf ? 'pdf' : 'jpg'}
                    </span>
                    <Button
                      kind="soft"
                      size="sm"
                      icon={<Eye size={15} />}
                      onClick={() => open(<DocViewer record={selected} />)}
                    >
                      Ouvrir le document
                    </Button>
                  </div>

                  {/* Detail rows */}
                  <div className="mt-4">
                    {[
                      ['Matière', selected.subject.nameFr],
                      ["Date d'absence", fmtDate(selected.sessionDate)],
                      ['Motif', selected.justificationReason ?? '—'],
                    ].map(([label, value]) => (
                      <div
                        key={label}
                        className="flex items-center justify-between gap-3 border-b border-hair py-2"
                      >
                        <span className="text-[12px] text-ink3">{label}</span>
                        <span className="truncate text-[13px] font-semibold text-ink">{value}</span>
                      </div>
                    ))}
                    <div className="flex items-center justify-between gap-3 py-2">
                      <span className="text-[12px] text-ink3">Référence</span>
                      <span className="font-mono text-[12px] text-ink2">{selected.id}</span>
                    </div>
                  </div>

                  {selected.justificationNote && (
                    <div className="mt-2 rounded-[10px] bg-surface2 p-3 text-[13px] italic text-ink2">
                      « {selected.justificationNote} »
                    </div>
                  )}

                  {selected.justificationStatus === 'PENDING' ? (
                    <div className="mt-4 flex gap-2">
                      <Button
                        kind="danger"
                        className="flex-1"
                        disabled={decide.isPending}
                        onClick={() => act('reject')}
                      >
                        Rejeter
                      </Button>
                      <Button
                        className="flex-1"
                        disabled={decide.isPending}
                        onClick={() => act('approve')}
                      >
                        Valider l&apos;absence
                      </Button>
                    </div>
                  ) : (
                    <div className="mt-4 text-[12.5px] text-ink3">
                      Traité · {selected.justificationStatus === 'APPROVED' ? 'Validé' : 'Rejeté'}
                    </div>
                  )}
                </Card>
              ) : (
                <Card>
                  <EmptyState
                    icon={<Inbox size={20} />}
                    message="Sélectionnez un justificatif dans la file pour le traiter."
                  />
                </Card>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
