'use client';

import { useEffect, useRef, useState } from 'react';
import { KeyRound, LogOut, UserCircle } from 'lucide-react';
import { Avatar } from '@/components/shared/avatar';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/hooks/use-admin';
import { useLogout } from '@/hooks/use-auth';
import { useModal } from '@/hooks/use-modal';
import { ProfileModal } from '@/components/modals/profile-modal';
import { PasswordModal } from '@/components/modals/password-modal';
import { ROLE_META } from '@/lib/constants';

/**
 * AvatarMenu (impl spec §7): 34px avatar. Popover 240px — name + email +
 * role badge; Mon profil (→ProfileModal), Changer le mot de passe
 * (→PasswordModal), divider, Se déconnecter (danger, no confirm).
 */
export function AvatarMenu() {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const admin = useAdmin();
  const logout = useLogout();
  const { open: openModal } = useModal();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  if (!admin) return null;

  const item = (icon: React.ReactNode, label: string, onClick: () => void, danger?: boolean) => (
    <button
      type="button"
      onClick={() => {
        setOpen(false);
        onClick();
      }}
      className={`flex w-full cursor-pointer items-center gap-[9px] border-0 bg-transparent px-4 py-[8px] text-left text-[13.5px] transition-colors ${
        danger ? 'text-danger hover:bg-danger-bg' : 'text-ink hover:bg-surface2'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer rounded-full border-0 bg-transparent p-0"
        aria-label="Menu utilisateur"
      >
        <Avatar name={admin.name} size={34} />
      </button>
      {open && (
        <div className="absolute right-0 z-50 mt-[6px] w-[240px] rounded-[13px] border border-hair bg-surface py-2 shadow-lg">
          <div className="border-b border-hair px-4 pb-3 pt-1">
            <div className="text-[13.5px] font-bold text-ink">{admin.name}</div>
            <div className="mb-[6px] truncate text-[12px] text-ink2">{admin.email}</div>
            <Badge tone={ROLE_META[admin.role].tone}>{admin.roleLabel}</Badge>
          </div>
          <div className="pt-1">
            {item(<UserCircle size={15} />, 'Mon profil', () => openModal(<ProfileModal />))}
            {item(<KeyRound size={15} />, 'Changer le mot de passe', () => openModal(<PasswordModal />))}
            <div className="my-1 border-t border-hair" />
            {item(<LogOut size={15} />, 'Se déconnecter', logout, true)}
          </div>
        </div>
      )}
    </div>
  );
}
