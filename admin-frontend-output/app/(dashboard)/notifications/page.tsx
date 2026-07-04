'use client';

import { useState } from 'react';
import { Bell, Check, ChevronDown, Search, Send } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { SectionLabel } from '@/components/shared/section-label';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import { TextInput, TextArea } from '@/components/ui/input';
import { FField } from '@/components/ui/form-helpers';
import { Dropdown } from '@/components/ui/select';
import { Chip } from '@/components/ui/tabs';
import { Tooltip } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useFaculties, useProgrammes } from '@/hooks/queries/use-academics';
import { useStudents } from '@/hooks/queries/use-students';
import { useNotificationHistory, useSendNotification } from '@/hooks/queries/use-notifications';
import { NOTIFICATION_TARGETS } from '@/lib/constants';
import { cn, apiErrorMessage, fmtDateTime, fmtNumber, fmtRelative } from '@/lib/utils';
import type { NotificationTarget, SendNotificationInput } from '@/lib/types';

/**
 * Notifications composer (impl spec §23, supplement §6.1 + §11). Target cards
 * with contextual pickers, live phone preview, expandable send history.
 * "Planifier" is deferred (tooltip + toast).
 */
interface StudentChip {
  id: string;
  name: string;
}

const targetLabel = (t: NotificationTarget | null): string =>
  NOTIFICATION_TARGETS.find((x) => x.key === t)?.label ?? '—';

