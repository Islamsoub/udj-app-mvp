'use client';

import { Ban, Info, Pencil, Plus, RotateCcw } from 'lucide-react';
import { PageHead } from '@/components/shell/page-head';
import { Card } from '@/components/shared/card';
import { Avatar } from '@/components/shared/avatar';
import { AccessDenied } from '@/components/shared/access-denied';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, THead, Th, Td, TRow } from '@/components/ui/table';
import { Menu } from '@/components/ui/dropdown-menu';
import { AdminForm } from '@/components/forms/admin-form';
import { DeactivateAdminModal } from '@/components/modals/deactivate-admin-modal';
import { useModal } from '@/hooks/use-modal';
import { useToast } from '@/hooks/use-toast';
import { useAdmin, useAdminRole } from '@/hooks/use-admin';
import { useAdmins, useUpdateAdmin } from '@/hooks/queries/use-admins';
import { useFaculties } from '@/hooks/queries/use-academics';
import { ROLE_META } from '@/lib/constants';
import { apiErrorMessage, fmtRelative } from '@/lib/utils';
import type { AdminRole, AdminUser } from '@/lib/types';

/**
 * Administrators (impl spec §24) — SUPER_ADMIN only. Role legend cards +
 * admin table with "…" menu (edit role / deactivate / reactivate). Inactive
 * rows dim to 60%.
 */
const ROLE_ORDER = Object.keys(ROLE_META) as AdminRole[];

const SCOPE_FALLBACK: Record<AdminRole, string> = {
  SUPER_ADMIN: 'Direction',
  FACULTY_ADMIN: '—',
  REGISTRAR: 'Scolarité',
  NEWS_EDITOR: 'Communication',
};

function AdminsSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-4 gap-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[96px] animate-pulse rounded-[16px] bg-sunken" />
        ))}
      </div>
      <div className="h-[320px] animate-pulse rounded-[16px] bg-sunken" />
    </div>
  );
}

export default function AdminsPage() {
  const role = useAdminRole();
  const self = useAdmin();
  const { open } = useModal();
  const { toast } = useToast();
  const { data: admins, isLoading } = useAdmins();
  const { data: faculties } = useFaculties();
  const updateAdmin = useUpdateAdmin();

  if (role && role !== 'SUPER_ADMIN') return <AccessDenied />;

  const list = admins ?? [];
  const activeCount = list.filter((a) => a.isActive).length;

  const scopeOf = (a: AdminUser): string =>
    a.faculty?.nameFr ??
    faculties?.find((f) => f.id === a.facultyId)?.nameFr ??
    SCOPE_FALLBACK[a.role];

  const reactivate = async (id: string) => {
    try {
      await updateAdmin.mutateAsync({ id, data: { isActive: true } });
    } catch (err) {
      toast(apiErrorMessage(err), 'x');
    }
  };

  return (
    <>
      <PageHead
        title="Administrateurs"
        sub={`${activeCount} comptes actifs · gérés par le Super Admin`}
        actions={
          <Button kind="primary" icon={<Plus size={17} />} onClick={() => open(<AdminForm />)}>
            Nouvel administrateur
          </Button>
        }
      />

      {isLoading ? (
        <AdminsSkeleton />
      ) : (
        <>
          <div className="mb-4 grid grid-cols-4 gap-4">
            {ROLE_ORDER.map((r) => (
              <Card key={r} pad={16}>
                <Badge tone={ROLE_META[r].tone}>{ROLE_META[r].label}</Badge>
                <div className="mt-2 text-[16px] font-extrabold text-ink">
                  {list.filter((a) => a.role === r).length}
                </div>
                <div className="mt-1 text-[12px] text-ink2">{ROLE_META[r].scope}</div>
              </Card>
            ))}
          </div>

          <Card pad={0} className="overflow-hidden">
            <Table>
              <THead>
                <tr>
                  <Th>Administrateur</Th>
                  <Th>Rôle</Th>
                  <Th>Périmètre</Th>
                  <Th>Dernière connexion</Th>
                  <Th>Statut</Th>
                  <Th> </Th>
                </tr>
              </THead>
              <tbody>
                {list.map((a) => (
                  <TRow key={a.id} className={!a.isActive ? 'opacity-60' : undefined}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={a.name} size={32} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="truncate text-[13.5px] font-semibold text-ink">
                              {a.name}
                            </span>
                            {self && a.id === self.id && <Badge tone="slate">Vous</Badge>}
                          </div>
                          <div className="truncate text-[12px] text-ink3">{a.email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Badge tone={ROLE_META[a.role].tone}>{ROLE_META[a.role].label}</Badge>
                    </Td>
                    <Td>
                      <span className="text-[13px] text-ink2">{scopeOf(a)}</span>
                    </Td>
                    <Td>
                      {a.lastLoginAt ? (
                        <span className="font-mono text-[12px] text-ink2">
                          {fmtRelative(a.lastLoginAt)}
                        </span>
                      ) : (
                        <span className="text-[13px] text-ink3">—</span>
                      )}
                    </Td>
                    <Td>
                      <span className="inline-flex items-center gap-2 text-[12.5px] text-ink2">
                        <span
                          className={`inline-block h-2 w-2 rounded-full ${a.isActive ? 'bg-jade' : 'bg-hair2'}`}
                        />
                        {a.isActive ? 'Actif' : 'Inactif'}
                      </span>
                    </Td>
                    <Td className="w-10 text-end">
                      <Menu
                        items={[
                          {
                            icon: <Pencil size={15} />,
                            label: 'Modifier le rôle',
                            onClick: () => open(<AdminForm admin={a} />),
                          },
                          { divider: true },
                          a.isActive
                            ? {
                                icon: <Ban size={15} />,
                                label: 'Désactiver',
                                tone: 'danger' as const,
                                onClick: () => open(<DeactivateAdminModal admin={a} />),
                              }
                            : {
                                icon: <RotateCcw size={15} />,
                                label: 'Réactiver',
                                onClick: () => reactivate(a.id),
                              },
                        ]}
                      />
                    </Td>
                  </TRow>
                ))}
              </tbody>
            </Table>
          </Card>

          <Card pad={14} className="mt-4 flex items-start gap-3">
            <Info size={16} className="mt-[2px] shrink-0 text-blue" />
            <div className="text-[12.5px] leading-relaxed text-ink2">
              Les changements de rôle sont tracés dans le journal d&rsquo;audit. Seul un Super
              Admin peut créer ou désactiver un compte.
            </div>
          </Card>
        </>
      )}
    </>
  );
}
