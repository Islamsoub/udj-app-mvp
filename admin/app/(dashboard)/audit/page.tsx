'use client';

import { Fragment, useMemo, useState, type ReactNode } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Dot,
  Download,
  ListX,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Settings,
  Trash2,
} from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { Avatar } from '@/components/shared/avatar';
import { AccessDenied } from '@/components/shared/access-denied';
import { EmptyState } from '@/components/shared/empty-state';
import { DatePicker } from '@/components/shared/date-picker';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TextInput } from '@/components/ui/input';
import { Tabs } from '@/components/ui/tabs';
import { Table, THead, Th, Td, TRow } from '@/components/ui/table';
import { useAdminRole } from '@/hooks/use-admin';
import { useAudit } from '@/hooks/queries/use-audit';
import { TONE_COLORS, type Tone } from '@/lib/tokens';
import { cn, downloadCsv, fmtStamp } from '@/lib/utils';

/**
 * Audit log (impl spec §25, supplement §7.3) — SUPER_ADMIN only. Server-side
 * category/date filters + client-side text search, expandable before/after
 * snapshots, CSV export of the current view.
 */
function verbMeta(action: string): { tone: Tone; icon: ReactNode } {
  const verb = action.split('.')[1] ?? '';
  if (['create', 'bulkCreate', 'send', 'login'].includes(verb))
    return { tone: 'jade', icon: <Plus size={13} /> };
  if (['update', 'status', 'publish', 'approve'].includes(verb))
    return { tone: 'blue', icon: <Pencil size={13} /> };
  if (['delete', 'reject'].includes(verb)) return { tone: 'danger', icon: <Trash2 size={13} /> };
  if (verb === 'resetPassword') return { tone: 'amber', icon: <RotateCcw size={13} /> };
  return { tone: 'slate', icon: <Dot size={13} /> };
}

function SnapshotBlock({
  label,
  color,
  data,
}: {
  label: string;
  color: string;
  data: Record<string, unknown> | null;
}) {
  return (
    <div>
      <div
        className="mb-2 font-mono text-[11px] font-medium uppercase tracking-[0.08em]"
        style={{ color }}
      >
        {label}
      </div>
      {data && Object.keys(data).length > 0 ? (
        Object.entries(data).map(([k, v]) => (
          <div key={k} className="flex gap-2 font-mono text-[11.5px] leading-relaxed">
            <span className="shrink-0 text-ink3">{k}:</span>
            <span className="break-all text-ink">
              {v == null ? 'aucun' : typeof v === 'object' ? JSON.stringify(v) : String(v)}
            </span>
          </div>
        ))
      ) : (
        <div className="font-mono text-[11.5px] text-ink3">aucun</div>
      )}
    </div>
  );
}

const CATEGORIES: { key: string; label: string }[] = [
  { key: '', label: 'Tout' },
  { key: 'grade', label: 'Notes' },
  { key: 'student', label: 'Étudiants' },
  { key: 'news', label: 'Actualités' },
  { key: 'attendance', label: 'Présence' },
  { key: 'admin', label: 'Admins' },
];

function AuditSkeleton() {
  return <div className="h-[480px] animate-pulse rounded-[16px] bg-sunken" />;
}

