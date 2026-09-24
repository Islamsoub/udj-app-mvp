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
 * NO "VIDER LE CACHE". §9 has one, but there is no cache: no service worker, no
 * local database, and the login screen's offline switch records a preference
 * nothing reads. What this browser does hold is the language, the theme and
 * that switch — preferences, each with its own control — plus the
 * `unipocket_seen_*` once-per-tab animation flags in sessionStorage, which the
 * tab clears itself. A button that "cleared the cache" would
 * either reset those, which is not what the words say, or clear nothing and
 * claim otherwise. It comes with the caching layer that gives it something to
 * clear, and §9's last-sync timestamp with it.
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
