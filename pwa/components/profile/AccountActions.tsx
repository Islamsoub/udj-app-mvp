'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { logout } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';
import { LogoutIcon } from './icons';
import { TileGroup, TileIcon } from './tiles';
import styles from './profile.module.css';

/**
 * "Compte", the prototype's group with its red "Se déconnecter" row (the
 * danger tile, the label in red). The same call and the same destination as
 * the avatar menu's, so the two cannot end a session differently.
 *
 * Not here (design-known-divergences.md): Design's "Télécharger mes données"
 * row. The "Sécurité" password form is its own card, SecurityCard, just above.
 */
export function AccountActions() {
  const { t } = useI18n();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  return (
    <TileGroup title={t('profile.account.title')}>
      <button
        type="button"
        className={`${styles.tileRow} ${styles.tileRowNav}`}
        disabled={leaving}
        onClick={async () => {
          setLeaving(true);
          // logout() never throws and always clears the local session, even
          // on a dead network — see lib/auth-client.
          await logout();
          router.replace('/login');
        }}
      >
        <TileIcon tone="danger">
          <LogoutIcon className={styles.tileGlyph} />
        </TileIcon>
        <span className={`${styles.trLabel} ${styles.logoutLabel}`}>{t('shell.logout')}</span>
      </button>
    </TileGroup>
  );
}
