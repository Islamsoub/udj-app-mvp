import styles from './profile.module.css';

/**
 * The account half's footprint: the identity card (avatar and three lines),
 * then two fact cards of four rows. Built from the real card, row and avatar
 * classes, so nothing moves when the data crossfades in.
 */
export function ProfileSkeleton() {
  return (
    <>
      <div className={`${styles.card} ${styles.identity}`}>
        <div className={`${styles.skeleton} ${styles.avatar}`} />
        <div className={styles.identityText}>
          <div className={`${styles.skeleton} ${styles.skeletonName}`} />
          <div className={`${styles.skeleton} ${styles.skeletonShort}`} />
          <div className={`${styles.skeleton} ${styles.skeletonShort}`} />
        </div>
      </div>

      {[0, 1].map((group) => (
        <div key={group} className={styles.section}>
          <div className={`${styles.skeleton} ${styles.skeletonHeading}`} />
          <div className={`${styles.card} ${styles.facts}`}>
            {[0, 1, 2, 3].map((row) => (
              <div key={row} className={styles.fact}>
                <div className={`${styles.skeleton} ${styles.skeletonShort}`} />
                <div className={`${styles.skeleton} ${styles.skeletonValue}`} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
