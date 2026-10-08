'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { Toast } from '@/components/shell/Toast';
import { useI18n } from '@/lib/i18n';
import { InstallBanner } from './InstallBanner';
import { acceptUpdate, startServiceWorker } from './service-worker';

/**
 * The installable-app layer, mounted once in the root layout so it covers the
 * login screen as well as the authenticated shell:
 *
 *   • the install banner, above everything else in the page (§8);
 *   • service-worker registration, after first paint and production only;
 *   • the "new version" toast, shown when an updated worker is waiting. Nothing
 *     changes under the student until they click it — see public/sw.js.
 *
 * App shell only. Nothing here reads or writes personal data, and nothing reads
 * the login screen's offline-data switch.
 */
export function PwaLayer({ children }: { children: ReactNode }) {
  const { t } = useI18n();
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null);

  useEffect(() => startServiceWorker(setWaiting), []);

  return (
    <>
      <InstallBanner />
      {children}
      <Toast
        message={waiting === null ? null : t('pwa.update.message')}
        onDone={() => setWaiting(null)}
        action={
          waiting === null
            ? undefined
            : { label: t('pwa.update.action'), onClick: () => acceptUpdate(waiting) }
        }
      />
    </>
  );
}