export default function NotificationsPage() {
  const { toast } = useToast();
  const [target, setTarget] = useState<NotificationTarget>('all');
  const [facultyId, setFacultyId] = useState('');
  const [programmeId, setProgrammeId] = useState('');
  const [chips, setChips] = useState<StudentChip[]>([]);
  const [studentSearch, setStudentSearch] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: faculties } = useFaculties();
  const { data: programmes } = useProgrammes(facultyId || undefined);
  const { data: searchPage } = useStudents({ search: studentSearch, pageSize: 6 });
  const { data: allPage } = useStudents({ pageSize: 1 });
  const { data: facultyPage } = useStudents({ faculty: facultyId || undefined, pageSize: 1 });
  const { data: programmePage } = useStudents({ programme: programmeId || undefined, pageSize: 1 });
  const sendNotification = useSendNotification();
  const { data: history } = useNotificationHistory();

  const count =
    target === 'all'
      ? allPage?.pagination.total ?? 0
      : target === 'faculty'
        ? facultyId
          ? facultyPage?.pagination.total ?? 0
          : 0
        : target === 'programme'
          ? programmeId
            ? programmePage?.pagination.total ?? 0
            : 0
          : chips.length;

  const results = (searchPage?.data ?? []).filter((s) => !chips.some((c) => c.id === s.id));
  const canSend = !!title.trim() && !!body.trim() && count > 0 && !sendNotification.isPending;

  const onSend = async () => {
    const input: SendNotificationInput = {
      target,
      title: title.trim(),
      body: body.trim(),
    };
    if (target === 'faculty') input.facultyId = facultyId;
    if (target === 'programme') input.programmeId = programmeId;
    if (target === 'students') input.studentIds = chips.map((c) => c.id);
    try {
      await sendNotification.mutateAsync(input);
      setTitle('');
      setBody('');
      setChips([]);
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  return (
    <>
      <PageHead title="Notifications" sub="Envoyez une notification push aux étudiants" />

      <div className="grid grid-cols-[1fr_340px] gap-5">
        {/* ─── Composer ──────────────────────────────────────────────────── */}
        <div className="flex flex-col gap-5">
          <Card>
            <div className="mb-3 text-[15.5px] font-bold text-ink">Destinataires</div>
            <div className="grid grid-cols-2 gap-3">
              {NOTIFICATION_TARGETS.map((t) => {
                const active = t.key === target;
                return (
                  <button
                    key={t.key}
                    type="button"
                    onClick={() => setTarget(t.key)}
                    className={cn(
                      'relative cursor-pointer rounded-[13px] border p-4 text-left transition-colors',
                      active ? 'border-jade bg-jade-faint' : 'border-hair2 bg-transparent hover:bg-surface2'
                    )}
                  >
                    {active && (
                      <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-jade">
                        <Check size={12} strokeWidth={3} className="text-white" />
                      </span>
                    )}
                    <div className="text-[13.5px] font-bold text-ink">{t.label}</div>
                    <div className="mt-[2px] text-[12px] text-ink2">{t.desc}</div>
                  </button>
                );
              })}
            </div>

            {target === 'faculty' && (
              <div className="mt-4">
                <FField label="Faculté" required>
                  <Dropdown
                    value={facultyId}
                    onChange={setFacultyId}
                    options={(faculties ?? []).map((f) => ({ value: f.id, label: f.nameFr }))}
                    placeholder="Sélectionner une faculté…"
                  />
                </FField>
              </div>
            )}

            {target === 'programme' && (
              <div className="mt-4 grid grid-cols-2 gap-[14px]">
                <FField label="Faculté" required>
                  <Dropdown
                    value={facultyId}
                    onChange={(v) => {
                      setFacultyId(v);
                      setProgrammeId('');
                    }}
                    options={(faculties ?? []).map((f) => ({ value: f.id, label: f.nameFr }))}
                    placeholder="Sélectionner…"
                  />
                </FField>
                <FField label="Programme" required>
                  <Dropdown
                    value={programmeId}
                    onChange={setProgrammeId}
                    options={(programmes ?? []).map((p) => ({ value: p.id, label: p.nameFr }))}
                    placeholder="Sélectionner…"
                    disabled={!facultyId}
                  />
                </FField>
              </div>
            )}

            {target === 'students' && (
              <div className="mt-4">
                <FField label="Rechercher un étudiant">
                  <div className="relative">
                    <TextInput
                      icon={<Search size={15} />}
                      placeholder="Nom ou matricule…"
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                    />
                    {studentSearch.trim() !== '' && results.length > 0 && (
                      <div className="absolute left-0 right-0 z-30 mt-[6px] max-h-[260px] overflow-y-auto rounded-[11px] border border-hair bg-surface py-[5px] shadow-lg">
                        {results.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            className="flex w-full cursor-pointer items-center justify-between gap-2 border-0 bg-transparent px-[13px] py-[8px] text-left transition-colors hover:bg-surface2"
                            onClick={() => {
                              setChips((prev) => [...prev, { id: s.id, name: s.name }]);
                              setStudentSearch('');
                            }}
                          >
                            <span className="text-[13px] text-ink">{s.name}</span>
                            <span className="font-mono text-[11px] text-ink3">{s.matricule}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </FField>
                {chips.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-[6px]">
                    {chips.map((c) => (
                      <Chip
                        key={c.id}
                        onRemove={() => setChips((prev) => prev.filter((x) => x.id !== c.id))}
                      >
                        {c.name}
                      </Chip>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 border-t border-hair pt-3 text-[13px] text-ink2">
              Sera envoyé à <b className="text-ink">{fmtNumber(count)}</b> étudiants
            </div>
          </Card>

          <Card>
            <div className="mb-3 text-[15.5px] font-bold text-ink">Message</div>
            <div className="mb-[14px]">
              <FField label="Titre" required>
                <TextInput
                  maxLength={120}
                  placeholder="Titre de la notification"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </FField>
            </div>
            <FField label="Message" required>
              <TextArea
                maxLength={180}
                rows={4}
                placeholder="Votre message…"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
            </FField>
            <div className="mt-1 text-right font-mono text-[11px] text-ink3">{body.length}/180</div>
            <div className="mt-3 flex items-center justify-between border-t border-hair pt-3">
              <Tooltip label="Envoi planifié disponible prochainement">
                <Button
                  kind="ghost"
                  onClick={() => toast('Envoi planifié disponible prochainement')}
                >
                  Planifier
                </Button>
              </Tooltip>
              <Button kind="primary" icon={<Send size={17} />} disabled={!canSend} onClick={onSend}>
                Envoyer maintenant
              </Button>
            </div>
          </Card>
        </div>

        {/* ─── Phone preview ─────────────────────────────────────────────── */}
        <div>
          <div
            className="mx-auto w-[280px] rounded-[36px] p-4"
            style={{ background: 'var(--ink)', aspectRatio: '340 / 560' }}
          >
            <div className="mx-auto h-[4px] w-16 rounded-full bg-[rgba(255,255,255,0.25)]" />
            <div
              className="mt-4 text-center font-mono text-[10px]"
              style={{ color: 'rgba(255,255,255,0.5)' }}
            >
              maintenant
            </div>
            <div
              className="mt-2 rounded-[16px] p-3"
              style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
            >
              <div className="flex items-start gap-2">
                <span
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[8px] text-[13px] font-extrabold text-white"
                  style={{ background: 'linear-gradient(135deg, var(--jade), var(--jade6))' }}
                >
                  U
                </span>
                <div className="min-w-0 flex-1">
                  <div className="text-[10.5px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                    Unipocket · à l&rsquo;instant
                  </div>
                  <div className="mt-[2px] break-words text-[12.5px] font-bold text-white">
                    {title.trim() || 'Titre de la notification'}
                  </div>
                  <div
                    className="mt-[2px] break-words text-[11.5px] leading-snug"
                    style={{ color: 'rgba(255,255,255,0.75)' }}
                  >
                    {body.trim() || 'Votre message apparaîtra ici…'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Historique ──────────────────────────────────────────────────── */}
      <Card pad={0} className="mt-5">
        <div className="p-4 text-[15.5px] font-bold text-ink">Historique des envois</div>
        {(history ?? []).length === 0 ? (
          <EmptyState icon={<Bell size={20} />} message="Aucune notification envoyée." />
        ) : (
          (history ?? []).map((h) => {
            const expanded = expandedId === h.id;
            return (
              <div key={h.id} className="border-t border-hair">
                <button
                  type="button"
                  className="flex w-full cursor-pointer items-center gap-3 border-0 bg-transparent px-4 py-3 text-left transition-colors hover:bg-surface2"
                  onClick={() => setExpandedId(expanded ? null : h.id)}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-jade-faint text-jade-text">
                    <Bell size={16} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[13.5px] font-semibold text-ink">
                      {h.title ?? 'Notification'}
                    </div>
                    <div className="text-[12px] text-ink3">
                      {targetLabel(h.target)} · {fmtNumber(h.count)} reçus
                    </div>
                  </div>
                  <span className="font-mono text-[11px] text-ink3">{fmtRelative(h.when)}</span>
                  <ChevronDown
                    size={15}
                    className={cn('shrink-0 text-ink3 transition-transform duration-150', expanded && 'rotate-180')}
                  />
                </button>
                {expanded && (
                  <div className="grid grid-cols-2 gap-3 bg-surface2 p-4 text-[12.5px]">
                    <div>
                      <SectionLabel>Cible</SectionLabel>
                      <div className="mt-[2px] text-ink">{targetLabel(h.target)}</div>
                    </div>
                    <div>
                      <SectionLabel>Destinataires</SectionLabel>
                      <div className="mt-[2px] font-mono text-ink">{fmtNumber(h.count)}</div>
                    </div>
                    <div>
                      <SectionLabel>Envoyé le</SectionLabel>
                      <div className="mt-[2px] text-ink">{fmtDateTime(h.when)}</div>
                    </div>
                    <div>
                      <SectionLabel>Par</SectionLabel>
                      <div className="mt-[2px] text-ink">{h.sentBy}</div>
                    </div>
                    <div>
                      <SectionLabel>Statut</SectionLabel>
                      <div className="mt-[2px] text-jade-text">✓ Envoyé via FCM</div>
                    </div>
                    <div>
                      <SectionLabel>Corps</SectionLabel>
                      <div className="mt-[2px] text-ink2">{h.body ?? '—'}</div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </Card>
    </>
  );
}
