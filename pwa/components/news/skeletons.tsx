import styles from './news.module.css';

/**
 * §5: "Skeleton blocks ... matching each real element's footprint." The chips'
 * row and the cards use the real classes for their boxes — the same grid, the
 * same image aspect ratio, the same padding — so nothing moves when the list
 * crossfades in. Every block shares one animation name, so they sweep in
 * parallel on one timeline.
 */

const SKELETON_CARDS = 4;

export function NewsSkeleton() {
  return (
    <>
      <div className={styles.chips}>
        <div className={`${styles.skeleton} ${styles.skeletonChip}`} />
        <div className={`${styles.skeleton} ${styles.skeletonChip}`} />
        <div className={`${styles.skeleton} ${styles.skeletonChip}`} />
      </div>

      <ul className={styles.grid}>
        {Array.from({ length: SKELETON_CARDS }, (_, index) => (
          <li key={index} className={styles.gridItem}>
            <div className={styles.skeletonCard}>
              <div className={`${styles.skeleton} ${styles.cardHero}`} />
              <div className={styles.cardBody}>
                <div className={`${styles.skeleton} ${styles.skeletonPill}`} />
                <div className={`${styles.skeleton} ${styles.skeletonTitle}`} />
                <div className={`${styles.skeleton} ${styles.skeletonMeta}`} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
