'use client';

import { useMemo, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bar,
  BarChart,
  Cell,
  LabelList,
  ResponsiveContainer,
  XAxis,
} from 'recharts';
import {
  CalendarCheck,
  Clock,
  Dot,
  Download,
  GraduationCap,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  Trash2,
  Users,
} from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { StatCard } from '@/components/shared/stat-card';
import { Card } from '@/components/shared/card';
import { Avatar } from '@/components/shared/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAdminRole } from '@/hooks/use-admin';
import { useDashboardStats, useRecentActivity } from '@/hooks/queries/use-dashboard';
import { useStudents } from '@/hooks/queries/use-students';
import { fmt, gradeTone, listGradeTone, presenceTone } from '@/lib/grade-helpers';
import { fmtRelative } from '@/lib/utils';
import { C, TONE_COLORS, type Tone } from '@/lib/tokens';
import type { ActivityEntry, StudentRow } from '@/lib/types';

/** 8-week presence trend — demo data (impl spec §11 Sparkline). */
const TREND_WEEKS = [82, 85, 84, 88, 86, 89, 87, 87];

const GRADE_TEXT: Record<'danger' | 'amber' | 'ink', string> = {
  danger: 'text-danger',
  amber: 'text-amber',
  ink: 'text-ink',
};

/** Activity verb → icon tile tone + icon (impl spec §11). */
function activityMeta(action: string): { tone: Tone; icon: ReactNode } {
  const a = action.toLowerCase();
  if (a.includes('resetpassword')) return { tone: 'amber', icon: <RotateCcw size={14} /> };
  if (a.includes('create') || a.includes('send')) return { tone: 'jade', icon: <Plus size={14} /> };
  if (a.includes('update') || a.includes('publish') || a.includes('approve') || a.includes('status'))
    return { tone: 'blue', icon: <Pencil size={14} /> };
  if (a.includes('delete') || a.includes('reject'))
    return { tone: 'danger', icon: <Trash2 size={14} /> };
  return { tone: 'slate', icon: <Dot size={14} /> };
}

function Sparkline({ data }: { data: number[] }) {
  const w = 280;
  const h = 72;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const span = max - min || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * (w - 8) + 4,
    y: h - 6 - ((v - min) / span) * (h - 16),
  }));
  const poly = pts.map((p) => `${p.x},${p.y}`).join(' ');
  const area = `M${pts[0].x},${h} L${poly.replace(/ /g, ' L')} L${pts[pts.length - 1].x},${h} Z`;
  const last = pts[pts.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mt-3 w-full" aria-hidden>
      <path d={area} fill={C.jade} opacity={0.1} />
      <polyline
        points={poly}
        fill="none"
        stroke={C.jade}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={last.x} cy={last.y} r={3} fill={C.jade} />
    </svg>
  );
}

