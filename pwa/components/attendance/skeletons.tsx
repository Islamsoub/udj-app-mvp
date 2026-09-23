import styles from './attendance.module.css';

/**
 * §5: "Skeleton blocks (gray rounded rectangles matching each real element's
 * footprint)." The footprints below are the real ones — the 132px ring, the 44px
 * segmented strip, the bar rows — so nothing resizes when the data lands.
 *
 * All blocks share one animation name and therefore one timeline, which is what
 * makes §5's "sweeps left->right across every skeleton block in parallel" true
 * rather than each block starting from its own mount.
 */

function Block({ className }: { className: string }) {
  return <div className={`${styles.skeleton} ${className}`} />;
}

export function AttendanceSkeleton() {
  return (
    <>
      <div className={styles.skeletonHero}>
        <Block className={styles.skeletonRing} />
        <div className={styles.skeletonHeroText}>
          <Block className={styles.skeletonLineShort} />
          <Block className={styles.skeletonLineHero} />
          <Block className={styles.skeletonLineMedium} />
          <Block className={styles.skeletonLineShort} />
        </div>
      </div>

      <div className={styles.section}>
        <Block className={styles.skeletonHeading} />
        <div className={styles.skeletonRows}>
          {/* Four, not eight. The skeleton stands for "a list is coming", and a
              full-length one on a screen this tall is a wall of grey. */}
          {[0, 1, 2, 3].map((n) => (
            <Block key={n} className={styles.skeletonSubject} />
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <div className={styles.absencesHead}>
          <Block className={styles.skeletonHeading} />
          <Block className={styles.skeletonStrip} />
        </div>
        <div className={styles.skeletonRows}>
          {[0, 1, 2].map((n) => (
            <Block key={n} className={styles.skeletonAbsence} />
          ))}
        </div>
      </div>
    </>
  );
}