export default function AuditPage() {
  const role = useAdminRole();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [day, setDay] = useState<Date | null>(null);
  const [from, setFrom] = useState<string | undefined>(undefined);
  const [to, setTo] = useState<string | undefined>(undefined);
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading } = useAudit({
    action: category || undefined,
    from,
    to,
    page,
    pageSize: 50,
  });

  const entries = useMemo(() => data?.data ?? [], [data]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.who.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        (e.entityId ?? '').toLowerCase().includes(q)
    );
  }, [entries, search]);

  if (role && role !== 'SUPER_ADMIN') return <AccessDenied />;

  const total = data?.pagination.total ?? 0;
  const totalPages = data?.pagination.totalPages ?? 1;

  const exportCsv = () => {
    downloadCsv(
      `audit_log_${new Date().toISOString().slice(0, 10)}.csv`,
      ['date', 'heure', 'administrateur', 'action', 'entite', 'cible', 'adresse_ip'],
      filtered.map((e) => {
        const [date, heure] = fmtStamp(e.when).split(' ');
        return [date, heure, e.who, e.action, e.entityType, e.entityId ?? '', e.ipAddress ?? ''];
      })
    );
  };

  return (
    <>
      <PageHead
        title="Journal d'audit"
        sub="Toute action sensible est tracée · réservé au Super Admin"
        actions={
          <Button kind="ghost" icon={<Download size={17} />} onClick={exportCsv}>
            Exporter (CSV)
          </Button>
        }
      />

      {isLoading ? (
        <AuditSkeleton />
      ) : (
        <Card pad={0} className="overflow-visible">
          <div className="flex flex-wrap items-center gap-3 border-b border-hair p-4">
            <div className="w-[280px]">
              <TextInput
                icon={<Search size={15} />}
                placeholder="Rechercher par auteur, action, cible…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <Tabs
              tabs={CATEGORIES}
              active={category}
              onChange={(k) => {
                setCategory(k);
                setPage(1);
              }}
            />
            <DatePicker
              value={day}
              onChange={(d) => {
                const dayStart = new Date(d);
                dayStart.setHours(0, 0, 0, 0);
                const dayEnd = new Date(d);
                dayEnd.setHours(23, 59, 59, 999);
                setDay(d);
                setFrom(dayStart.toISOString());
                setTo(dayEnd.toISOString());
                setPage(1);
              }}
              presets
              onPreset={(f, t) => {
                setDay(null);
                setFrom(f.toISOString());
                setTo(t.toISOString());
                setPage(1);
              }}
              placeholder="Période"
            />
            <span className="ml-auto font-mono text-[12px] text-ink3">{total} entrées</span>
          </div>

          {filtered.length === 0 ? (
            <EmptyState icon={<ListX size={20} />} message="Aucune activité enregistrée." />
          ) : (
            <Table>
              <THead>
                <tr>
                  <Th>Action</Th>
                  <Th>Entité</Th>
                  <Th>Cible</Th>
                  <Th>Auteur</Th>
                  <Th>Adresse IP</Th>
                  <Th>Horodatage</Th>
                </tr>
              </THead>
              <tbody>
                {filtered.map((e) => {
                  const meta = verbMeta(e.action);
                  const [fg, bg] = TONE_COLORS[meta.tone];
                  const expanded = expandedId === e.id;
                  return (
                    <Fragment key={e.id}>
                      <TRow onClick={() => setExpandedId(expanded ? null : e.id)}>
                        <Td>
                          <div className="flex items-center gap-2">
                            <span
                              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px]"
                              style={{ background: bg, color: fg }}
                            >
                              {meta.icon}
                            </span>
                            <span className="font-mono text-[12px] text-ink">{e.action}</span>
                          </div>
                        </Td>
                        <Td>
                          <Badge tone="slate">{e.entityType}</Badge>
                        </Td>
                        <Td>
                          {e.entityId ? (
                            <span className="inline-block max-w-[140px] truncate align-middle font-mono text-[11px] text-ink2">
                              {e.entityId}
                            </span>
                          ) : (
                            <span className="text-[13px] text-ink3">—</span>
                          )}
                        </Td>
                        <Td>
                          <div className="flex items-center gap-2">
                            {e.who === 'Système' ? (
                              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface2 text-ink3">
                                <Settings size={13} />
                              </span>
                            ) : (
                              <Avatar name={e.who} size={24} />
                            )}
                            <span className="text-[13px] text-ink">{e.who}</span>
                          </div>
                        </Td>
                        <Td>
                          <span className="font-mono text-[12px] text-ink3">
                            {e.ipAddress ?? '—'}
                          </span>
                        </Td>
                        <Td>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-[12px] text-ink2">
                              {fmtStamp(e.when)}
                            </span>
                            <ChevronDown
                              size={14}
                              className={cn(
                                'shrink-0 text-ink3 transition-transform duration-150',
                                expanded && 'rotate-180'
                              )}
                            />
                          </div>
                        </Td>
                      </TRow>
                      {expanded && (
                        <tr>
                          <td colSpan={6} className="border-t border-hair">
                            <div className="bg-surface2 p-4">
                              <div className="grid grid-cols-2 gap-4">
                                <SnapshotBlock label="Avant" color="var(--danger)" data={e.before} />
                                <SnapshotBlock label="Après" color="var(--jade)" data={e.after} />
                              </div>
                              <div className="mt-3 border-t border-hair pt-2 font-mono text-[10.5px] text-ink3">
                                {e.id} · {e.entityType} · horodatage immuable
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </Table>
          )}

          <div className="flex items-center justify-between border-t border-hair p-4">
            <span className="font-mono text-[12px] text-ink3">
              Page {page} / {Math.max(totalPages, 1)}
            </span>
            <div className="flex gap-2">
              <Button
                kind="ghost"
                size="sm"
                icon={<ChevronLeft size={15} />}
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                Précédent
              </Button>
              <Button
                kind="ghost"
                size="sm"
                iconR={<ChevronRight size={15} />}
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Suivant
              </Button>
            </div>
          </div>
        </Card>
      )}
    </>
  );
}