function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[140px] animate-pulse rounded-[16px] bg-sunken" />
        ))}
      </div>
      <div className="grid grid-cols-[1.55fr_1fr] gap-4">
        <div className="h-[280px] animate-pulse rounded-[16px] bg-sunken" />
        <div className="h-[280px] animate-pulse rounded-[16px] bg-sunken" />
      </div>
      <div className="grid grid-cols-[1.55fr_1fr] gap-4">
        <div className="h-[320px] animate-pulse rounded-[16px] bg-sunken" />
        <div className="h-[320px] animate-pulse rounded-[16px] bg-sunken" />
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const role = useAdminRole();
  const { data: stats } = useDashboardStats();
  const { data: activity } = useRecentActivity();
  const { data: studentsPage } = useStudents({ pageSize: 100 });

  const atRisk = useMemo<StudentRow[]>(() => {
    const rows = studentsPage?.data ?? [];
    return rows
      .filter(
        (s) =>
          s.status !== 'SUSPENDED' &&
          ((s.gpa != null && s.gpa < 10) || (s.presence != null && s.presence < 75))
      )
      .slice(0, 5);
  }, [studentsPage]);

  if (!stats) {
    return (
      <>
        <PageHead title="Tableau de bord" sub="Université de Djibouti" />
        <DashboardSkeleton />
      </>
    );
  }

  const presencePct = stats.attendancePercentage;
  const presenceBarColor = TONE_COLORS[presenceTone(presencePct)][0];

  return (
    <>
      <PageHead
        title="Tableau de bord"
        sub="Université de Djibouti"
        actions={
          <>
            <Button
              kind="ghost"
              icon={<Download size={17} />}
              onClick={() => toast('Export disponible prochainement')}
            >
              Exporter
            </Button>
            <Button
              kind="primary"
              icon={<Send size={17} />}
              onClick={() => router.push('/notifications')}
            >
              Notifier
            </Button>
          </>
        }
      />

      {/* ── Row 1: stat cards ── */}
      <div className="grid grid-cols-4 gap-4">
        <StatCard
          icon={<Users size={18} />}
          tone="jade"
          label="Étudiants inscrits"
          value={stats.studentsCount}
          sub={`${stats.studentsAtRisk} à risque · ${stats.studentsSuspended} suspendu(s)`}
        />
        <StatCard
          icon={<CalendarCheck size={18} />}
          tone="blue"
          label="Présence moyenne"
          value={presencePct}
          unit="%"
          sub={
            <div>
              <div>Seuil d&apos;assiduité : {stats.attendanceThreshold} %</div>
              <div className="mt-[6px] h-[5px] w-full overflow-hidden rounded-full bg-sunken">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{ width: `${presencePct}%`, background: presenceBarColor }}
                />
              </div>
            </div>
          }
        />
        <StatCard
          icon={<GraduationCap size={18} />}
          tone="amber"
          label="Moyenne générale"
          value={fmt(stats.averageGpa, 1)}
          unit="/20"
          sub={
            <span className="inline-flex items-center gap-[6px]">
              <Badge tone={gradeTone(stats.averageGpa)}>{stats.gpaMention ?? '—'}</Badge>
              <span>· {stats.currentSemester ?? '—'} en cours</span>
            </span>
          }
        />
        <StatCard
          icon={<Clock size={18} />}
          tone="danger"
          label="Justificatifs en attente"
          value={stats.pendingJustifications}
          sub="À traiter cette semaine"
          onClick={() => router.push('/attendance')}
        />
      </div>

      {/* ── Row 2: distribution + trend ── */}
      <div className="mt-4 grid grid-cols-[1.55fr_1fr] gap-4">
        <Card>
          <div className="mb-2 flex items-center justify-between">
            <div className="text-[15.5px] font-bold text-ink">Répartition des moyennes</div>
            <Badge tone="jade">{stats.studentsCount} étudiants</Badge>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.gradeDistribution} margin={{ top: 20, left: 8, right: 8 }}>
              <XAxis
                dataKey="range"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 11, fill: C.ink3, fontFamily: 'var(--mono)' }}
              />
              <Bar dataKey="count" radius={[6, 6, 3, 3]} maxBarSize={38}>
                <LabelList
                  dataKey="count"
                  position="top"
                  style={{ fontSize: 11, fill: C.ink2, fontFamily: 'var(--mono)' }}
                />
                {stats.gradeDistribution.map((bucket) => (
                  <Cell
                    key={bucket.range}
                    fill={bucket.range === '<10' ? C.danger : C.jade}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card>
          <div className="text-[15.5px] font-bold text-ink">Tendance de présence</div>
          <div className="mt-3 flex items-center gap-3">
            <span className="text-[32px] font-extrabold leading-none tracking-[-0.02em] text-ink">
              {presencePct}%
            </span>
            <Badge tone="jade" dot>
              +2 pts vs S1
            </Badge>
          </div>
          <Sparkline data={TREND_WEEKS} />
          <div className="mt-1 flex justify-between font-mono text-[10px] text-ink3">
            {TREND_WEEKS.map((_, i) => (
              <span key={i}>S{i + 1}</span>
            ))}
          </div>
        </Card>
      </div>

      {/* ── Row 3: activity + at-risk ── */}
      <div className="mt-4 grid grid-cols-[1.55fr_1fr] gap-4">
        <Card pad={0}>
          <div className="px-5 pb-3 pt-[18px] text-[15.5px] font-bold text-ink">
            Activité récente
          </div>
          {(activity ?? []).slice(0, 7).map((entry: ActivityEntry) => {
            const meta = activityMeta(entry.action);
            const [fg, bg] = TONE_COLORS[meta.tone];
            return (
              <div
                key={entry.id}
                className="flex items-center gap-3 border-t border-hair px-5 py-[11px] transition-colors hover:bg-surface2"
              >
                <span
                  className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[9px]"
                  style={{ background: bg, color: fg }}
                >
                  {meta.icon}
                </span>
                <div className="min-w-0 flex-1 text-[13px] text-ink2">
                  <b className="text-ink">{entry.who}</b>{' '}
                  <span className="font-mono text-[12px]">{entry.action}</span>{' '}
                  <b className="text-ink">{entry.entityType}</b>
                </div>
                <span className="shrink-0 text-[11.5px] text-ink3">{fmtRelative(entry.when)}</span>
              </div>
            );
          })}
          {(activity ?? []).length === 0 && (
            <div className="border-t border-hair px-5 py-8 text-center text-[13px] text-ink3">
              Aucune activité récente.
            </div>
          )}
          {role === 'SUPER_ADMIN' && (
            <div className="border-t border-hair px-5 py-3">
              <button
                type="button"
                onClick={() => router.push('/audit')}
                className="cursor-pointer border-0 bg-transparent p-0 text-[13px] font-semibold text-jade-text hover:underline"
              >
                Journal complet →
              </button>
            </div>
          )}
        </Card>

        <Card>
          <div className="text-[15.5px] font-bold text-ink">Étudiants à risque</div>
          <div className="mt-2">
            {atRisk.map((s) => (
              <div
                key={s.id}
                onClick={() => router.push(`/students/${s.id}`)}
                className="-mx-2 flex cursor-pointer items-center gap-3 rounded-[10px] px-2 py-[9px] transition-colors hover:bg-surface2"
              >
                <Avatar name={s.name} size={32} />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13.5px] font-semibold text-ink">{s.name}</div>
                  <div className="font-mono text-[11px] text-ink3">{s.matricule}</div>
                </div>
                <div className="shrink-0 text-right">
                  <div className={`text-[13.5px] font-bold ${GRADE_TEXT[listGradeTone(s.gpa)]}`}>
                    {fmt(s.gpa)}
                  </div>
                  <div className="font-mono text-[11px] text-ink3">
                    {s.presence != null ? `${s.presence}%` : '—'}
                  </div>
                </div>
              </div>
            ))}
            {atRisk.length === 0 && (
              <div className="py-6 text-center text-[13px] text-ink3">
                Aucun étudiant à risque. ✓
              </div>
            )}
          </div>
          <Button
            kind="soft"
            className="mt-3 w-full"
            onClick={() => router.push('/students?filter=risk')}
          >
            Voir tous les étudiants à risque
          </Button>
        </Card>
      </div>
    </>
  );
}
