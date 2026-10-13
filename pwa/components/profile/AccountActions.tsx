'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogoutIcon } from '@/components/shell/icons';
import { logout } from '@/lib/auth-client';
import { useI18n } from '@/lib/i18n';
import styles from './profile.module.css';

/**
 * The account's one action: sign out — the same call and the same destination
 * as the avatar menu's, so the two cannot end a session differently.
 *
 * NO "VIDER LE CACHE". The one cache of personal data is the consent-gated
 * offline store (lib/offline-cache), and it already has its control: switching
 * "Garder mes données hors ligne" off, in Appearance above, empties it at once,
 * and signing out here empties it too. A second button for the same store would
 * be two controls for one thing. Everything else this browser holds is a
 * preference with its own control, or the `unipocket_seen_*` once-per-tab
 * animation flags in sessionStorage, which the tab clears itself.
 */
export function AccountActions() {
  const { t } = useI18n();
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);

  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{t('profile.account.title')}</h2>

      <div className={styles.card}>
        <button
          type="button"
          className={styles.logout}
          disabled={leaving}
          onClick={async () => {
            setLeaving(true);
            // logout() never throws and always clears the local session, even
            // on a dead network — see lib/auth-client.
            await logout();
            router.replace('/login');
          }}
        >
          <LogoutIcon className={styles.logoutIcon} />
          {t('shell.logout')}
        </button>
      </div>
    </section>
  );
}
