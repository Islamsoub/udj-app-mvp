'use client';

import Link from 'next/link';
import { useI18n } from '@/lib/i18n';
import styles from './not-found.module.css';

/**
 * Any address the app has no page for. Without this file Next served its own
 * black page in English ("404 | This page could not be found.") with no way
 * back, in both languages. It renders inside the root layout, so the language,
 * direction and theme are the student's own.
 */
export default function NotFound() {
  const { t } = useI18n();
  return (
    <main className={styles.page}>
      <div className={styles.card}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/icons/favicon.svg" alt="" width={48} height={48} className={styles.mark} />
        <p className={styles.code} aria-hidden="true">
          404
        </p>
        <h1 className={styles.title}>{t('not_found.title')}</h1>
        <p className={styles.body}>{t('not_found.body')}</p>
        <Link href="/" className={styles.home}>
          {t('not_found.home')}
        </Link>
      </div>
    </main>
  );
}
