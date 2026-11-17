'use client';

import { Interpolated } from '@/components/dashboard/Interpolated';
import { useI18n } from '@/lib/i18n';
import { UrgentIcon } from './icons';
import { categoryKey } from './model';
import { NewsDate } from './NewsDate';
import styles from './news.module.css';

/**
 * The category pill and, when set, the urgent flag. Shared by the news card,
 * the reader and the dashboard, so no two places describe one article
 * differently.
 *
 * Urgent is a word with an icon on a danger tint — §10: colour is never the only
 * signal.
 */
export function ArticleTags({ category, urgent }: { category: string; urgent: boolean }) {
  return (
    <span className={styles.tags}>
      {urgent && <UrgentPill />}
      <CategoryPill category={category} />
    </span>
  );
}

/**
 * The pills on their own, for a layout that places them itself (the dashboard's
 * article row). `className` sizes them; the tint always comes from here.
 */
export function UrgentPill({ className }: { className?: string }) {
  const { t } = useI18n();
  return (
    <span className={`${styles.pill} ${styles.pillUrgent} ${className ?? ''}`}>
      <UrgentIcon className={styles.pillIcon} />
      {t('news.urgent')}
    </span>
  );
}

export function CategoryPill({ category, className }: { category: string; className?: string }) {
  const { t } = useI18n();
  return (
    <span className={`${styles.pill} ${CATEGORY_CLASS[category] ?? styles.pillNeutral} ${className ?? ''}`}>
      {t(categoryKey(category))}
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
 * Tints from the existing status tokens, onto Design's three categories
 * (app.css:472-474):
 *
 *   official   -> cat-officiel   jade-faint / jade-text   5.56 : 1 / 6.31 : 1
 *   events     -> cat-evenement  info-bg / info-INK       5.84 : 1 / 5.48 : 1
 *   scolarite  -> cat-academique warning-bg / warning-INK 5.74 : 1 / 6.08 : 1
 *   sport, youth, sponsors, unknown -> neutral (sunken / ink2)
 *
 * Measured light / dark, 11-12px bold text on the tint over --surface. The -ink
 * variants stand where Design writes --info (3.21 : 1) or a hardcoded brown
 * (#9a5b06): the bare hues are under AA as text on their own tints.
 * scolarite was the exam tint until --warning-ink existed; it now takes
 * Design's académique hue, on the news screen too.
 */
const CATEGORY_CLASS: Record<string, string> = {
  official: styles.pillOfficial,
  events: styles.pillEvents,
  scolarite: styles.pillScolarite,
};
