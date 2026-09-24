'use client';

import { Interpolated } from '@/components/dashboard/Interpolated';
import { useI18n } from '@/lib/i18n';
import { UrgentIcon } from './icons';
import { categoryKey } from './model';
import { NewsDate } from './NewsDate';
import styles from './news.module.css';

/**
 * The category pill and, when set, the urgent flag. Shared by the card and the
 * reader so the two never describe one article differently.
 *
 * Urgent is a word with an icon on a danger tint — §10: colour is never the only
 * signal.
 */
export function ArticleTags({ category, urgent }: { category: string; urgent: boolean }) {
  const { t } = useI18n();

  return (
    <span className={styles.tags}>
      {urgent && (
        <span className={`${styles.pill} ${styles.pillUrgent}`}>
          <UrgentIcon className={styles.pillIcon} />
          {t('news.urgent')}
        </span>
      )}
      <span className={`${styles.pill} ${CATEGORY_CLASS[category] ?? styles.pillNeutral}`}>
        {t(categoryKey(category))}
      </span>
    </span>
  );
}

/** Date and read time. Both figures go through `.num` (Interpolated, NewsDate),
 *  so they stay on the Latin face in Arabic. */
export function ArticleMeta({ publishedAt, readTime }: { publishedAt: string; readTime: number }) {
  const { t } = useI18n();

  return (
    <span className={styles.meta}>
      <NewsDate iso={publishedAt} />
      <span aria-hidden="true">·</span>
      <Interpolated template={t('news.read_time')} values={{ count: readTime }} />
    </span>
  );
}

/*
 * Tints from the existing status tokens, following the prototype's pairing
 * where it has one (officiel -> jade, événement -> info). No warning tint: the
 * warning token on its own background is below AA for 11px text, which is why
 * the prototype had to hardcode a darker brown for it — not an option here.
 */
const CATEGORY_CLASS: Record<string, string> = {
  official: styles.pillOfficial,
  events: styles.pillEvents,
  scolarite: styles.pillScolarite,
};
